// Rankev API client — plain fetch, base URL from env, auto token refresh.
// Works under Vite (import.meta.env.VITE_API_URL) or CRA (process.env.REACT_APP_API_URL).

function readEnv() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch {
    /* import.meta not available */
  }
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  return 'http://localhost:3000';
}

export const BASE_URL = readEnv().replace(/\/$/, '');
export const WS_URL = BASE_URL.replace(/^http/, 'ws');

const ACCESS_KEY = 'rankev.accessToken';
const REFRESH_KEY = 'rankev.refreshToken';

export function getAccessToken() {
  try { return localStorage.getItem(ACCESS_KEY); } catch { return null; }
}
function getRefreshToken() {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}
export function setTokens({ accessToken, refreshToken }) {
  try {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  } catch { /* ignore */ }
}
export function clearTokens() {
  try { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); } catch { /* ignore */ }
}
export function isLoggedIn() { return Boolean(getAccessToken()); }

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status; this.code = code; this.details = details;
  }
}

// Called when refresh fails / session is unrecoverable. App can register a handler
// to redirect back to the login screen.
let onAuthLost = null;
export function setAuthLostHandler(fn) { onAuthLost = fn; }

let refreshPromise = null;
async function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        setTokens(data);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const { auth = true, retry = true, headers = {}, body, ...rest } = options;
  const h = { ...headers };
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm && !h['Content-Type']) h['Content-Type'] = 'application/json';
  if (auth) {
    const t = getAccessToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: h,
    credentials: 'include',
    body: body === undefined || isForm ? body : JSON.stringify(body),
  });

  if (res.status === 401 && auth && retry) {
    const refreshed = await doRefresh();
    if (refreshed) return apiFetch(path, { ...options, retry: false });
    clearTokens();
    if (onAuthLost) onAuthLost();
    throw await toError(res);
  }
  if (!res.ok) throw await toError(res);
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

async function toError(res) {
  let code = 'ERROR', message = res.statusText || 'Request failed', details;
  try {
    const b = await res.json();
    if (b && b.error) { code = b.error.code || code; message = b.error.message || message; details = b.error.details; }
  } catch { /* non-json */ }
  return new ApiError(res.status, code, message, details);
}

// ---------------- Auth ----------------
export const auth = {
  async register(handle, name, email, password) {
    const data = await apiFetch('/auth/register', { auth: false, method: 'POST', body: { handle, name, email, password } });
    setTokens(data);
    return data.user;
  },
  async login(email, password) {
    const data = await apiFetch('/auth/login', { auth: false, method: 'POST', body: { email, password } });
    setTokens(data);
    return data.user;
  },
  async logout() {
    const refreshToken = getRefreshToken();
    try { await apiFetch('/auth/logout', { auth: false, method: 'DELETE', body: { refreshToken } }); } catch { /* ignore */ }
    clearTokens();
  },
  me() { return apiFetch('/users/me'); }, // → { user, rankUps }
  updateProfile(patch) { return apiFetch('/users/me', { method: 'PATCH', body: patch }); },
};

// ---------------- Posts / Feed ----------------
export const posts = {
  feed(cursor, type) {
    const q = new URLSearchParams({ limit: '20' });
    if (cursor) q.set('cursor', cursor);
    if (type) q.set('type', type);
    return apiFetch(`/feed?${q.toString()}`);
  },
  get(id) { return apiFetch(`/posts/${id}`); },
  create(body) { return apiFetch('/posts', { method: 'POST', body }); },
  update(id, body) { return apiFetch(`/posts/${id}`, { method: 'PATCH', body }); },
  remove(id) { return apiFetch(`/posts/${id}`, { method: 'DELETE' }); },
  byUser(userId) { return apiFetch(`/users/${userId}/posts`); },
  mine() { return apiFetch('/users/me/posts'); },
};

// ---------------- Rankie vote ----------------
export const rankies = {
  vote(id, optionIds) { return apiFetch(`/rankies/${id}/vote`, { method: 'POST', body: { optionIds } }); },
  myVote(id) { return apiFetch(`/rankies/${id}/votes/me`); },
  results(id) { return apiFetch(`/rankies/${id}/results`); },
};

// ---------------- Path ----------------
export const paths = {
  complete(id, endingName, previousEnding) {
    return apiFetch(`/paths/${id}/complete`, { method: 'POST', body: { endingName, previousEnding } });
  },
  unlocks(id) { return apiFetch(`/paths/${id}/unlocks/me`); },
  companions(id, endingName) {
    return endingName
      ? apiFetch(`/paths/${id}/companions/${encodeURIComponent(endingName)}`)
      : apiFetch(`/paths/${id}/companions`);
  },
};

// ---------------- Deck (Survey/Exam) ----------------
export const decks = {
  submit(id, payload) { return apiFetch(`/decks/${id}/submit`, { method: 'POST', body: payload }); },
  myResult(id) { return apiFetch(`/decks/${id}/my-result`); },
  stats(id) { return apiFetch(`/decks/${id}/stats`); },
};

// ---------------- Comments / Bookmarks / Social ----------------
export const comments = {
  list(postId, opts = {}) {
    const q = new URLSearchParams();
    if (opts.cursor) q.set('cursor', opts.cursor);
    if (opts.ending) q.set('ending', opts.ending);
    if (opts.parentId) q.set('parentId', opts.parentId);
    return apiFetch(`/posts/${postId}/comments?${q.toString()}`);
  },
  create(postId, body) { return apiFetch(`/posts/${postId}/comments`, { method: 'POST', body }); },
  rank(id, vote) { return apiFetch(`/comments/${id}/rank`, { method: 'PATCH', body: { vote } }); },
  remove(id) { return apiFetch(`/comments/${id}`, { method: 'DELETE' }); },
};

export const bookmarks = {
  list() { return apiFetch('/users/me/bookmarks'); },
  add(postId) { return apiFetch(`/posts/${postId}/bookmark`, { method: 'POST' }); },
  remove(postId) { return apiFetch(`/posts/${postId}/bookmark`, { method: 'DELETE' }); },
};

export const social = {
  rankUp(authorId, tier) { return apiFetch(`/users/${authorId}/rankup`, { method: 'POST', body: { tier } }); },
  history() { return apiFetch('/users/me/history'); },
};

export const series = {
  get(id) { return apiFetch(`/series/${id}`); },
  mine() { return apiFetch('/series/mine'); }, // → { items: [{ id, name, postCount }] }
  create(name) { return apiFetch('/series', { method: 'POST', body: { name } }); },
  addPost(id, postId) { return apiFetch(`/series/${id}/posts`, { method: 'POST', body: { postId } }); },
};

export const sessions = {
  mine() { return apiFetch('/users/me/sessions'); },
  create(postId, body) { return apiFetch(`/posts/${postId}/sessions`, { method: 'POST', body }); },
};

// ---------------- Live presentation sessions (join by code) ----------------
export const live = {
  create(postId, name) { return apiFetch('/live-sessions', { method: 'POST', body: { postId, name } }); },
  byCode(code) { return apiFetch(`/live-sessions/code/${encodeURIComponent(code)}`, { auth: false }); },
  join(sessionId, name) { return apiFetch(`/live-sessions/${sessionId}/join`, { auth: false, method: 'POST', body: { name } }); },
  submit(sessionId, participantId, answers) { return apiFetch(`/live-sessions/${sessionId}/participants/${participantId}/answers`, { auth: false, method: 'POST', body: { answers } }); },
  results(sessionId) { return apiFetch(`/live-sessions/${sessionId}/results`); },
  end(sessionId) { return apiFetch(`/live-sessions/${sessionId}/end`, { method: 'POST' }); },
};

// ---------------- Uploads ----------------
export async function uploadImage(file, kind = 'image') {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch(`/uploads/${kind === 'scene' ? 'scene' : 'image'}`, { method: 'POST', body: fd });
}

// ---------------- Realtime (single shared WebSocket) ----------------
let ws = null;
let wsReady = false;
const pending = [];
const roomHandlers = new Map(); // rankieId → Set(handler)

function ensureSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  const token = getAccessToken();
  try {
    ws = new WebSocket(`${WS_URL}/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`);
  } catch {
    ws = null;
    return;
  }
  wsReady = false;
  ws.onopen = () => {
    wsReady = true;
    // re-subscribe existing rooms + flush queued messages
    for (const rankieId of roomHandlers.keys()) ws.send(JSON.stringify({ type: 'subscribe_rankie', rankieId }));
    while (pending.length) ws.send(pending.shift());
  };
  ws.onmessage = (e) => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.type === 'vote_update' && roomHandlers.has(m.rankieId)) {
      for (const h of roomHandlers.get(m.rankieId)) { try { h(m.options); } catch { /* */ } }
    }
  };
  ws.onclose = () => { wsReady = false; ws = null; };
  ws.onerror = () => { /* swallow; REST still works */ };
}

function wsSend(obj) {
  ensureSocket();
  const msg = JSON.stringify(obj);
  if (ws && wsReady && ws.readyState === WebSocket.OPEN) ws.send(msg);
  else pending.push(msg);
}

/** Subscribe to live vote updates for a rankie. Returns an unsubscribe fn. */
export function subscribeRankie(rankieId, onUpdate) {
  if (!roomHandlers.has(rankieId)) {
    roomHandlers.set(rankieId, new Set());
    wsSend({ type: 'subscribe_rankie', rankieId });
  }
  roomHandlers.get(rankieId).add(onUpdate);
  return () => {
    const set = roomHandlers.get(rankieId);
    if (!set) return;
    set.delete(onUpdate);
    if (set.size === 0) {
      roomHandlers.delete(rankieId);
      wsSend({ type: 'unsubscribe_rankie', rankieId });
    }
  };
}

/** Cast a vote over WebSocket (server broadcasts vote_update). */
export function voteRealtime(rankieId, optionIds) {
  wsSend({ type: 'vote', rankieId, optionIds });
}

export default {
  BASE_URL, WS_URL, apiFetch, isLoggedIn, getAccessToken, clearTokens, setAuthLostHandler,
  auth, posts, rankies, paths, decks, comments, bookmarks, social, series, sessions, live,
  uploadImage, subscribeRankie, voteRealtime, ApiError,
};
