import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, CartesianGrid,
} from "recharts";
import {
  Home, GitBranch, PlusCircle, User, Flame, MessageCircle, Share2, ChevronLeft,
  QrCode, Users, Clock, Lock, Globe, Trophy, ChevronRight, Check,
  ImagePlus, X, Monitor, Play, Pause, Eye, EyeOff, ChevronsUp, ChevronsDown, Layers, Search, SlidersHorizontal, ChevronDown, BarChart3,
  MoreVertical, Pin, PinOff, Trash2, Copy, Edit3, Link2, Download, ArchiveRestore, AlertTriangle,
  Send, Phone, Video, ArrowLeft, Smile, Image as ImageIcon, Grid3x3,
  Megaphone, MonitorOff, Star, LogOut,
} from "lucide-react";
import api, { auth, setAuthLostHandler } from "./api.js";

// ---------- DESIGN TOKENS ----------
const C = {
  bg: "#101C15",
  surface: "#17261D",
  surfaceRaised: "#1E3226",
  border: "#2A4536",
  gold: "#D4A94A",
  goldSoft: "#3A331F",
  teal: "#5FC9A8",
  coral: "#E2725B",
  text: "#F1EDE2",
  textMuted: "#93A69B",
  textFaint: "#5E6F65",
};

const displayFont = "'Fraunces', Georgia, serif";
const bodyFont = "'Inter', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', ui-monospace, monospace";

// Reusable style fragments for patterns that recur throughout the app. Spread these
// into a style object and override individual properties as needed, e.g.
// style={{ ...cardSurface, padding: 12 }}.
const cardSurface = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: 16,
};
const raisedSurface = {
  background: C.surfaceRaised,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
};
// Small muted caption text — hints, counts, timestamps, empty states.
const captionText = { fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint };
// Bare icon button with no chrome of its own.
const iconButton = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
  display: "grid",
  placeItems: "center",
};
// Filled primary action button (gold), used for confirm/submit actions.
const primaryButton = {
  border: "none",
  borderRadius: 12,
  background: C.gold,
  color: "#1A1305",
  fontFamily: bodyFont,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  padding: 13,
};

const FONT_IMPORT = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
    * { box-sizing: border-box; }
    /* iOS Safari tự phóng to khi focus vào ô nhập có cỡ chữ < 16px. Ép tối thiểu 16px
       trên mọi input/textarea/select để không bị zoom (giữ nguyên các cỡ chữ khác). */
    input, textarea, select { font-size: 16px !important; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
    .chSwitchCard { display: flex; flex-direction: column; }
    .chSwitchCard > div { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(212,169,74,0.35); } 50% { box-shadow: 0 0 0 6px rgba(212,169,74,0); } }
    @keyframes bubbleFloat {
      0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
      12% { transform: translate(var(--drift1, 8px), -18px) scale(1); opacity: 1; }
      100% { transform: translate(var(--drift2, -14px), -220px) scale(0.85); opacity: 0; }
    }
    @keyframes typingDot {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-5px); opacity: 1; }
    }
    @keyframes rankFlash {
      0% { transform: translateY(2px); opacity: 0; }
      25% { transform: translateY(-2px); opacity: 1; }
      70% { transform: translateY(-6px); opacity: 1; }
      100% { transform: translateY(-12px); opacity: 0; }
    }
    @keyframes labelFade {
      0% { opacity: 0; }
      20% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
  `}</style>
);

// ---------- SAMPLE DATA ----------
// Author registry — every post (Rankie/Path/Deck) carries an `author` id that looks
// this up, so the same person's avatar/name/follower count render consistently
// wherever their content appears (feed, search, another user's wall, etc).
const currentUser = {
  id: "me",
  name: "Người dùng Rankev",
  handle: "@rankev_user",
  avatarEmoji: "🙂",
  avatarColor: C.goldSoft,
  followers: 128,
  verified: false,
  bio: "Mê xếp hạng mọi thứ 📊 · Tin vào dữ liệu hơn cảm tính · Rank everything.",
};
const authorEsports = {
  id: "u_esports",
  name: "ESport Việt Nam",
  handle: "@esport_vn",
  avatarEmoji: "⚽",
  avatarColor: "#2E5D4E",
  followers: 284000,
  verified: true,
  bio: "Tin tức thể thao nhanh nhất Việt Nam. Bình luận, dự đoán, bình chọn mỗi ngày.",
};
const authorFanclub = {
  id: "u_fanclub",
  name: "MusicFest Live",
  handle: "@musicfest_live",
  avatarEmoji: "🎤",
  avatarColor: "#4A2E3D",
  followers: 52300,
  verified: true,
  bio: "Kênh chính thức đêm nhạc hội thường niên. Theo dõi để không bỏ lỡ vote thần tượng!",
};
const AUTHORS = { me: currentUser, u_esports: authorEsports, u_fanclub: authorFanclub };

// Quan hệ RankUp mặc định của người dùng với vài kênh: tier 0 (trung lập) → 1 (Quan
// tâm) → 2 (Yêu thích) → 3 (Fan cuồng). Thay cho hệ Follow cũ. RankUp chỉ điều khiển
// feed cá nhân, không tính điểm/không ảnh hưởng phân phối công khai.
const INITIAL_RANKS = { u_fanclub: 2, u_esports: 1 };

// Metadata mỗi tầng RankUp: nhãn + màu (teal → vàng → cam-lửa).
const RANK_TIERS = [
  null,
  { key: 1, label: "Quan tâm", color: C.teal },
  { key: 2, label: "Yêu thích", color: C.gold },
  { key: 3, label: "Fan cuồng", color: C.coral },
];

// Tạm ẩn huy hiệu xác minh (tích xanh). Đổi thành true để bật lại.
const SHOW_VERIFIED = false;

// Nguồn hiển thị nhãn trên feed: chỉ đánh dấu bài được tài trợ, còn lại không gắn nhãn.
function feedSourceFor(item) {
  return item?.sponsored ? "sponsored" : null;
}

// ---------- CHAT SAMPLE DATA ----------
const CHAT_CONTACTS = [
  {
    id: "c_esports",
    author: authorEsports,
    lastMsg: "Bạn vote cho đội nào rồi? 🏆",
    lastTime: Date.now() - 1000 * 60 * 3,
    unread: 2,
    online: true,
  },
  {
    id: "c_fanclub",
    author: authorFanclub,
    lastMsg: "Spam vote cho bias đêm nay nhé!! 💜",
    lastTime: Date.now() - 1000 * 60 * 28,
    unread: 0,
    online: true,
  },
  {
    id: "c_friend1",
    author: { id: "u_friend1", name: "Minh Khoa", handle: "@minhkhoa99", avatarEmoji: "😎", avatarColor: "#1E3A5F", followers: 312, verified: false },
    lastMsg: "Bạn thấy Path sự nghiệp chuẩn không?",
    lastTime: Date.now() - 1000 * 60 * 60 * 2,
    unread: 1,
    online: false,
  },
  {
    id: "c_friend2",
    author: { id: "u_friend2", name: "Lan Anh ✨", handle: "@lananh_rankev", avatarEmoji: "🌸", avatarColor: "#3D1F3A", followers: 89, verified: false },
    lastMsg: "Haha tôi ra kết quả Designer 🎨",
    lastTime: Date.now() - 1000 * 60 * 60 * 5,
    unread: 0,
    online: false,
  },
  {
    id: "c_friend3",
    author: { id: "u_friend3", name: "Tuấn Dev", handle: "@tuandev_vn", avatarEmoji: "🧑‍💻", avatarColor: "#1A3328", followers: 540, verified: false },
    lastMsg: "Python vẫn là số 1 😂",
    lastTime: Date.now() - 1000 * 60 * 60 * 24,
    unread: 0,
    online: true,
  },
];

const INITIAL_MESSAGES = {
  c_esports: [
    { id: "m1", from: "them", text: "Chào bạn! Bạn đã xem trận chung kết chưa?", time: Date.now() - 1000 * 60 * 60 },
    { id: "m2", from: "me", text: "Rồi! Mình vote Argentina nè 🇦🇷", time: Date.now() - 1000 * 60 * 55 },
    { id: "m3", from: "them", text: "Haha mình cũng vậy! Messi quá đỉnh", time: Date.now() - 1000 * 60 * 50 },
    { id: "m4", from: "them", text: "Bạn vote cho đội nào rồi? 🏆", time: Date.now() - 1000 * 60 * 3 },
  ],
  c_fanclub: [
    { id: "m1", from: "them", text: "Đêm nay vote cho thần tượng bạn nhé 💜", time: Date.now() - 1000 * 60 * 60 * 2 },
    { id: "m2", from: "me", text: "Mình sẽ spam vote cho Minh Anh!!", time: Date.now() - 1000 * 60 * 60 },
    { id: "m3", from: "them", text: "Spam vote cho bias đêm nay nhé!! 💜", time: Date.now() - 1000 * 60 * 28 },
  ],
  c_friend1: [
    { id: "m1", from: "them", text: "Ê bạn đã thử Path sự nghiệp chưa?", time: Date.now() - 1000 * 60 * 60 * 3 },
    { id: "m2", from: "me", text: "Rồi, mình ra kết quả Engineer 😅", time: Date.now() - 1000 * 60 * 60 * 2.5 },
    { id: "m3", from: "them", text: "Bạn thấy Path sự nghiệp chuẩn không?", time: Date.now() - 1000 * 60 * 60 * 2 },
  ],
  c_friend2: [
    { id: "m1", from: "me", text: "Bạn thử Path sự nghiệp chưa?", time: Date.now() - 1000 * 60 * 60 * 6 },
    { id: "m2", from: "them", text: "Haha tôi ra kết quả Designer 🎨", time: Date.now() - 1000 * 60 * 60 * 5 },
  ],
  c_friend3: [
    { id: "m1", from: "them", text: "Vote Python đi bạn ơi 😂", time: Date.now() - 1000 * 60 * 60 * 25 },
    { id: "m2", from: "me", text: "Mình vote TypeScript rồi 🔷", time: Date.now() - 1000 * 60 * 60 * 24.5 },
    { id: "m3", from: "them", text: "Python vẫn là số 1 😂", time: Date.now() - 1000 * 60 * 60 * 24 },
  ],
};

// ---------- EXAM HELPERS ----------
// Grade thresholds (score is 0–10 scale)
const GRADE_SCALE = [
  { grade: "A", min: 8.5,  color: "#4ADE80", label: "Xuất sắc" },
  { grade: "B", min: 7.0,  color: C.teal,    label: "Giỏi" },
  { grade: "C", min: 5.5,  color: C.gold,    label: "Khá" },
  { grade: "D", min: 4.0,  color: C.coral,   label: "Trung bình" },
  { grade: "F", min: 0,    color: "#666",     label: "Yếu" },
];
function getGrade(score10) {
  return GRADE_SCALE.find((g) => score10 >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

// ---------- ESSAY (TỰ LUẬN) AUTO-SCORE HEURISTIC ----------
// Lightweight, fully client-side stand-in for "AI chấm điểm": compares the
// participant's free-text answer against the model answer / keyword list the
// host provided (q.answerKey) using keyword-overlap. This is a *suggestion*
// only — always shown as "gợi ý", host confirms or edits before it counts.
// In production this same slot is where a server-side call to an LLM (e.g.
// the Anthropic API) would go for higher-quality, reasoning-based grading.
function normalizeTokens(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFC")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 3);
}
function estimateEssayScore(answer, answerKey, maxPoints) {
  const keyTokens = new Set(normalizeTokens(answerKey));
  if (keyTokens.size === 0) return null; // host didn't provide an answer key — can't estimate
  const ansTokens = new Set(normalizeTokens(answer));
  let hit = 0;
  keyTokens.forEach((t) => { if (ansTokens.has(t)) hit++; });
  const ratio = hit / keyTokens.size;
  return Math.max(0, Math.min(maxPoints, Math.round(ratio * maxPoints * 10) / 10));
}

// Generate a fake participant list for a Path presenter session — each lands on
// a result, weighted by that result's existing pct distribution.
function genPathParticipants(path) {
  const names = ["Minh Khoa","Lan Anh","Tuấn Anh","Hà My","Quang Huy","Thu Trang","Bảo Long","Yến Nhi","Đức Khải","Kim Ngân","Hoài Nam","Phương Linh","Trọng Nghĩa","Gia Hân","Nhật Minh","Mỹ Linh","Văn Toàn","Thùy Dung","Hữu Đức","Ngọc Mai"];
  const now = Date.now();
  const entries = Object.entries(path.results); // [ [label, {pct,...}], ... ]
  const total = entries.reduce((s, [, d]) => s + (d.pct || 1), 0) || 1;
  const pickResult = () => {
    let r = Math.random() * total;
    for (const [label, d] of entries) {
      r -= (d.pct || 1);
      if (r <= 0) return label;
    }
    return entries[entries.length - 1][0];
  };
  return names.slice(0, 14).map((name, idx) => ({
    id: "pp" + idx,
    name,
    result: pickResult(),
    joinedAt: now - Math.random() * 1000 * 60 * 10,
  }));
}

// Generate a fake participant list for demo
function genParticipants(deck) {
  const names = ["Minh Khoa","Lan Anh","Tuấn Anh","Hà My","Quang Huy","Thu Trang","Bảo Long","Yến Nhi","Đức Khải","Kim Ngân","Hoài Nam","Phương Linh","Trọng Nghĩa","Gia Hân","Nhật Minh","Mỹ Linh","Văn Toàn","Thùy Dung","Hữu Đức","Ngọc Mai"];
  const now = Date.now();
  const SAMPLE_TEXT_ANSWERS = ["Em nghĩ là do cấu trúc mạng máy tính.", "Không chắc chắn lắm về câu này.", "Theo em học được thì đáp án liên quan đến phần cứng.", "Em xin trả lời ngắn gọn như trên."];
  return names.slice(0, 14).map((name, idx) => {
    // simulate per-question answers and score
    const answers = {};
    const essay = {}; // per-question essay grading state: { score, estimated, confirmed }
    let totalPts = 0, maxPts = 0;
    deck.questions.forEach((q) => {
      const pts = q.points || 1;
      maxPts += pts;
      if (q.votingType === "text") {
        const text = SAMPLE_TEXT_ANSWERS[Math.floor(Math.random() * SAMPLE_TEXT_ANSWERS.length)];
        answers[q.id] = text;
        // Suggest a score from the keyword heuristic if the host gave an answer key;
        // otherwise leave ungraded (0) until the host scores it manually.
        const est = estimateEssayScore(text, q.answerKey, pts);
        essay[q.id] = { score: est != null ? est : 0, estimated: est != null, confirmed: false };
        totalPts += essay[q.id].score;
        return;
      }
      const correctIds = q.options.filter((o) => o.correct).map((o) => o.id);
      if (correctIds.length === 0) { answers[q.id] = null; return; }
      const allIds = q.options.map((o) => o.id);
      // Randomly decide if they got it right (weighted by position)
      const gotRight = Math.random() > 0.35;
      if (gotRight) {
        answers[q.id] = correctIds.length === 1 ? correctIds[0] : correctIds;
        totalPts += pts;
      } else {
        const wrong = allIds.filter((id) => !correctIds.includes(id));
        answers[q.id] = wrong.length > 0 ? wrong[Math.floor(Math.random() * wrong.length)] : correctIds[0];
      }
    });
    const score10 = maxPts > 0 ? Math.round((totalPts / maxPts) * 100) / 10 : 0;
    return { id: "p" + idx, name, score10, answers, essay, submittedAt: now - Math.random() * 1000 * 60 * 10 };
  });
}

// Sample exam deck (deckMode: "exam")
const sampleExamDeck = {
  id: "exam1",
  type: "deck",
  deckMode: "exam",
  title: "Bài thi Kiến thức Công nghệ",
  subtitle: "4 câu · Exam",
  category: "Công nghệ",
  mine: true,
  author: currentUser,
  createdAt: Date.now() - 1000 * 60 * 60 * 2,
  caption: "Bài thi nhanh về kiến thức công nghệ cơ bản 🖥️",
  media: { type: "image", color: "#1E3D5A", emoji: "🖥️" },
  participants: 0,
  comments: 0,
  answerMode: "scroll",
  graded: true,
  passingScore: 5,
  questions: [
    {
      id: "eq1", text: "HTTP là viết tắt của?", points: 2, votingType: "single",
      options: [
        { id: "a", label: "HyperText Transfer Protocol", votes: 0, correct: true },
        { id: "b", label: "High Transfer Text Protocol", votes: 0, correct: false },
        { id: "c", label: "Hyper Transfer Text Page", votes: 0, correct: false },
        { id: "d", label: "Home Text Transfer Protocol", votes: 0, correct: false },
      ],
    },
    {
      id: "eq2", text: "Ngôn ngữ nào dùng để tạo giao diện web?", points: 2, votingType: "single",
      options: [
        { id: "a", label: "HTML & CSS", votes: 0, correct: true },
        { id: "b", label: "Python", votes: 0, correct: false },
        { id: "c", label: "SQL", votes: 0, correct: false },
        { id: "d", label: "Java", votes: 0, correct: false },
      ],
    },
    {
      id: "eq3", text: "RAM là gì? (chọn tất cả đáp án đúng)", points: 3, votingType: "multiple",
      options: [
        { id: "a", label: "Bộ nhớ tạm thời", votes: 0, correct: true },
        { id: "b", label: "Random Access Memory", votes: 0, correct: true },
        { id: "c", label: "Lưu trữ vĩnh viễn", votes: 0, correct: false },
        { id: "d", label: "Read-only Memory", votes: 0, correct: false },
      ],
    },
    {
      id: "eq4", text: "CPU viết tắt của?", points: 3, votingType: "single",
      options: [
        { id: "a", label: "Central Processing Unit", votes: 0, correct: true },
        { id: "b", label: "Computer Processing Unit", votes: 0, correct: false },
        { id: "c", label: "Core Processing Unit", votes: 0, correct: false },
        { id: "d", label: "Cache Processing Unit", votes: 0, correct: false },
      ],
    },
    {
      id: "eq5", text: "Theo bạn, công nghệ nào sẽ phát triển mạnh nhất trong 5 năm tới? Giải thích ngắn gọn.", points: 0, votingType: "text",
      options: [],
    },
  ],
};

const initialRankies = [
  {
    id: "r1",
    type: "rankie",
    chartType: "head_to_head",
    votingType: "single",
    title: "Chung kết World Cup 2026",
    subtitle: "Đội nào sẽ vô địch?",
    category: "Thể thao",
    live: true,
    mine: false,
    author: authorEsports,
    createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 giờ trước
    closesAt: Date.now() + 1000 * 60 * 60 * 3, // đóng bình chọn sau 3 giờ nữa
    caption: "Trận chung kết trong mơ đã đến! Argentina của Messi đối đầu Tây Ban Nha đầy tài năng trẻ. Đây sẽ là trận cầu lịch sử mà cả thế giới chờ đợi. Bạn tin vào đội nào? 🏆⚽",
    media: { type: "image", color: "#2E5D4E", emoji: "🏆" },
    participants: 15234,
    colorA: "#5FC9A8",
    colorB: "#E2725B",
    options: [
      { id: "a", label: "Argentina", flag: "🇦🇷", votes: 8123 },
      { id: "b", label: "Tây Ban Nha", flag: "🇪🇸", votes: 7111 },
    ],
    comments: [
      { id: "c1", user: "Ronaldo", text: "World Cup for Argentina, honestly.", rankUp: 234, rankDown: 512, supports: "a", createdAt: Date.now() - 1000 * 60 * 120 },
      { id: "c2", user: "leomessi_fan", text: "Vamos Argentina!! 🐐", rankUp: 1890, rankDown: 45, supports: "a", createdAt: Date.now() - 1000 * 60 * 45 },
      { id: "c3", user: "furia_roja", text: "Tây Ban Nha kiểm soát bóng tốt hơn, sẽ thắng.", rankUp: 723, rankDown: 210, supports: "b", createdAt: Date.now() - 1000 * 60 * 20 },
      { id: "c4", user: "trung_lap_fan", text: "Đội nào thắng cũng được, miễn trận hay là vui.", rankUp: 156, rankDown: 12, supports: [], createdAt: Date.now() - 1000 * 60 * 8 },
      { id: "c5", user: "phan_tich_bong", text: "Cả hai đội đều mạnh, khó nói trước.", rankUp: 89, rankDown: 34, supports: ["a", "b"], createdAt: Date.now() - 1000 * 60 * 3 },
    ],
  },
  {
    id: "r2",
    type: "rankie",
    chartType: "bar",
    votingType: "single",
    title: "Ngôn ngữ lập trình yêu thích 2026?",
    subtitle: "Chọn 1 phương án",
    category: "Công nghệ",
    live: true,
    mine: true,
    sponsored: true, // bài được đẩy/tài trợ — hiện nhãn "Được tài trợ" trong feed
    author: currentUser,
    createdAt: Date.now() - 1000 * 60 * 60 * 26, // hôm qua
    caption: "Mình đang khảo sát cộng đồng dev Việt xem ngôn ngữ nào được yêu thích nhất năm nay. Vote để mọi người cùng thấy xu hướng nhé!",
    participants: 4021,
    options: [
      { id: "py", label: "Python", emoji: "🐍", votes: 1780, color: C.teal },
      { id: "ts", label: "TypeScript", emoji: "🔷", votes: 1390, color: C.gold },
      { id: "go", label: "Go", emoji: "🐹", votes: 512, color: C.coral },
      { id: "rs", label: "Rust", emoji: "🦀", votes: 339, color: "#8B7FD1" },
    ],
    comments: [],
  },
  {
    id: "r3",
    type: "rankie",
    chartType: "pie",
    votingType: "rating",
    title: "Bạn hài lòng với Rankev thế nào?",
    subtitle: "Đánh giá 1-5 sao",
    category: "Cộng đồng",
    live: false,
    mine: true,
    author: currentUser,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 ngày trước
    participants: 892,
    options: [
      { id: "5", label: "⭐⭐⭐⭐⭐", votes: 512, color: C.teal },
      { id: "4", label: "⭐⭐⭐⭐", votes: 231, color: C.gold },
      { id: "3", label: "⭐⭐⭐", votes: 98, color: "#8B7FD1" },
      { id: "2", label: "⭐⭐", votes: 34, color: C.coral },
      { id: "1", label: "⭐", votes: 17, color: "#6B4E43" },
    ],
    comments: [],
  },
  {
    id: "r4",
    type: "rankie",
    chartType: "bar",
    votingType: "unlimited",
    title: "Idol nào tỏa sáng nhất đêm nay? 💜",
    subtitle: "Bình chọn không giới hạn — bấm liên tục cho bias của bạn!",
    category: "Âm nhạc",
    live: true,
    mine: false,
    author: authorFanclub,
    createdAt: Date.now() - 1000 * 60 * 30, // 30 phút trước
    closesAt: Date.now() + 1000 * 60 * 90, // đóng bình chọn sau 90 phút nữa (đêm nhạc hội)
    caption: "LIVE fanclub vote đêm nhạc hội! Spam vote cho thần tượng bạn yêu thích ngay bây giờ 💜🔥",
    media: { type: "video", color: "#4A2E3D", emoji: "🎤" },
    participants: 28430,
    // votes = tổng lượt bấm (kể cả spam), voters = số người vote duy nhất (mô phỏng)
    options: [
      { id: "a", label: "Minh Anh", emoji: "💃", votes: 15420, voters: 3210, color: C.coral },
      { id: "b", label: "Thu Hà", emoji: "🎤", votes: 12030, voters: 4102, color: C.teal },
      { id: "c", label: "Bảo Ngọc", emoji: "🌟", votes: 8710, voters: 2650, color: C.gold },
      { id: "d", label: "Gia Bảo", emoji: "🎸", votes: 5990, voters: 1840, color: "#8B7FD1" },
    ],
    comments: [
      { id: "c1", user: "minhanh_bias", text: "Spam hết mình cho Minh Anh đêm nay!! 💜", rankUp: 890, rankDown: 45, supports: "a", createdAt: Date.now() - 1000 * 60 * 12 },
      { id: "c2", user: "thuha_stan", text: "Thu Hà hát live hay quá, vote không nghỉ tay", rankUp: 654, rankDown: 30, supports: "b", createdAt: Date.now() - 1000 * 60 * 6 },
    ],
  },
];

const samplePath = {
  id: "p1",
  type: "path",
  title: "Con đường sự nghiệp nào hợp với bạn?",
  subtitle: "3 câu hỏi · 4 kết quả",
  category: "Sự nghiệp",
  mine: true,
  author: currentUser,
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 ngày trước
  caption: "Bạn phân vân không biết mình hợp với công việc nào? Làm bài trắc nghiệm nhanh này để khám phá con đường sự nghiệp phù hợp với tính cách của bạn nhất. Hơn 15.000 người đã thử!",
  media: { type: "video", color: "#4A2E3D", emoji: "🎬" },
  participants: 15209,
  comments: 342,
  // Each choice can carry an emoji illustration and/or an uploaded image URL
  questions: [
    {
      id: "q1",
      text: "Bạn có thích làm việc trực tiếp với nhiều người không?",
      yes: { next: "q2a", emoji: "🤝", image: null, label: "Có, tôi thích kết nối" },
      no: { next: "q2b", emoji: "🎧", image: null, label: "Không, tôi thích tập trung riêng" },
    },
    {
      id: "q2a",
      text: "Bạn có muốn giữ vai trò lãnh đạo, quản lý đội nhóm?",
      yes: { next: "Manager", emoji: "🎯", image: null, label: "Có, dẫn dắt đội" },
      no: { next: "HR Specialist", emoji: "💚", image: null, label: "Không, hỗ trợ con người" },
    },
    {
      id: "q2b",
      text: "Bạn có thiên hướng sáng tạo, thẩm mỹ không?",
      yes: { next: "Designer", emoji: "🎨", image: null, label: "Có, tôi mê cái đẹp" },
      no: { next: "Engineer", emoji: "⚙️", image: null, label: "Không, tôi thích logic" },
    },
  ],
  results: {
    Manager: { emoji: "🎯", image: null, pct: 41, count: 6234, comment: "Yeah, tôi đang là CEO và ra kết quả này đó 😄" },
    "HR Specialist": { emoji: "💚", image: null, pct: 19, count: 2890, comment: "Chuẩn luôn, tôi làm HR 5 năm rồi." },
    Designer: { emoji: "🎨", image: null, pct: 24, count: 3654, comment: "Ra kết quả này, mà tôi lại code 🤔" },
    Engineer: { emoji: "⚙️", image: null, pct: 16, count: 2431, comment: "Chính xác, tôi là backend dev." },
  },
};

// A Deck = a set of questions answered as one submission. Each question is like a
// mini-rankie (single/multiple/rating). answerMode: "step" (one at a time) or "scroll" (all on one page).
// Optional per-question `answer` field marks a correct choice for future graded modes.
const sampleDeck = {
  id: "d1",
  type: "deck",
  title: "Khảo sát trải nghiệm người dùng Rankev",
  subtitle: "4 câu hỏi · khuyết danh",
  category: "Cộng đồng",
  mine: true,
  author: currentUser,
  createdAt: Date.now() - 1000 * 60 * 60 * 10,
  caption: "Giúp chúng mình cải thiện Rankev nhé! Khảo sát ngắn 4 câu, hoàn toàn khuyết danh. Ý kiến của bạn rất quan trọng 💚",
  media: { type: "image", color: "#2E3D5A", emoji: "💚" },
  participants: 1288,
  comments: 24,
  answerMode: "step",
  graded: false,
  questions: [
    {
      id: "dq1",
      text: "Bạn dùng Rankev thường xuyên thế nào?",
      votingType: "single",
      options: [
        { id: "a", label: "Hằng ngày", votes: 512 },
        { id: "b", label: "Vài lần mỗi tuần", votes: 430 },
        { id: "c", label: "Thỉnh thoảng", votes: 346 },
      ],
    },
    {
      id: "dq2",
      text: "Tính năng nào bạn thích nhất? (chọn nhiều)",
      votingType: "multiple",
      options: [
        { id: "a", label: "Rankie bình chọn", votes: 890 },
        { id: "b", label: "Rankev Path", votes: 654 },
        { id: "c", label: "Biểu đồ thời gian thực", votes: 720 },
        { id: "d", label: "Trình chiếu sự kiện", votes: 401 },
      ],
    },
    {
      id: "dq3",
      text: "Đánh giá mức độ dễ dùng của app?",
      votingType: "rating",
      options: [
        { id: "5", label: "⭐⭐⭐⭐⭐", votes: 620 },
        { id: "4", label: "⭐⭐⭐⭐", votes: 410 },
        { id: "3", label: "⭐⭐⭐", votes: 180 },
        { id: "2", label: "⭐⭐", votes: 48 },
        { id: "1", label: "⭐", votes: 30 },
      ],
    },
    {
      id: "dq4",
      text: "Bạn có giới thiệu Rankev cho bạn bè không?",
      votingType: "single",
      options: [
        { id: "a", label: "Chắc chắn có", votes: 705 },
        { id: "b", label: "Có thể", votes: 402 },
        { id: "c", label: "Không", votes: 181 },
      ],
    },
  ],
};

// Bài của user khác (không phải "me") để feed có nội dung Path/Survey/Exam đa dạng,
// vì bài của mình đã bị lọc khỏi feed.
const otherPath = {
  id: "p_kpop",
  type: "path",
  title: "Bạn hợp làm fan nhóm nhạc nào?",
  category: "Giải trí",
  mine: false,
  author: authorFanclub,
  createdAt: Date.now() - 1000 * 60 * 60 * 5,
  caption: "Trả lời vài câu để xem gu của bạn hợp với nhóm nào nhất nhé! 💜",
  media: { type: "image", color: "#4A2E4E", emoji: "🎤" },
  participants: 8421,
  comments: 156,
  questions: [
    {
      id: "q1",
      text: "Bạn thích concept nào hơn?",
      yes: { next: "q2a", emoji: "⚡", image: null, label: "Mạnh mẽ, cá tính" },
      no: { next: "q2b", emoji: "🌸", image: null, label: "Nhẹ nhàng, dễ thương" },
    },
    {
      id: "q2a",
      text: "Bạn mê vũ đạo hay giọng hát hơn?",
      yes: { next: "Nhóm Performance", emoji: "🕺", image: null, label: "Vũ đạo bùng nổ" },
      no: { next: "Nhóm Vocal", emoji: "🎙️", image: null, label: "Giọng hát live" },
    },
    {
      id: "q2b",
      text: "Bạn thích nhóm đông thành viên?",
      yes: { next: "Nhóm Đông", emoji: "👥", image: null, label: "Càng đông càng vui" },
      no: { next: "Nhóm Nhỏ", emoji: "✨", image: null, label: "Ít mà chất" },
    },
  ],
  results: {
    "Nhóm Performance": { emoji: "🕺", image: null, pct: 34, count: 2863, comment: "Đúng gu tôi luôn!" },
    "Nhóm Vocal": { emoji: "🎙️", image: null, pct: 28, count: 2358, comment: "Giọng live là number one." },
    "Nhóm Đông": { emoji: "👥", image: null, pct: 22, count: 1852, comment: "Đông vui thật sự 🥳" },
    "Nhóm Nhỏ": { emoji: "✨", image: null, pct: 16, count: 1348, comment: "Ít mà chất mà." },
  },
};

// Path demo ĐA TẦNG để kiểm thử: nhiều lớp câu hỏi (2–3 lựa chọn), 5 kết quả, có
// nhánh dùng chung ending, ẩn kết quả chưa khám phá (revealMode "hidden") để test replay.
const demoPathAdventure = {
  id: "p_rung",
  type: "path",
  title: "Lạc trong rừng đêm — bạn sẽ sống sót thế nào?",
  subtitle: "Phiêu lưu phân nhánh · 5 kết quả",
  category: "Giải trí",
  mine: false,
  author: authorFanclub,
  createdAt: Date.now() - 1000 * 60 * 2, // rất mới để nổi lên đầu feed, dễ tìm để test
  caption: "Trời sập tối giữa rừng sâu, mỗi lựa chọn dẫn bạn tới một số phận khác nhau. Bạn là ai khi bị dồn vào đường cùng? Chơi lại để khám phá cả 5 kết cục 🌲🔥",
  media: { type: "image", color: "#1A3328", emoji: "🌲" },
  participants: 12750,
  comments: 214,
  revealMode: "hidden",
  hideEndingCount: false,
  questions: [
    {
      id: "q1",
      text: "Màn đêm buông xuống, bạn quyết định điều gì đầu tiên?",
      sceneImage: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%230D1B2A'/><stop offset='0.6' stop-color='%231B2A3A'/><stop offset='1' stop-color='%230A1410'/></linearGradient></defs><rect width='400' height='240' fill='url(%23g)'/><circle cx='320' cy='50' r='24' fill='%23E8E4C9' opacity='0.9'/><text x='200' y='150' font-size='70' text-anchor='middle'>🌲</text></svg>",
      answers: [
        { label: "Tìm chỗ trú ẩn", emoji: "🏚️", image: null, hotspot: { x: 24, y: 62 }, next: "q_shelter" },
        { label: "Nhóm một đống lửa", emoji: "🔥", image: null, hotspot: { x: 50, y: 82 }, next: "q_fire" },
        { label: "Cứ đi tìm đường ra", emoji: "🧭", image: null, hotspot: { x: 76, y: 62 }, next: "q_walk" },
      ],
    },
    {
      id: "q_shelter",
      text: "Bạn tìm được hai nơi có thể trú. Chọn nơi nào?",
      answers: [
        { label: "Chui vào hang tối", emoji: "🕳️", image: null, next: "q_cave" },
        { label: "Trèo lên cây cao", emoji: "🌳", image: null, next: "Người Quan Sát" },
      ],
    },
    {
      id: "q_fire",
      text: "Ngọn lửa bùng lên. Bạn làm gì suốt đêm?",
      answers: [
        { label: "Thức canh giữ lửa", emoji: "🪵", image: null, next: "Người Giữ Lửa" },
        { label: "Mệt quá, ngủ thiếp đi", emoji: "😴", image: null, next: "q_cave" },
      ],
    },
    {
      id: "q_walk",
      text: "Trong bóng tối, bạn lần theo dấu hiệu nào?",
      answers: [
        { label: "Tiếng suối chảy", emoji: "💧", image: null, next: "Người Tìm Đường" },
        { label: "Ánh sao trên cao", emoji: "⭐", image: null, next: "q_cave" },
      ],
    },
    {
      id: "q_cave",
      text: "Bạn đối mặt với bóng tối mịt mùng và một tiếng động lạ. Bạn?",
      answers: [
        { label: "Lao vào khám phá", emoji: "🔦", image: null, next: "Kẻ Liều Lĩnh" },
        { label: "Lùi lại, chờ trời sáng", emoji: "🛡️", image: null, next: "Người Thận Trọng" },
      ],
    },
  ],
  results: {
    "Người Quan Sát": { emoji: "🦉", image: null, pct: 18, count: 2295, comment: "Từ trên cao nhìn xuống, mọi thứ rõ ràng hơn." },
    "Người Giữ Lửa": { emoji: "🔥", image: null, pct: 24, count: 3060, comment: "Ánh lửa giữ tôi sống qua đêm dài." },
    "Người Tìm Đường": { emoji: "🧭", image: null, pct: 21, count: 2678, comment: "Tôi tin vào bản năng và đã ra được bìa rừng." },
    "Kẻ Liều Lĩnh": { emoji: "⚡", image: null, pct: 15, count: 1912, comment: "Liều một phen, và tôi tìm thấy lối thoát bí mật!" },
    "Người Thận Trọng": { emoji: "🛡️", image: null, pct: 22, count: 2805, comment: "Kiên nhẫn chờ đợi cũng là một loại dũng cảm." },
  },
};

const otherSurvey = {
  id: "d_esport",
  type: "deck",
  deckMode: "survey",
  title: "Khảo sát thói quen xem Esports",
  allowGuestPresent: true,
  category: "Game",
  mine: false,
  author: authorEsports,
  createdAt: Date.now() - 1000 * 60 * 60 * 8,
  caption: "Bạn xem esports thế nào? Giúp tụi mình hiểu cộng đồng hơn nhé 🎮",
  media: { type: "image", color: "#2E3D5A", emoji: "🎮" },
  participants: 3120,
  comments: 47,
  answerMode: "step",
  graded: false,
  seriesId: "s_esports_season1",
  seriesName: "Esports Season 1 — Khảo sát cộng đồng",
  questions: [
    {
      id: "sq1", text: "Bạn xem esports bao nhiêu giờ mỗi tuần?", votingType: "single",
      options: [
        { id: "a", label: "Dưới 2 giờ", votes: 640 },
        { id: "b", label: "2–6 giờ", votes: 1180 },
        { id: "c", label: "Trên 6 giờ", votes: 1300 },
      ],
    },
    {
      id: "sq2", text: "Tựa game nào bạn theo dõi? (chọn nhiều)", votingType: "multiple",
      options: [
        { id: "a", label: "Liên Minh Huyền Thoại", votes: 2100 },
        { id: "b", label: "Valorant", votes: 1540 },
        { id: "c", label: "Liên Quân", votes: 1320 },
        { id: "d", label: "CS2", votes: 880 },
      ],
    },
    {
      id: "sq3", text: "Bạn thường xem ở đâu?", votingType: "single",
      options: [
        { id: "a", label: "YouTube", votes: 1450 },
        { id: "b", label: "Facebook Gaming", votes: 720 },
        { id: "c", label: "Twitch / nền tảng khác", votes: 950 },
      ],
    },
  ],
};

const otherExam = {
  id: "exam_football",
  type: "deck",
  deckMode: "exam",
  title: "Bài thi Kiến thức World Cup",
  allowGuestPresent: true,
  category: "Thể thao",
  mine: false,
  author: authorEsports,
  createdAt: Date.now() - 1000 * 60 * 60 * 6,
  caption: "Bạn có phải fan cứng World Cup? Thử sức 45 phút nào ⚽",
  media: { type: "image", color: "#2E5D4E", emoji: "⚽" },
  participants: 640,
  comments: 18,
  answerMode: "scroll",
  graded: true,
  passingScore: 5,
  examDurationMinutes: 45,
  seriesId: "s_esports_season1",
  seriesName: "Esports Season 1 — Khảo sát cộng đồng",
  questions: [
    {
      id: "fq1", text: "Đội nào vô địch World Cup 2022?", points: 3, votingType: "single",
      options: [
        { id: "a", label: "Argentina", votes: 0, correct: true },
        { id: "b", label: "Pháp", votes: 0, correct: false },
        { id: "c", label: "Brazil", votes: 0, correct: false },
        { id: "d", label: "Croatia", votes: 0, correct: false },
      ],
    },
    {
      id: "fq2", text: "Một trận bóng đá tiêu chuẩn có mấy phút chính thức?", points: 3, votingType: "single",
      options: [
        { id: "a", label: "90 phút", votes: 0, correct: true },
        { id: "b", label: "80 phút", votes: 0, correct: false },
        { id: "c", label: "100 phút", votes: 0, correct: false },
        { id: "d", label: "120 phút", votes: 0, correct: false },
      ],
    },
    {
      id: "fq3", text: "Những cầu thủ nào từng giành Quả bóng vàng? (chọn tất cả)", points: 4, votingType: "multiple",
      options: [
        { id: "a", label: "Lionel Messi", votes: 0, correct: true },
        { id: "b", label: "Cristiano Ronaldo", votes: 0, correct: true },
        { id: "c", label: "Neymar", votes: 0, correct: false },
        { id: "d", label: "Luka Modrić", votes: 0, correct: true },
      ],
    },
  ],
};

// ---------- HELPERS ----------
const fmt = (n) => n.toLocaleString("en-US");

// Compact follower-style counter: 128 -> "128", 4021 -> "4,0K", 284000 -> "284K"
function fmtCompact(n) {
  if (n == null) return "0";
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) {
    const v = n / 1000;
    return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")}K`;
  }
  const v = n / 1_000_000;
  return `${v.toFixed(1).replace(/\.0$/, "")}M`;
}

// votedMap stores a rankie's voted value in a shape that depends on its voting type:
// a string option id (single-choice, rating), an array of option ids (multi-select),
// or an object of { [optionId]: tapCount } (unlimited). This normalizes any of those
// into a plain array of option ids the viewer picked, so feed/profile cards can
// highlight the right rows without needing to know the voting type themselves.
function votedIdsFor(votedValue) {
  if (!votedValue) return [];
  if (typeof votedValue === "string") return [votedValue];
  if (Array.isArray(votedValue)) return votedValue;
  if (typeof votedValue === "object") return Object.keys(votedValue);
  return [];
}

// The single option id the viewer picked, for the voting types that only allow one
// (single-choice, rating). Returns null for multi-select and unlimited, where "the"
// vote isn't a single value — callers wanting every pick should use votedIdsFor.
function singleVotedId(votedValue) {
  return typeof votedValue === "string" ? votedValue : null;
}

// Per-option tap counts, only meaningful for unlimited voting where votedMap holds
// { [optionId]: tapCount }. Any other shape yields an empty map.
function tapCountsFor(votedValue) {
  return votedValue && typeof votedValue === "object" && !Array.isArray(votedValue) ? votedValue : {};
}

// Builds and downloads a CSV of a post's result data — one row per option/answer
// with vote counts and share of total, so the raw numbers can be analyzed in
// Excel/Sheets outside the app. Works for rankie (options), path (per-answer
// counts derived from `results`), and deck (per-question options).
function exportPostToCSV(post) {
  const rows = [["Phương án", "Lượt bình chọn", "Tỷ lệ (%)"]];
  const pushOptions = (opts) => {
    const total = opts.reduce((s, o) => s + (o.votes || 0), 0) || 1;
    opts.forEach((o) => {
      const pct = Math.round((((o.votes || 0) / total) * 1000)) / 10;
      rows.push([o.label, o.votes || 0, pct]);
    });
  };
  if (post.type === "rankie") {
    pushOptions(post.options);
  } else if (post.type === "deck") {
    post.questions.forEach((q) => {
      rows.push([`— ${q.text} —`, "", ""]);
      pushOptions(q.options);
    });
  } else if (post.type === "path") {
    // Paths don't tally per-option votes; export the outcome distribution instead.
    Object.entries(post.results || {}).forEach(([label, r]) => {
      rows.push([label, r.count ?? "", ""]);
    });
  }
  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${post.title?.replace(/[^\w\d\s-]/g, "").trim().replace(/\s+/g, "_") || post.id || "ket-qua"}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "vừa xong";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w} tuần trước`;
  return new Date(ts).toLocaleDateString("vi-VN");
}

// Whether a rankie's voting window has ended.
function isRankieClosed(rankie) {
  return !!(rankie.closesAt && Date.now() >= rankie.closesAt);
}

// "Còn 2 ngày" / "Còn 5 giờ" / "Còn 12 phút" — for rankies with a closesAt in the future.
function formatRemaining(closesAt) {
  if (!closesAt) return null;
  const s = Math.round((closesAt - Date.now()) / 1000);
  if (s <= 0) return null;
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d >= 1) return `Còn ${d} ngày`;
  if (h >= 1) return `Còn ${h} giờ`;
  if (m >= 1) return `Còn ${m} phút`;
  return "Còn dưới 1 phút";
}

// Live-updating remaining time to an absolute closesAt timestamp. Re-renders every
// second so a Rankie countdown ticks in real time. Returns null when there's no deadline.
function useLiveRemaining(closesAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!closesAt) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [closesAt]);
  if (!closesAt) return null;
  return Math.max(0, closesAt - now);
}

// Small countdown chip shown in the bottom-right corner of a time-limited Rankie's
// chart. Numbers only, no unit text. Renders nothing for unlimited rankies.
function RankieCountdownBox({ closesAt }) {
  const remainMs = useLiveRemaining(closesAt);
  if (remainMs == null) return null;
  const done = remainMs <= 0;
  const totalSec = Math.floor(remainMs / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  const text = done ? "00:00" : d > 0 ? `${d}:${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
  const urgent = !done && totalSec <= 300; // dưới 5 phút
  const accent = done ? C.textFaint : urgent ? C.coral : C.gold;
  return (
    <div
      style={{
        position: "absolute",
        right: 10,
        bottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 9px",
        borderRadius: 999,
        background: "rgba(18,14,7,0.82)",
        border: `1px solid ${done ? C.border : accent}`,
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
        zIndex: 3,
        pointerEvents: "none",
        animation: urgent ? "pulseGlow 1.1s ease-in-out infinite" : "none",
      }}
    >
      <Clock size={12} color={accent} />
      <span style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 14, lineHeight: 1, color: done ? C.textFaint : urgent ? C.coral : C.text }}>
        {text}
      </span>
    </div>
  );
}

// Strips Vietnamese diacritics and lowercases, so searching "the gioi" also matches "Thế giới".
function normalizeVi(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

// Pure ticking effect: periodically bumps a random option's votes.
// The caller owns the state, so this works whether that state lives locally
// (presenter mode) or is lifted to the root app (persists across navigation).
// When simulateVoters is true (unlimited/"spam" voting type), each tick adds
// a batch of raw votes (spam) but only sometimes counts as a new unique voter,
// so `votes` (total taps) and `voters` (unique people) diverge realistically.
// onTick(optionIndex), if given, fires once per tick so callers can react to
// "someone just voted" (e.g. spawning a reaction bubble) without duplicating the timer.
function useLiveTicker(setOptions, isActive, isLive, simulateVoters = false, onTick) {
  useEffect(() => {
    if (!isActive || !isLive) return;
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * 1e9); // resolved against current length below
      setOptions((prev) => {
        const i0 = idx % prev.length;
        onTick?.(i0);
        return prev.map((o, i) => {
          if (i !== i0) return o;
          const bump = Math.ceil(Math.random() * 6);
          return simulateVoters
            ? { ...o, votes: o.votes + bump, voters: (o.voters ?? 0) + (Math.random() < 0.35 ? 1 : 0) }
            : { ...o, votes: o.votes + bump };
        });
      });
    }, 1400);
    return () => clearInterval(interval);
  }, [isActive, isLive, setOptions, simulateVoters, onTick]);
}

// Self-contained live votes for ephemeral contexts (presenter mode) that keep
// their own copy rather than writing back to shared app state.
function useLiveVotes(initialOptions, isActive, isLive, simulateVoters = false) {
  const [options, setOptions] = useState(initialOptions);
  useLiveTicker(setOptions, isActive, isLive, simulateVoters);
  return [options, setOptions];
}

// Session countdown for presenter modes (surveys/exams/voting run for a fixed window).
// durationMinutes = null means "no limit" (never expires). Starts counting the moment
// `active` first becomes true and keeps its own end-time so pausing other UI state
// doesn't restart the clock.
function useCountdown(durationMinutes, active) {
  const endTimeRef = useRef(null);
  const [remainingSec, setRemainingSec] = useState(durationMinutes != null ? durationMinutes * 60 : null);

  useEffect(() => {
    if (!active || durationMinutes == null) return;
    if (endTimeRef.current == null) {
      endTimeRef.current = Date.now() + durationMinutes * 60000;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setRemainingSec(remaining);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [active, durationMinutes]);

  const expired = durationMinutes != null && remainingSec === 0;
  return { remainingSec, expired };
}

function formatCountdown(sec) {
  if (sec == null) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Small countdown pill for presenter headers. Turns urgent (red, pulsing) under 30s.
function CountdownBadge({ remainingSec, expired }) {
  if (remainingSec == null) return null;
  const urgent = remainingSec <= 30 && !expired;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 999,
        background: expired ? "#3A1F1F" : urgent ? "#3A1F1F" : C.surfaceRaised,
        border: `1px solid ${expired || urgent ? C.coral : C.border}`,
        color: expired || urgent ? C.coral : C.text,
        fontFamily: monoFont,
        fontWeight: 700,
        fontSize: 13,
        animation: urgent ? "pulseGlow 1s ease-in-out infinite" : "none",
      }}
    >
      <Clock size={13} />
      {expired ? "Hết giờ" : formatCountdown(remainingSec)}
    </div>
  );
}

// Duration picker used on presenter setup screens. null = "Không giới hạn".
function DurationPicker({ value, onChange }) {
  const presets = [null, 1, 3, 5, 10, 15];
  const [customOpen, setCustomOpen] = useState(false);
  const [customVal, setCustomVal] = useState("");

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {presets.map((p) => {
          const active = value === p && !customOpen;
          return (
            <button
              key={String(p)}
              onClick={() => {
                setCustomOpen(false);
                onChange(p);
              }}
              style={{
                padding: "8px 13px",
                borderRadius: 999,
                border: `1px solid ${active ? C.gold : C.border}`,
                background: active ? C.goldSoft : C.surface,
                color: active ? C.gold : C.textMuted,
                fontFamily: bodyFont,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {p == null ? "Không giới hạn" : `${p} phút`}
            </button>
          );
        })}
        <button
          onClick={() => setCustomOpen(true)}
          style={{
            padding: "8px 13px",
            borderRadius: 999,
            border: `1px solid ${customOpen ? C.gold : C.border}`,
            background: customOpen ? C.goldSoft : C.surface,
            color: customOpen ? C.gold : C.textMuted,
            fontFamily: bodyFont,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Tùy chỉnh
        </button>
      </div>
      {customOpen && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <input
            type="number"
            min={1}
            max={180}
            value={customVal}
            onChange={(e) => {
              setCustomVal(e.target.value);
              const n = parseInt(e.target.value, 10);
              if (n > 0) onChange(n);
            }}
            placeholder="Số phút"
            style={{
              width: 90,
              padding: "8px 10px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontFamily: bodyFont,
              fontSize: 13,
              outline: "none",
            }}
          />
          <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint }}>phút</span>
        </div>
      )}
    </div>
  );
}

// Picker for when a Rankie's voting window ends. value: null = vô hạn, a number = hours from
// now presets, or { custom: "YYYY-MM-DDTHH:mm" } for a specific date/time chosen by the creator.
function ClosingTimePicker({ value, onChange }) {
  const presets = [
    { id: "unlimited", label: "Vô hạn", hours: null },
    { id: "1h", label: "1 giờ", hours: 1 },
    { id: "6h", label: "6 giờ", hours: 6 },
    { id: "1d", label: "1 ngày", hours: 24 },
    { id: "3d", label: "3 ngày", hours: 72 },
    { id: "1w", label: "1 tuần", hours: 168 },
  ];
  const isCustom = value && typeof value === "object" && value.custom;
  const activePresetId = isCustom ? null : presets.find((p) => p.hours === value)?.id ?? "unlimited";

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {presets.map((p) => {
          const active = activePresetId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.hours)}
              style={{
                padding: "8px 13px",
                borderRadius: 999,
                border: `1px solid ${active ? C.gold : C.border}`,
                background: active ? C.goldSoft : C.surface,
                color: active ? C.gold : C.textMuted,
                fontFamily: bodyFont,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          );
        })}
        <button
          onClick={() => onChange({ custom: "" })}
          style={{
            padding: "8px 13px",
            borderRadius: 999,
            border: `1px solid ${isCustom ? C.gold : C.border}`,
            background: isCustom ? C.goldSoft : C.surface,
            color: isCustom ? C.gold : C.textMuted,
            fontFamily: bodyFont,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Chọn mốc giờ...
        </button>
      </div>
      {isCustom && (
        <div style={{ marginTop: 10 }}>
          <input
            type="datetime-local"
            value={value.custom}
            onChange={(e) => onChange({ custom: e.target.value })}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontFamily: bodyFont,
              fontSize: 13,
              outline: "none",
              colorScheme: "dark",
            }}
          />
        </div>
      )}
    </div>
  );
}

// Compact dropdown trigger + menu, used to keep option pickers (chart type, result filters)
// small and out of the way instead of a full row of pill buttons.
function SmallDropdown({ icon, options, value, onChange, align = "left" }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: C.surfaceRaised,
          color: C.text,
          fontFamily: bodyFont,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {icon}
        <span>{current?.label}</span>
        <ChevronDown size={13} color={C.textFaint} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
          <div
            style={{
              position: "absolute",
              top: 38,
              [align]: 0,
              background: C.surfaceRaised,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 6,
              minWidth: 190,
              zIndex: 21,
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}
          >
            {options.map((o) => {
              const selected = o.id === value;
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: selected ? C.goldSoft : "transparent",
                    color: selected ? C.gold : C.text,
                    fontFamily: bodyFont,
                    fontSize: 13,
                    fontWeight: selected ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {o.label}
                  {selected && <Check size={13} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- SHARED UI ----------
function Pill({ children, tone = "muted" }) {
  const tones = {
    muted: { bg: C.surfaceRaised, fg: C.textMuted },
    live: { bg: "#2A4536", fg: C.teal },
    gold: { bg: C.goldSoft, fg: C.gold },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        fontFamily: bodyFont,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        letterSpacing: 0.3,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {children}
    </span>
  );
}

// Pill dạng icon gọn; chạm để hiện nhãn chữ rồi tự ẩn (mobile không có hover).
function TapHintPill({ children, hint, tone = "muted" }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!show) return;
    const id = setTimeout(() => setShow(false), 1800);
    return () => clearTimeout(id);
  }, [show]);
  return (
    <span onClick={(e) => { e.stopPropagation(); setShow((v) => !v); }} style={{ cursor: "pointer", display: "inline-flex" }}>
      <Pill tone={tone}>
        {children}
        {show && <span style={{ marginLeft: 4 }}>{hint}</span>}
      </Pill>
    </span>
  );
}

// Định dạng thời lượng thi Exam cho tag trên feed: 45 -> "45 phút", 60 -> "1 giờ", 1440 -> "1 ngày".
function fmtExamDuration(mins) {
  if (mins == null) return null;
  if (mins >= 1440) return `${Math.round(mins / 1440)} ngày`;
  if (mins >= 60) { const h = mins / 60; return `${Number.isInteger(h) ? h : (mins / 60).toFixed(1)} giờ`; }
  return `${Math.round(mins)} phút`;
}

// Nhãn hiển thị phía trên bài được tài trợ trong feed. Các nguồn khác không gắn nhãn.
function FeedSourceLabel({ source }) {
  if (source !== "sponsored") return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 2px 7px", fontFamily: bodyFont, fontSize: 11, fontWeight: 600, color: C.gold, letterSpacing: 0.2 }}>
      <Megaphone size={12} /> Được tài trợ
    </div>
  );
}

// Nhãn "RankUp"/"RankDown" nổi lên rồi mờ dần sau mỗi lần bấm.
// Nhãn tên tầng ("Quan tâm"/"Yêu thích"/"Fan cuồng") nổi lên rồi mờ dần sau mỗi lần bấm.
// Mô tả 1 dòng cho mỗi tầng RankUp — hiện trong popover để người dùng hiểu cơ chế.
const RANK_DESC = {
  1: "Hiện bài mới của kênh trên feed của bạn",
  2: "Bật thông báo khi kênh có bài mới",
  3: "Ưu tiên đầu feed + thông báo mọi bài & phiên trình chiếu",
};

// Icon RankUp (mẫu 6): chevron xếp tầng LỒNG trong vòng tròn — outline, biểu tượng thương hiệu.
function RankCircleChevrons({ level, color = "currentColor", size = 20 }) {
  const n = Math.max(1, Math.min(3, level));
  const cx = 12, w = 8, depth = 2.8, gap = 3.2;
  const stackH = depth + (n - 1) * gap;
  const top = (24 - stackH) / 2 + 0.3;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const yTip = top + i * gap;
    const yEdge = yTip + depth;
    lines.push(<polyline key={i} points={`${cx - w / 2},${yEdge} ${cx},${yTip} ${cx + w / 2},${yEdge}`} />);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      {lines}
    </svg>
  );
}

// Icon RankUp dạng outline (giống engagement bar): N chữ V xếp chồng = tầng N.
function RankChevrons({ level, color = "currentColor", size = 18 }) {
  const n = Math.max(1, Math.min(3, level));
  const cx = size / 2;
  const w = 13, depth = 4.5, gap = 4.5;
  const stackH = depth + (n - 1) * gap;
  const top = (size - stackH) / 2;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const yTip = top + i * gap;
    const yEdge = yTip + depth;
    lines.push(<polyline key={i} points={`${cx - w / 2},${yEdge} ${cx},${yTip} ${cx + w / 2},${yEdge}`} />);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      {lines}
    </svg>
  );
}

// RankUp/RankDown (hướng A): pill có chữ + popover chọn tầng. Luôn thấy đang ở tầng
// nào; popover mô tả từng tầng, khoá "Fan cuồng" kèm thanh tiến độ, và có "Bỏ RankUp".
function RankUpControl({ tier = 0, onSetTier, fanCount = 0, fanRequired = 10, variant = "icon", align = "right" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const t = Math.max(0, Math.min(3, tier));
  const info = RANK_TIERS[t];
  const fanUnlocked = fanCount > fanRequired;
  const color = t === 0 ? C.textMuted : RANK_TIERS[t].color;
  // Tap lần đầu (đang trung lập) = RankUp lên Quan tâm. Tap khi đã rank = mở bảng chọn
  // tầng / RankDown.
  const tap = (e) => {
    e.stopPropagation();
    if (t === 0) onSetTier?.(1);
    else setOpen((v) => !v);
  };

  return (
    <div ref={rootRef} style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      {variant === "pill" ? (
        // Pill kèm chữ (kiểu nút Follow của Instagram) — đặt cạnh tên ở trang cá nhân.
        <button
          onClick={tap}
          aria-label="RankUp"
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 999, background: t === 0 ? C.gold : `${color}1A`, border: t === 0 ? "none" : `1px solid ${color}`, color: t === 0 ? "#1A1305" : color, fontFamily: bodyFont, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}
        >
          <RankChevrons level={t === 0 ? 1 : t} color={t === 0 ? "#1A1305" : color} size={14} />
          {t === 0 ? "RankUp" : info.label}
        </button>
      ) : (
        <button
          onClick={tap}
          title="RankUp"
          aria-label="RankUp"
          style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 999, background: t === 0 ? "transparent" : `${color}1A`, border: "none", cursor: "pointer", padding: 0 }}
        >
          <RankCircleChevrons level={t === 0 ? 1 : t} color={color} size={21} />
        </button>
      )}

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", [align === "left" ? "left" : "right"]: 0, width: 250, maxWidth: "82vw", background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 14, padding: 6, boxShadow: "0 10px 30px rgba(0,0,0,0.45)", zIndex: 200 }}>
          {[1, 2, 3].map((lv) => {
            const tinfo = RANK_TIERS[lv];
            const locked = lv === 3 && !fanUnlocked;
            const active = t === lv;
            return (
              <button
                key={lv}
                disabled={locked}
                onClick={() => { if (locked) return; onSetTier?.(lv); setOpen(false); }}
                style={{ display: "flex", gap: 10, width: "100%", textAlign: "left", padding: "9px 10px", borderRadius: 10, border: "none", background: active ? `${tinfo.color}22` : "transparent", cursor: locked ? "not-allowed" : "pointer", alignItems: "flex-start" }}
              >
                <div style={{ marginTop: 1, flexShrink: 0 }}><RankChevrons level={lv} color={locked ? C.textFaint : tinfo.color} size={18} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 700, color: locked ? C.textFaint : C.text, display: "flex", alignItems: "center", gap: 5 }}>
                    {tinfo.label}
                    {active && <Check size={13} color={tinfo.color} strokeWidth={3} />}
                    {locked && <Lock size={12} color={C.textFaint} />}
                  </div>
                  <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, lineHeight: 1.35, marginTop: 2 }}>{RANK_DESC[lv]}</div>
                  {locked && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ height: 5, borderRadius: 999, background: C.surface, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(100, (fanCount / fanRequired) * 100)}%`, background: C.coral, borderRadius: 999 }} />
                      </div>
                      <div style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.coral, marginTop: 4 }}>Tham gia &gt;{fanRequired} bài của kênh để mở ({fanCount}/{fanRequired})</div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          {t > 0 && (
            <>
              <div style={{ height: 1, background: C.border, margin: "4px 8px" }} />
              <button onClick={() => { onSetTier?.(0); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", borderRadius: 10, border: "none", background: "transparent", color: C.textMuted, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                <X size={14} /> Bỏ RankUp (về trung lập)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Author identity strip — avatar, name, verified badge, follower count.
// Used on top of Rankie/Path/Deck cards. Tapping it opens that author's wall
// instead of the card itself, so it stops the click from bubbling up.
function AuthorRow({ author, onOpenAuthor, size = 30, rightSlot, rankTier = 0, onSetRank, fanCount = 0 }) {
  if (!author) return null;
  const isMe = author.id === "me";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 10,
      }}
    >
      <div
        onClick={isMe ? undefined : (e) => {
          e.stopPropagation();
          onOpenAuthor?.(author.id);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          flex: 1,
          cursor: onOpenAuthor && !isMe ? "pointer" : "default",
        }}
      >
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 99,
            background: author.avatarColor || C.surfaceRaised,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            fontSize: size * 0.5,
            lineHeight: 1,
            overflow: "hidden",
          }}
        >
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            author.avatarEmoji || "🙂"
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                fontFamily: bodyFont,
                fontWeight: 600,
                fontSize: 13,
                color: C.text,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {isMe ? "Bạn" : author.name}
            </span>
            {SHOW_VERIFIED && author.verified && (
              <span
                title="Đã xác minh"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 99,
                  background: C.teal,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Check size={9} color={C.bg} strokeWidth={3} />
              </span>
            )}
          </div>
          <div style={{ ...captionText, display: "flex", alignItems: "center", gap: 4 }}>
            <Star size={11} color={C.gold} fill={C.gold} /> {fmtCompact((author.followers || 0) + (rankTier || 0))} RP
          </div>
        </div>
      </div>
      {onSetRank && !isMe && (
        <RankUpControl tier={rankTier} onSetTier={(lv) => onSetRank(author.id, lv)} fanCount={fanCount} />
      )}
      {rightSlot && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {rightSlot}
        </div>
      )}
    </div>
  );
}

// "..." button + dropdown menu shown on a post card in the profile/wall view.
// Only rendered for posts the viewer owns (isMine) — read-only visitors never see it.
// Actions are passed in as callbacks so this component stays a dumb menu shell;
// ProfileView (and ultimately the root app) own what each action actually does.
function PostOptionsMenu({ post, onPin, onHide, onEdit, onDuplicate, onDelete, onVisibility, onStats, onExport }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const visibilityIcon = post.visibility === "private" ? Lock : post.visibility === "unlisted" ? Link2 : Globe;
  const VisIcon = visibilityIcon;
  const visibilityLabel =
    post.visibility === "private" ? "Chỉ mình tôi" : post.visibility === "unlisted" ? "Theo link" : "Công khai";

  const item = (icon, label, onClick, tone) => {
    const Icon = icon;
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(false);
          onClick?.();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "10px 14px",
          background: "none",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: bodyFont,
          fontSize: 13.5,
          fontWeight: 500,
          color: tone === "danger" ? "#E4634A" : C.text,
        }}
      >
        <Icon size={15} />
        {label}
      </button>
    );
  };

  return (
    <div ref={rootRef} style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Tùy chọn bài đăng"
        style={{
          background: "none",
          border: "none",
          color: C.textFaint,
          cursor: "pointer",
          padding: 6,
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
        }}
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: 210,
            background: C.surfaceRaised,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 30,
            overflow: "hidden",
            animation: "popIn 0.15s ease",
          }}
        >
          {item(post.pinned ? PinOff : Pin, post.pinned ? "Bỏ ghim" : "Ghim lên đầu", onPin)}
          {post.type !== "share" && item(Edit3, "Chỉnh sửa", onEdit)}
          {post.type !== "share" && item(Copy, "Nhân bản", onDuplicate)}
          {item(post.hidden ? Eye : EyeOff, post.hidden ? "Bỏ ẩn" : "Ẩn bài đăng", onHide)}
          <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
          {item(VisIcon, `Quyền riêng tư: ${visibilityLabel}`, onVisibility)}
          {post.type !== "share" && item(BarChart3, "Xem thống kê chi tiết", onStats)}
          {post.type !== "share" && item(Download, "Xuất số liệu (CSV)", onExport)}
          <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
          {item(Trash2, "Xóa", onDelete, "danger")}
        </div>
      )}
    </div>
  );
}

// Simple full-screen modal shell shared by the edit and stats dialogs below.
// Displays a single saved presenter session in the profile's Sessions tab.
function SessionResultCard({ session }) {
  const duration = session.endedAt
    ? Math.round((session.endedAt - session.startedAt) / 1000 / 60)
    : null;
  const sorted = [...(session.options || [])].sort((a, b) => b.votes - a.votes);
  const total = session.totalVotes || sorted.reduce((s, o) => s + o.votes, 0) || 1;
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 2 }}>
            {session.rankieTitle || "Phiên trình chiếu"}
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span>{new Date(session.startedAt).toLocaleString("vi-VN")}</span>
            {duration !== null && <span>{duration} phút</span>}
            <span>{fmt(total)} lượt bình chọn</span>
            <span style={{ color: session.mode === "reset" ? C.gold : C.teal }}>{session.mode === "reset" ? "Phiên mới" : "Giữ số liệu"}</span>
          </div>
        </div>
        <ChevronDown size={16} color={C.textFaint} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 2 }} />
      </button>

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {sorted.slice(0, 5).map((o, i) => {
              const pct = Math.round((o.votes / total) * 1000) / 10;
              return (
                <div key={o.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 12.5, marginBottom: 3 }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>{`#${i + 1} `}{o.label}</span>
                    <span style={{ color: C.textMuted, fontFamily: monoFont }}>{pct}% · {fmt(o.votes)}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: C.surfaceRaised, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: o.color || C.teal, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => exportPostToCSV({ title: session.rankieTitle, options: session.options, type: "rankie" })}
              style={{ flex: 1, padding: "9px 10px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceRaised, color: C.text, fontFamily: bodyFont, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Download size={13} /> Xuất CSV
            </button>
            <button
              onClick={() => { const link = `https://rankev.app/vote/${session.rankieId}`; navigator.clipboard?.writeText(link).catch(() => {}); }}
              style={{ flex: 1, padding: "9px 10px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceRaised, color: C.text, fontFamily: bodyFont, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Link2 size={13} /> Chia sẻ
            </button>
            <button
              onClick={() => alert("Trong bản thật: xuất kết quả dưới dạng ảnh PNG.")}
              style={{ flex: 1, padding: "9px 10px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceRaised, color: C.text, fontFamily: bodyFont, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <ImagePlus size={13} /> Lưu ảnh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Full-screen list of every Rankie/Path/Deck the viewer has voted on or completed,
// newest-participation-first. Each entry re-opens that item; entries can be removed
// individually, and the whole list can be cleared.
// ---- Chi tiết phiên trình chiếu: số liệu thu thập được trong buổi (hội thảo, họp,
// bầu cử, thi cử) kèm bộ lọc theo kết quả và nhân khẩu học (giới tính, độ tuổi, nghề). ----
const SD_GENDERS = ["Nam", "Nữ", "Khác"];
const SD_AGES = ["<18", "18–25", "26–35", "36–50", ">50"];
const SD_OCCUPATIONS = ["Học sinh/SV", "Nhân viên VP", "Kỹ sư", "Kinh doanh", "Giáo viên", "Khác"];

function sdHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function sdRng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function sdPick(arr, r) { return arr[Math.floor(r() * arr.length)]; }

// Các "kết quả" có thể có của một bài (để phân nhóm người tham gia trong phiên).
function sessionResultOptions(post) {
  if (!post) return [{ id: "?", label: "Không rõ" }];
  if (post.type === "path" && post.results) return Object.keys(post.results).map((k) => ({ id: k, label: k }));
  if (post.type === "deck") {
    if (post.deckMode === "exam") return [{ id: "pass", label: "Đạt" }, { id: "fail", label: "Không đạt" }];
    const q = post.questions && post.questions[0];
    return q ? q.options.map((o) => ({ id: o.id, label: o.label })) : [{ id: "done", label: "Đã trả lời" }];
  }
  return (post.options || []).map((o) => ({ id: o.id, label: o.label }));
}

// Sinh danh sách người tham gia mô phỏng, ổn định theo id phiên (không đổi giữa các lần render).
const SD_NAMES = ["Minh Khoa","Lan Anh","Tuấn Anh","Hà My","Quang Huy","Thu Trang","Bảo Long","Yến Nhi","Đức Khải","Kim Ngân","Hoài Nam","Phương Linh","Trọng Nghĩa","Gia Hân","Nhật Minh","Mỹ Linh","Văn Toàn","Thùy Dung","Hữu Đức","Ngọc Mai"];
function makeSessionParticipants(session, post) {
  const n = Math.max(6, Math.min(400, session.participants || session.totalVotes || 40));
  const r = sdRng(sdHash(session.id || "s") ^ n);
  const results = sessionResultOptions(post);
  const isExam = post?.type === "deck" && post?.deckMode === "exam";
  const questions = post?.questions || [];
  return Array.from({ length: n }, (_, i) => {
    const skill = 0.3 + r() * 0.65; // 30–95% khả năng chọn đúng (mô phỏng học lực)
    const p = {
      id: i,
      name: SD_NAMES[i % SD_NAMES.length] + (i >= SD_NAMES.length ? ` ${Math.floor(i / SD_NAMES.length) + 1}` : ""),
      gender: sdPick(SD_GENDERS, r),
      age: sdPick(SD_AGES, r),
      occupation: sdPick(SD_OCCUPATIONS, r),
      resultId: sdPick(results, r).id,
      skill,
    };
    if (isExam) {
      let totalPts = 0, maxPts = 0;
      questions.forEach((q, qi) => {
        const pts = q.points || 1;
        maxPts += pts;
        const correctIds = (q.options || []).filter((o) => o.correct).map((o) => o.id);
        if (!correctIds.length) return;
        if (correctIds.includes(participantAnswerId(p, qi, q.options || []))) totalPts += pts;
      });
      p.score10 = maxPts > 0 ? Math.round((totalPts / maxPts) * 100) / 10 : 0;
    }
    return p;
  });
}

// Đáp án cố định của 1 người cho câu qi — ổn định theo id người + id câu (dùng chung
// cho tính phân bố VÀ lọc để luôn khớp). Exam: người skill cao dễ chọn ĐÚNG (phân bố
// không còn đều 25%); Survey (không có đáp án đúng): phân bố đều theo lựa chọn.
function participantAnswerId(p, qi, opts) {
  if (!opts || !opts.length) return p.resultId ?? null;
  const seed = (p.id * 97 + qi * 13) >>> 0;
  const correctIds = opts.filter((o) => o.correct).map((o) => o.id);
  if (correctIds.length && p.skill != null) {
    const coin = (seed % 1000) / 1000;
    if (coin < p.skill) return correctIds[seed % correctIds.length];
    const wrong = opts.filter((o) => !o.correct);
    return (wrong.length ? wrong[seed % wrong.length] : opts[seed % opts.length]).id;
  }
  return opts[seed % opts.length].id;
}

// 1 câu hỏi trong bộ lọc "Đáp án" — accordion gập gọn, mở ra mới thấy các đáp án
// để chọn lọc (crosstab: kết hợp với nhân khẩu học bên dưới).
function QuestionFilterAccordion({ qi, qLabel, opts, selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const activeCount = selected.length;
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 7, overflow: "hidden" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "10px 12px", background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600, color: C.text, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
          {qLabel}
          {activeCount > 0 && <span style={{ color: C.gold, fontWeight: 700 }}> ({activeCount})</span>}
        </span>
        <ChevronDown size={15} color={C.textFaint} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ padding: "0 12px 11px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {opts.map((o) => {
            const active = selected.includes(o.id);
            return (
              <button key={o.id} onClick={() => onToggle(o.id)} style={{ padding: "6px 11px", borderRadius: 999, border: `1px solid ${active ? C.gold : C.border}`, background: active ? C.goldSoft : "transparent", color: active ? C.gold : C.textMuted, fontFamily: bodyFont, fontSize: 11.5, fontWeight: active ? 700 : 400, cursor: "pointer" }}>{o.label}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SessionFilterGroup({ title, options, selected, onToggle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {title && <div style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: C.textFaint, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7 }}>{title}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((opt) => {
          const id = typeof opt === "string" ? opt : opt.id;
          const label = typeof opt === "string" ? opt : opt.label;
          const active = selected.includes(id);
          return (
            <button key={id} onClick={() => onToggle(id)} style={{ padding: "6px 11px", borderRadius: 999, border: `1px solid ${active ? C.gold : C.border}`, background: active ? C.goldSoft : "transparent", color: active ? C.gold : C.textMuted, fontFamily: bodyFont, fontSize: 12, fontWeight: 600, cursor: "pointer", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SessionBreakdown({ title, keys, counts, total }) {
  return (
    <div style={{ ...cardSurface, marginBottom: 12 }}>
      <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {keys.map((k) => {
          const c = counts[k] || 0;
          const pct = total > 0 ? Math.round((c / total) * 1000) / 10 : 0;
          return (
            <div key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 12.5, marginBottom: 3 }}>
                <span style={{ color: C.textMuted }}>{k}</span>
                <span style={{ color: C.textFaint, fontFamily: monoFont }}>{c} · {pct}%</span>
              </div>
              <div style={{ height: 8, background: C.surfaceRaised, borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: C.gold, borderRadius: 5 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Trang chi tiết một phiên trình chiếu: bộ lọc (kết quả + giới tính/độ tuổi/nghề) và
// số liệu tính lại theo nhóm được lọc. Dữ liệu người tham gia là mô phỏng (chưa có
// backend thu thập thật — sẽ nối ở giai đoạn Claude Code).
// ---------- Exam question stats (mô phỏng) ----------
// Sinh tỉ lệ đúng + phân bố lựa chọn ổn định cho mỗi câu (chưa có backend thống kê
// thật). Option đúng được "boost" nhẹ nhưng vẫn có câu khó (tỉ lệ đúng thấp).
function examQuestionStats(q, seed) {
  const opts = q.options || [];
  if (!opts.length || q.votingType === "text") return null;
  const r = sdRng((seed ^ sdHash(q.id)) >>> 0);
  const difficulty = r(); // 0 dễ … 1 khó
  const weights = opts.map((o) => (o.correct ? (1 - difficulty) * 0.7 + 0.15 : r() * (0.2 + difficulty * 0.5) + 0.03));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let dist = weights.map((w) => Math.round((w / sum) * 100));
  // Ép tổng = 100 (bù/trừ vào phần tử lớn nhất).
  const diff = 100 - dist.reduce((a, b) => a + b, 0);
  const maxIdx = dist.indexOf(Math.max(...dist));
  dist[maxIdx] += diff;
  const correctIdx = opts.findIndex((o) => o.correct);
  return { dist, correctRate: correctIdx >= 0 ? dist[correctIdx] : 0, correctIdx };
}

// ---------- Path Companions (người cùng kết quả) ----------
// Mỗi ending là một "cộng đồng" nhỏ — người dùng đến cùng kết quả. Prototype mô phỏng
// danh sách ổn định theo (path + ending); backend thật sẽ thay bằng người dùng thực.
const COMPANION_POOL = [
  { name: "Minh Anh", emoji: "🌸", color: "#3D1F3A" },
  { name: "Hoàng Nam", emoji: "😎", color: "#1E3A5F" },
  { name: "Thu Hà", emoji: "🌿", color: "#1A3328" },
  { name: "Đức Anh", emoji: "🎮", color: "#2A1F3D" },
  { name: "Bảo Trân", emoji: "✨", color: "#3D2F1A" },
  { name: "Quang Huy", emoji: "🚀", color: "#1E2F3A" },
  { name: "Mai Chi", emoji: "🎨", color: "#3A1F2A" },
  { name: "Tuấn Kiệt", emoji: "🧑‍💻", color: "#1A2F33" },
  { name: "Ngọc Ánh", emoji: "🌷", color: "#33261A" },
  { name: "Gia Bảo", emoji: "⚡", color: "#2A331A" },
];
function makeCompanions(seed, howMany = 5) {
  const r = sdRng(seed >>> 0);
  const pool = [...COMPANION_POOL];
  const picked = [];
  const k = Math.min(howMany, pool.length);
  for (let i = 0; i < k; i++) picked.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return picked;
}

// ---------- Rankie Competition Timeline ----------
// Mô phỏng lịch sử thay đổi thứ hạng (chưa có backend lưu vote theo thời gian thực —
// sẽ nối dữ liệu thật ở giai đoạn Claude Code). Sinh ổn định theo id Rankie nên
// không đổi giữa các lần render/mở lại.
function generateRankieTimeline(rankie, options) {
  if (!options || options.length < 2) return [];
  const seedBase = sdHash(rankie.id || rankie.title || "rankie");
  const now = Date.now();
  // Khoảng thời gian mô phỏng dao động 15-45 ngày theo từng Rankie — đủ để đôi khi
  // xuất hiện mốc "giữ vững #1" mà không cố định cứng 30 ngày cho mọi bài.
  const rSpan = sdRng(seedBase ^ 0x51);
  const daySpan = 15 + Math.round(rSpan() * 30);
  const snapCount = 7;
  const snapTimes = Array.from({ length: snapCount }, (_, i) => now - Math.round(((snapCount - 1 - i) / (snapCount - 1)) * daySpan * 86400000));

  const history = options.map((o, oi) => {
    const r = sdRng(seedBase ^ sdHash(o.id || String(oi)) ^ (oi * 7919));
    const finalV = o.votes || 0;
    let acc = 0;
    const fracs = [];
    for (let i = 0; i < snapCount; i++) { acc += r() * (1 / snapCount) + 0.04; fracs.push(acc); }
    const maxAcc = fracs[fracs.length - 1] || 1;
    const votesAtSnap = fracs.map((f) => Math.max(0, Math.round((f / maxAcc) * finalV)));
    votesAtSnap[snapCount - 1] = finalV;
    return { id: o.id, label: o.label, votesAtSnap };
  });

  // Rankie đối đầu (2 lựa chọn): không có khái niệm "vượt vào Top N", chỉ theo dõi
  // ai đang dẫn đầu qua từng mốc thời gian + mốc lượt bình chọn.
  if (options.length === 2) {
    const events = [];
    let prevLeader = null;
    let leaderStreak = true;
    for (let s = 0; s < snapCount; s++) {
      const [x, y] = history;
      const leader = x.votesAtSnap[s] >= y.votesAtSnap[s] ? x : y;
      if (prevLeader && leader.id !== prevLeader.id) {
        events.push({ ts: snapTimes[s], icon: "🔥", text: `${leader.label} vươn lên dẫn đầu` });
      }
      if (prevLeader && prevLeader.id !== leader.id) leaderStreak = false;
      if (s > 0) {
        history.forEach((h) => {
          const prevV = h.votesAtSnap[s - 1], curV = h.votesAtSnap[s];
          [1000, 10000].forEach((m) => {
            if (prevV < m && curV >= m) events.push({ ts: snapTimes[s], icon: "🎉", text: `${h.label} đạt ${fmt(m)} lượt bình chọn` });
          });
        });
      }
      prevLeader = leader;
    }
    if (leaderStreak && prevLeader) {
      events.push({ ts: snapTimes[snapCount - 1], icon: "👑", text: `${prevLeader.label} giữ vững vị trí dẫn đầu suốt ${daySpan} ngày qua` });
    }
    return events.sort((a, b) => b.ts - a.ts);
  }
  if (options.length < 3) return [];

  const events = [];
  const seen = new Set();
  let prevRanks = null;
  let rank1Streak = true; // vẫn còn #1 xuyên suốt từ đầu đến snapshot hiện tại?

  for (let s = 0; s < snapCount; s++) {
    const snapshot = history
      .map((h) => ({ id: h.id, label: h.label, votes: h.votesAtSnap[s] }))
      .sort((a, b) => b.votes - a.votes);
    const ranks = {};
    snapshot.forEach((o, i) => { ranks[o.id] = i + 1; });

    if (prevRanks) {
      // Overtake: A vượt B nếu trước đó A đứng sau B, giờ A đứng trước B.
      for (const a of history) {
        for (const b of history) {
          if (a.id === b.id) continue;
          if (prevRanks[a.id] > prevRanks[b.id] && ranks[a.id] < ranks[b.id]) {
            const key = `ot:${s}:${a.id}:${b.id}`;
            if (seen.has(key)) continue;
            seen.add(key);
            events.push({
              ts: snapTimes[s],
              icon: ranks[a.id] === 1 ? "🔥" : "⚡",
              text: ranks[a.id] === 1
                ? `${a.label} vượt qua ${b.label} và vươn lên #1`
                : `${a.label} vượt qua ${b.label}, lên hạng #${ranks[a.id]}`,
            });
          }
        }
      }
      // Mốc hạng: lần đầu #1 / lọt Top 3 / lọt Top 10 / rớt khỏi Top 10
      history.forEach((h) => {
        const prevRank = prevRanks[h.id], curRank = ranks[h.id];
        if (curRank === 1 && prevRank !== 1) {
          const key = `m1:${h.id}`;
          if (!seen.has(key)) { seen.add(key); events.push({ ts: snapTimes[s], icon: "🏆", text: `${h.label} lần đầu đạt #1` }); }
        }
        if (options.length > 3 && curRank <= 3 && prevRank > 3) {
          events.push({ ts: snapTimes[s], icon: "🚀", text: `${h.label} lọt Top 3` });
        }
        if (options.length > 10 && curRank <= 10 && prevRank > 10) {
          events.push({ ts: snapTimes[s], icon: "🚀", text: `${h.label} lọt Top 10` });
        }
        if (options.length > 10 && curRank > 10 && prevRank <= 10) {
          events.push({ ts: snapTimes[s], icon: "📉", text: `${h.label} rớt khỏi Top 10` });
        }
      });
      // Mốc lượt bình chọn
      history.forEach((h) => {
        const prevV = h.votesAtSnap[s - 1], curV = h.votesAtSnap[s];
        [1000, 10000].forEach((m) => {
          if (prevV < m && curV >= m) events.push({ ts: snapTimes[s], icon: "🎉", text: `${h.label} đạt ${fmt(m)} lượt bình chọn` });
        });
      });
      // Có ai KHÔNG phải người đang #1 trước đó từng đứng #1 không? Nếu #1 đổi chủ, streak đứt.
      const currentTop = snapshot[0].id;
      if (prevRanks[currentTop] !== 1) rank1Streak = false;
    }
    prevRanks = ranks;
  }

  // Mốc "giữ vững #1 suốt N ngày" — chỉ khi #1 không đổi chủ trong toàn bộ lịch sử mô phỏng.
  if (rank1Streak) {
    const topId = Object.keys(prevRanks).find((id) => prevRanks[id] === 1);
    const top = history.find((h) => h.id === topId);
    if (top) events.push({ ts: snapTimes[snapCount - 1], icon: "👑", text: `${top.label} giữ vững #1 suốt ${daySpan} ngày qua` });
  }

  return events.sort((a, b) => b.ts - a.ts);
}

// Khối "Dòng thời gian" — đặt ngay dưới biểu đồ Rankie (giữ cuộn 1 mạch, không tách
// tab, để đồng nhất với Path/Survey/Exam). Hiện với mọi Rankie ≥2 lựa chọn: 2 lựa
// chọn (đối đầu) dùng bản rút gọn (đổi ngôi dẫn đầu + mốc lượt bình chọn), ≥3 lựa
// chọn dùng bản đầy đủ (overtake, Top 3/10, mốc #1).
function RankieTimeline({ rankie, options }) {
  const events = useMemo(() => generateRankieTimeline(rankie, options), [rankie?.id, options]);
  if (!events.length) return null;
  return (
    <div style={{ ...cardSurface, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>
        <Flame size={13} color={C.coral} /> Dòng thời gian cạnh tranh
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.slice(0, 8).map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
            <span style={{ fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>{e.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.text, lineHeight: 1.4 }}>{e.text}</div>
              <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, marginTop: 1 }}>{timeAgo(e.ts)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionDetailView({ session, post, onBack, onOpenPost }) {
  const participants = useMemo(() => makeSessionParticipants(session, post), [session, post]);
  const resultOpts = useMemo(() => sessionResultOptions(post), [post]);
  const palette = [C.teal, C.gold, C.coral, "#8B7FD1", "#6B4E43"];
  const [fGender, setFGender] = useState([]);
  const [fAge, setFAge] = useState([]);
  const [fOcc, setFOcc] = useState([]);
  const [fAnswers, setFAnswers] = useState({}); // key: q.id (deck) hoặc "result" (rankie/path) → [optionId,...]
  const [showFilter, setShowFilter] = useState(false);
  const [examTab, setExamTab] = useState("results"); // exam: results (per-student) | stats (thống kê)
  const toggle = (setter) => (id) => setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAnswer = (key) => (optId) => setFAnswers((prev) => {
    const cur = prev[key] || [];
    return { ...prev, [key]: cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId] };
  });
  const answerFilterCount = Object.values(fAnswers).reduce((s, a) => s + (a?.length || 0), 0);
  const anyFilter = fGender.length || fAge.length || fOcc.length || answerFilterCount;
  const clearAll = () => { setFGender([]); setFAge([]); setFOcc([]); setFAnswers({}); };

  // Kết quả theo từng câu hỏi (Survey/Exam) hoặc phân bố đơn (Rankie/Path)
  const isSurvey = post?.type === "deck" && post?.deckMode === "survey";
  const isExam = post?.type === "deck" && post?.deckMode === "exam";
  const isPath = post?.type === "path";
  const questions = post?.questions || [];

  // Lọc người tham gia — kết hợp nhân khẩu học VÀ đáp án đã chọn (crosstab, kiểu
  // SurveyMonkey/Qualtrics): "bao nhiêu nam 26-35 tuổi trả lời Hài lòng ở câu X".
  const filtered = participants.filter((p) => {
    if (fGender.length && !fGender.includes(p.gender)) return false;
    if (fAge.length && !fAge.includes(p.age)) return false;
    if (fOcc.length && !fOcc.includes(p.occupation)) return false;
    if (isSurvey || isExam) {
      for (let qi = 0; qi < questions.length; qi++) {
        const sel = fAnswers[questions[qi].id];
        if (sel && sel.length && !sel.includes(participantAnswerId(p, qi, questions[qi].options || []))) return false;
      }
    } else {
      const sel = fAnswers.result;
      if (sel && sel.length && !sel.includes(p.resultId)) return false;
    }
    return true;
  });

  const total = filtered.length || 1;
  const countBy = (arr, key) => arr.reduce((m, p) => { m[p[key]] = (m[p[key]] || 0) + 1; return m; }, {});
  const resultCountById = filtered.reduce((m, p) => { m[p.resultId] = (m[p.resultId] || 0) + 1; return m; }, {});

  // Phân bố theo câu hỏi Survey/Exam, tính trên tập đã lọc — dùng chung
  // participantAnswerId với bộ lọc nên số liệu luôn khớp với chip đã chọn.
  function questionDist(qi, opts) {
    return opts.map((o) => ({ ...o, filteredVotes: filtered.filter((p) => participantAnswerId(p, qi, opts) === o.id).length }));
  }

  return (
    <div>
      {/* Topbar sticky */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ ...iconButton, color: C.text }}><ChevronLeft size={20} /></button>
          <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 15, color: C.text }}>{session.name || "Chi tiết phiên"}</div>
        </div>
        <button onClick={() => setShowFilter(true)} style={{ display: "flex", alignItems: "center", gap: 5, background: anyFilter ? `${C.gold}18` : "transparent", border: `1px solid ${anyFilter ? C.gold : C.border}`, borderRadius: 999, padding: "6px 11px", cursor: "pointer" }}>
          <SlidersHorizontal size={14} color={anyFilter ? C.gold : C.textMuted} />
          <span style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: anyFilter ? C.gold : C.textMuted }}>
            Lọc{anyFilter ? ` (${fGender.length + fAge.length + fOcc.length + answerFilterCount})` : ""}
          </span>
        </button>
      </div>

      {/* Bộ lọc — bottom sheet, kết hợp đáp án + nhân khẩu học (crosstab) */}
      {showFilter && (
        <ModalShell title="Lọc kết quả" onClose={() => setShowFilter(false)}>
          <div style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: C.textFaint, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>Đáp án</div>
          {(isSurvey || isExam) ? (
            questions.map((q, qi) => (
              <QuestionFilterAccordion key={q.id} qi={qi} qLabel={`Câu ${qi + 1}: ${q.text}`} opts={q.options || []} selected={fAnswers[q.id] || []} onToggle={toggleAnswer(q.id)} />
            ))
          ) : (
            <SessionFilterGroup title="" options={resultOpts} selected={fAnswers.result || []} onToggle={toggleAnswer("result")} />
          )}

          <div style={{ height: 1, background: C.border, margin: "6px 0 14px" }} />
          <div style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: C.textFaint, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>Nhân khẩu học</div>
          <SessionFilterGroup title="Giới tính" options={SD_GENDERS} selected={fGender} onToggle={toggle(setFGender)} />
          <SessionFilterGroup title="Độ tuổi" options={SD_AGES} selected={fAge} onToggle={toggle(setFAge)} />
          <SessionFilterGroup title="Nghề nghiệp" options={SD_OCCUPATIONS} selected={fOcc} onToggle={toggle(setFOcc)} />

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {anyFilter && (
              <button onClick={clearAll} style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, color: C.coral, borderRadius: 10, padding: "11px 12px", fontFamily: bodyFont, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Xoá lọc</button>
            )}
            <button onClick={() => setShowFilter(false)} style={{ flex: 1, background: C.gold, border: "none", color: "#1a1408", borderRadius: 10, padding: "11px 12px", fontFamily: bodyFont, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Xem kết quả {anyFilter ? `(${fmt(filtered.length)} người)` : ""}
            </button>
          </div>
        </ModalShell>
      )}

      <div style={{ padding: 16 }}>
        {/* Tổng quan phiên */}
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", ...cardSurface, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: monoFont, fontWeight: 800, fontSize: 26, color: C.gold }}>{fmt(filtered.length)}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, marginTop: 2 }}>{anyFilter ? "khớp lọc" : "người tham gia"}</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div>
            <div style={{ fontFamily: monoFont, fontWeight: 800, fontSize: 26, color: C.teal }}>{post?.questions?.length || resultOpts.length}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, marginTop: 2 }}>{isExam ? "câu hỏi" : isSurvey ? "câu hỏi" : "kết quả"}</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div>
            <div style={{ fontFamily: monoFont, fontWeight: 800, fontSize: 26, color: C.text }}>{fmt(participants.length)}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, marginTop: 2 }}>tổng cộng</div>
          </div>
        </div>

        {/* Exam: tách 2 mục — Kết quả (từng học sinh) và Thống kê (phân bố câu hỏi). */}
        {isExam && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4 }}>
            {[["results", "Kết quả"], ["stats", "Thống kê"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setExamTab(id)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: examTab === id ? C.gold : "transparent", color: examTab === id ? "#1A1305" : C.textMuted, fontFamily: bodyFont, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{lbl}</button>
            ))}
          </div>
        )}

        {/* KẾT QUẢ TỪNG HỌC SINH (exam) — điểm + đạt/chưa đạt, xếp theo điểm giảm dần. */}
        {isExam && examTab === "results" && (
          <div style={{ ...cardSurface, marginBottom: 12 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Kết quả từng người ({fmt(filtered.length)})</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[...filtered].sort((a, b) => (b.score10 || 0) - (a.score10 || 0)).map((p, i) => {
                const passed = post.passingScore == null || (p.score10 || 0) >= post.passingScore;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 2px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ fontFamily: monoFont, fontSize: 12, color: C.textFaint, width: 22, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: bodyFont, fontSize: 13.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                    <span style={{ fontFamily: bodyFont, fontSize: 10.5, fontWeight: 700, color: passed ? "#4ADE80" : C.coral, background: passed ? "#4ADE8018" : `${C.coral}18`, borderRadius: 99, padding: "3px 9px", flexShrink: 0 }}>{passed ? "ĐẠT" : "CHƯA ĐẠT"}</span>
                    <span style={{ fontFamily: monoFont, fontSize: 14, fontWeight: 800, color: C.gold, flexShrink: 0, width: 54, textAlign: "right" }}>{p.score10}<span style={{ fontSize: 10, color: C.textFaint }}>/10</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* === THỐNG KÊ: PHÂN BỐ THEO CÂU HỎI === */}
        {(isSurvey || (isExam && examTab === "stats")) && post?.questions?.map((q, qi) => {
          const opts = q.options || [];
          const dist = questionDist(qi, opts);
          const qTotal = dist.reduce((s, o) => s + o.filteredVotes, 0) || 1;
          const sorted = [...dist].sort((a, b) => b.filteredVotes - a.filteredVotes);
          return (
            <div key={q.id} style={{ ...cardSurface, marginBottom: 12 }}>
              <div style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: C.textFaint, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 5 }}>
                Câu {qi + 1}{isExam ? ` · ${q.points || 0} điểm` : ""}
              </div>
              <div style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12, lineHeight: 1.35 }}>{q.text}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {sorted.map((o, i) => {
                  const pct = Math.round((o.filteredVotes / qTotal) * 1000) / 10;
                  const isTop = i === 0;
                  const isCorrect = isExam && o.correct;
                  const barColor = isCorrect ? C.teal : isTop ? palette[1] : palette[i % palette.length];
                  return (
                    <div key={o.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: isTop ? C.text : C.textMuted, fontWeight: isTop ? 700 : 400, display: "flex", alignItems: "center", gap: 5 }}>
                          {isTop && "🥇 "}{o.label}
                          {isCorrect && <Check size={13} color={C.teal} strokeWidth={3} />}
                        </span>
                        <span style={{ color: barColor, fontFamily: monoFont, fontWeight: 700 }}>{pct}% <span style={{ color: C.textFaint, fontWeight: 400, fontSize: 11 }}>({fmt(o.filteredVotes)})</span></span>
                      </div>
                      <div style={{ height: 20, borderRadius: 7, background: C.surfaceRaised, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 7, transition: "width 0.5s cubic-bezier(.22,1,.36,1)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Path / Rankie — phân bố kết quả */}
        {(isPath || (!isSurvey && !isExam)) && (
          <div style={{ ...cardSurface, marginBottom: 12 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Phân bố kết quả</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {resultOpts.map((o, i) => {
                const cnt = resultCountById[o.id] || 0;
                const pct = Math.round((cnt / total) * 1000) / 10;
                const isTop = i === 0 || cnt === Math.max(...resultOpts.map((x) => resultCountById[x.id] || 0));
                return (
                  <div key={o.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: isTop ? C.text : C.textMuted, fontWeight: isTop ? 700 : 400 }}>{isTop && "🥇 "}{o.label}</span>
                      <span style={{ color: palette[i % palette.length], fontFamily: monoFont, fontWeight: 700 }}>{pct}% <span style={{ color: C.textFaint, fontWeight: 400, fontSize: 11 }}>({fmt(cnt)})</span></span>
                    </div>
                    <div style={{ height: 20, borderRadius: 7, background: C.surfaceRaised, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: palette[i % palette.length], borderRadius: 7, transition: "width 0.5s cubic-bezier(.22,1,.36,1)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Nhân khẩu học — phụ trợ, hiện sau kết quả */}
        {anyFilter && (
          <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, marginBottom: 10, textAlign: "center" }}>
            Kết quả trên tính cho <span style={{ color: C.gold, fontWeight: 700 }}>{fmt(filtered.length)}</span> người khớp bộ lọc
          </div>
        )}
        <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: C.textFaint, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>
          Nhân khẩu học{anyFilter ? " (nhóm được lọc)" : ""}
        </div>
        <SessionBreakdown title="Giới tính" keys={SD_GENDERS} counts={countBy(filtered, "gender")} total={filtered.length} />
        <SessionBreakdown title="Độ tuổi" keys={SD_AGES} counts={countBy(filtered, "age")} total={filtered.length} />
        <SessionBreakdown title="Nghề nghiệp" keys={SD_OCCUPATIONS} counts={countBy(filtered, "occupation")} total={filtered.length} />

        {onOpenPost && (
          <button onClick={onOpenPost} style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, color: C.teal, borderRadius: 10, padding: "11px 12px", fontFamily: bodyFont, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Link2 size={14} /> Mở bài gốc
          </button>
        )}
      </div>
    </div>
  );
}

// "Lịch sử trình chiếu" — các phiên Rankie/Survey/Exam đã lưu kèm tên, tách biệt
// hoàn toàn với "Lịch sử tham gia" (việc bạn đã làm) và "Đánh dấu" (bài muốn xem sau).
function PresentationHistoryView({ history, onOpenSession, onBack }) {
  const [filter, setFilter] = useState("all"); // all | rankie | survey | exam
  const getIcon = (entry) => entry.type === "rankie" ? FlagTypeIcon : entry.type === "path" ? GitBranch : entry.deckMode === "exam" ? Edit3 : Layers;
  const getLabel = (entry) => entry.type === "rankie" ? "Rankie" : entry.type === "path" ? "Path" : entry.deckMode === "exam" ? "Exam" : "Survey";

  const filtered = history.filter((entry) => {
    if (filter === "all") return true;
    if (filter === "survey") return entry.type === "deck" && entry.deckMode !== "exam";
    if (filter === "exam") return entry.type === "deck" && entry.deckMode === "exam";
    return entry.type === filter;
  });

  const filterTabs = [
    { id: "all", label: "Tất cả" },
    { id: "rankie", label: "Rankie" },
    { id: "path", label: "Path" },
    { id: "survey", label: "Survey" },
    { id: "exam", label: "Exam" },
  ];

  const openEntry = (entry) => onOpenSession(entry);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
        <button onClick={onBack} style={{ ...iconButton, color: C.text }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 15, color: C.text }}>Lịch sử trình chiếu</div>
      </div>

      <div style={{ padding: 16 }}>
        {history.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
            {filterTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                style={{
                  flexShrink: 0, padding: "6px 14px", borderRadius: 999,
                  border: `1px solid ${filter === t.id ? C.gold : C.border}`,
                  background: filter === t.id ? C.goldSoft : "transparent",
                  color: filter === t.id ? C.gold : C.textMuted,
                  fontFamily: bodyFont, fontWeight: 600, fontSize: 12, cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: C.textFaint, fontFamily: bodyFont, fontSize: 13.5 }}>
            {history.length === 0
              ? "Chưa có phiên trình chiếu nào được lưu. Sau khi trình chiếu một Rankie, Survey, hoặc Exam, bấm \"Lưu phiên trình chiếu\" để nó xuất hiện ở đây."
              : "Không có mục nào khớp với bộ lọc này."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((entry) => {
              const Icon = getIcon(entry);
              return (
                <div
                  key={entry.id}
                  style={{ ...cardSurface, padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                  onClick={() => openEntry(entry)}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.goldSoft, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon size={17} color={C.gold} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <Pill tone="muted">{getLabel(entry)}</Pill>
                      <span style={captionText}>{timeAgo(entry.endedAt)} trước</span>
                    </div>
                    <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 13.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {entry.name}
                    </div>
                    <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textMuted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {entry.itemTitle} · {entry.meta}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// "Đánh dấu" — bài được đánh dấu để xem/làm lại sau, không liên quan tới việc đã tham gia hay chưa.
function BookmarksView({ bookmarks, onOpenRankie, onOpenPath, onOpenDeck, onToggleBookmark, onBack }) {
  const list = Object.values(bookmarks || {}).sort((a, b) => (b.bookmarkedAt || 0) - (a.bookmarkedAt || 0));
  const getIcon = (item) => item.type === "rankie" ? FlagTypeIcon : item.type === "path" ? GitBranch : item.deckMode === "exam" ? Edit3 : Layers;
  const getLabel = (item) => item.type === "rankie" ? "Rankie" : item.type === "path" ? "Path" : item.deckMode === "exam" ? "Exam" : "Survey";
  const openItem = (item) => {
    if (item.type === "rankie") onOpenRankie(item.id);
    else if (item.type === "path") onOpenPath(item.id);
    else onOpenDeck(item.id);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
        <button onClick={onBack} style={{ ...iconButton, color: C.text }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 15, color: C.text }}>Đánh dấu</div>
      </div>

      <div style={{ padding: 16 }}>
        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: C.textFaint, fontFamily: bodyFont, fontSize: 13.5 }}>
            Chưa đánh dấu bài nào. Bấm icon 🔖 trên một bài để lưu lại xem/làm sau.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((item) => {
              const Icon = getIcon(item);
              return (
                <div
                  key={`${item.type}:${item.id}`}
                  style={{ ...cardSurface, padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                  onClick={() => openItem(item)}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.surfaceRaised, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon size={17} color={C.gold} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <Pill tone="muted">{getLabel(item)}</Pill>
                    </div>
                    <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.title}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleBookmark(item); }}
                    style={{ ...iconButton, color: C.textFaint, flexShrink: 0 }}
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipationHistoryView({ history, onOpenRankie, onOpenPath, onOpenDeck, onRemove, onClear, onBack }) {
  const [filter, setFilter] = useState("all"); // all | rankie | path | survey | exam
  const getIcon = (entry) => entry.type === "rankie" ? BarChart3 : entry.type === "path" ? GitBranch : entry.deckMode === "exam" ? Edit3 : Layers;
  const getLabel = (entry) => entry.type === "rankie" ? "Rankie" : entry.type === "path" ? "Path" : entry.deckMode === "exam" ? "Exam" : "Survey";

  const filtered = history.filter((entry) => {
    if (filter === "all") return true;
    if (filter === "survey") return entry.type === "deck" && entry.deckMode !== "exam";
    if (filter === "exam") return entry.type === "deck" && entry.deckMode === "exam";
    return entry.type === filter;
  });

  const filterTabs = [
    { id: "all", label: "Tất cả" },
    { id: "rankie", label: "Rankie" },
    { id: "path", label: "Path" },
    { id: "survey", label: "Survey" },
    { id: "exam", label: "Exam" },
  ];

  const openEntry = (entry) => {
    if (entry.type === "rankie") onOpenRankie(entry.itemId);
    else if (entry.type === "path") onOpenPath(entry.itemId);
    else if (entry.type === "deck") onOpenDeck(entry.itemId);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ ...iconButton, color: C.text }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 15, color: C.text }}>Lịch sử tham gia</div>
        </div>
        {history.length > 0 && (
          <button onClick={onClear} style={{ background: "none", border: "none", color: C.textFaint, fontFamily: bodyFont, fontSize: 12, cursor: "pointer" }}>
            Xoá tất cả
          </button>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {history.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
            {filterTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                style={{
                  flexShrink: 0, padding: "6px 14px", borderRadius: 999,
                  border: `1px solid ${filter === t.id ? C.gold : C.border}`,
                  background: filter === t.id ? C.goldSoft : "transparent",
                  color: filter === t.id ? C.gold : C.textMuted,
                  fontFamily: bodyFont, fontWeight: 600, fontSize: 12, cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: C.textFaint, fontFamily: bodyFont, fontSize: 13.5 }}>
            {history.length === 0
              ? "Chưa có hoạt động nào. Khi bạn bình chọn một Rankie, làm một Path, trả lời một Survey, hoặc làm một Exam, nó sẽ xuất hiện ở đây."
              : "Không có mục nào khớp với bộ lọc này."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((entry) => {
              const Icon = getIcon(entry);
              return (
                <div
                  key={entry.key}
                  style={{ ...cardSurface, padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                  onClick={() => openEntry(entry)}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.surfaceRaised, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon size={17} color={C.gold} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <Pill tone="muted">{getLabel(entry)}</Pill>
                      <span style={captionText}>{timeAgo(entry.timestamp)} trước</span>
                    </div>
                    <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {entry.title}
                    </div>
                    {entry.detail && (
                      <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textMuted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Kết quả của bạn: {entry.detail}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(entry.key); }}
                    style={{ ...iconButton, color: C.textFaint, flexShrink: 0 }}
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


function ModalShell({ title, onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflowY: "auto",
          background: C.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          border: `1px solid ${C.border}`,
          borderBottom: "none",
          animation: "popIn 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.surface }}>
          <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 16, color: C.text }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}

// Lets the owner edit title + subtitle/caption. Options are intentionally not
// editable here once a post exists — changing them after votes have come in
// would silently invalidate collected data, which matters a lot for an app
// centered on data collection and analysis.
function EditPostModal({ post, onClose, onSave }) {
  const isRankie = post.type === "rankie";
  const [title, setTitle] = useState(post.title || "");
  const [caption, setCaption] = useState(post.caption || "");
  const [media, setMedia] = useState(post.media || null);
  const toOpt = (o) => ({ id: isUuid(o.id) ? o.id : undefined, label: o.label || "", emoji: o.emoji || "🔘", image: o.image || o.imageUrl || null, color: o.color });
  const [options, setOptions] = useState(isRankie ? (post.options || []).map(toOpt) : []);

  // Rankie THẬT: nạp full để có option id thật (giữ phiếu khi sửa) nếu bản hiện tại là summary.
  useEffect(() => {
    if (!isRankie || !isUuid(post.id)) return;
    if ((post.options || []).some((o) => isUuid(o.id))) return;
    let alive = true;
    api.posts.get(post.id).then((full) => { if (alive && full && full.type === "rankie") setOptions((full.options || []).map(toOpt)); }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRankie, post.id]);

  const inputStyle = { width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceRaised, color: C.text, fontFamily: bodyFont, fontSize: 14, marginTop: 6 };
  const urlOK = (v) => (typeof v === "string" && /^(https?:|data:)/.test(v) ? v : undefined);
  const uploadInto = (apply) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;
      apply(URL.createObjectURL(file));
      api.uploadImage(file, "image").then((res) => { if (res && res.url) apply(res.url); }).catch(() => {});
    };
    input.click();
  };
  const setOpt = (i, patch) => setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  const addOpt = () => setOptions((prev) => [...prev, { id: undefined, label: "", emoji: EMOJI_CHOICES[prev.length % EMOJI_CHOICES.length], image: null }]);
  const delOpt = (i) => setOptions((prev) => (prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev));

  const save = () => {
    const patch = { title: title.trim() || post.title, caption: caption.trim() || null };
    patch.media = media && (media.url || media.emoji || media.color) ? { type: media.type || "image", color: media.color, emoji: media.emoji, url: urlOK(media.url) } : null;
    if (isRankie) {
      const valid = options.filter((o) => (o.label || "").trim() || o.image);
      if (valid.length >= 2) {
        patch.options = valid.map((o) => {
          const it = { label: (o.label || "").trim() || undefined, emoji: o.emoji || undefined, imageUrl: urlOK(o.image), color: o.color || undefined };
          if (o.id) it.id = o.id;
          return it;
        });
      }
    }
    onSave(patch);
    onClose();
  };

  return (
    <ModalShell title="Chỉnh sửa bài đăng" onClose={onClose}>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint, fontWeight: 600 }}>Tiêu đề</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint, fontWeight: 600 }}>Mô tả</span>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: bodyFont }} />
      </div>

      {/* Ảnh bìa */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint, fontWeight: 600 }}>Ảnh bìa</span>
        {media && (media.url || media.emoji) ? (
          <div style={{ marginTop: 8, position: "relative" }}>
            <PostMedia media={media} height={140} />
            <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
              <button onClick={() => uploadInto((url) => setMedia({ type: "image", url }))} style={{ width: 30, height: 30, borderRadius: 99, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }} title="Đổi ảnh"><ImagePlus size={15} /></button>
              <button onClick={() => setMedia(null)} style={{ width: 30, height: 30, borderRadius: 99, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }} title="Xoá ảnh"><X size={15} /></button>
            </div>
          </div>
        ) : (
          <button onClick={() => uploadInto((url) => setMedia({ type: "image", url }))} style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", color: C.textMuted }}><ImagePlus size={15} /> Thêm ảnh bìa</button>
        )}
      </div>

      {/* Phương án bình chọn (chỉ rankie) */}
      {isRankie && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint, fontWeight: 600 }}>Phương án bình chọn</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {options.map((o, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => uploadInto((url) => setOpt(i, { image: url }))} title="Ảnh phương án" style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceRaised, cursor: "pointer", display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0, fontSize: 18 }}>
                  {o.image ? <img src={o.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (o.emoji || "🔘")}
                </button>
                <input value={o.label} onChange={(e) => setOpt(i, { label: e.target.value })} placeholder={`Phương án ${i + 1}`} style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
                <button onClick={() => delOpt(i)} disabled={options.length <= 2} title="Xoá phương án" style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: "transparent", color: options.length <= 2 ? C.textFaint : "#E4634A", cursor: options.length <= 2 ? "default" : "pointer", flexShrink: 0 }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <button onClick={addOpt} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 9, border: `1px dashed ${C.border}`, background: "transparent", color: C.textMuted, fontFamily: bodyFont, fontSize: 12.5, cursor: "pointer" }}><PlusCircle size={15} /> Thêm phương án</button>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, marginTop: 8, lineHeight: 1.4 }}>Phương án cũ giữ nguyên số phiếu; thêm mới bắt đầu từ 0; xoá thì bỏ phiếu của phương án đó. Phần trăm tự tính lại.</div>
        </div>
      )}
      {!isRankie && (
        <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, marginBottom: 16, lineHeight: 1.4 }}>
          Chỉnh sửa câu hỏi/đáp án của {post.type === "path" ? "Path" : "bài Khảo sát/Thi"} sẽ được bổ sung ở bản sau. Hiện có thể sửa tiêu đề, mô tả và ảnh bìa.
        </div>
      )}
      <button
        onClick={save}
        style={{
          width: "100%",
          padding: 13,
          borderRadius: 12,
          border: "none",
          background: C.gold,
          color: "#1A1305",
          fontFamily: bodyFont,
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Lưu thay đổi
      </button>
    </ModalShell>
  );
}

// Detailed per-option breakdown for a single post: votes, share, and (for
// unlimited-vote rankies) unique voters vs. total taps.
function PostStatsModal({ post, onClose, onExport }) {
  const rows =
    post.type === "deck"
      ? post.questions.flatMap((q) => q.options.map((o) => ({ ...o, question: q.text })))
      : post.type === "path"
      ? Object.entries(post.results || {}).map(([label, r]) => ({ id: label, label, votes: r.count || 0 }))
      : post.options || [];
  const total = rows.reduce((s, o) => s + (o.votes || 0), 0) || 1;
  const sorted = [...rows].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const isUnlimited = post.votingType === "unlimited";

  return (
    <ModalShell title="Thống kê chi tiết" onClose={onClose}>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <div style={{ ...raisedSurface, flex: 1, textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.text }}>{fmt(total)}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.textFaint }}>{isUnlimited ? "Tổng lượt bấm" : "Tổng lượt bình chọn"}</div>
        </div>
        <div style={{ ...raisedSurface, flex: 1, textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.text }}>{fmt(post.participants || 0)}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.textFaint }}>Người tham gia</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {sorted.map((o) => {
          const pct = Math.round((((o.votes || 0) / total) * 1000)) / 10;
          return (
            <div key={o.id}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: C.text, fontWeight: 600 }}>
                  {o.question ? `${o.question} — ` : ""}
                  {o.label}
                </span>
                <span style={{ color: C.textMuted, fontFamily: monoFont }}>
                  {pct}% · {fmt(o.votes || 0)}
                  {isUnlimited && o.voters != null && ` (${fmt(o.voters)} người)`}
                </span>
              </div>
              <div style={{ height: 10, borderRadius: 6, background: C.surfaceRaised, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: o.color || C.teal, borderRadius: 6 }} />
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onExport(post)}
        style={{
          width: "100%",
          padding: 13,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          background: C.surfaceRaised,
          color: C.text,
          fontFamily: bodyFont,
          fontWeight: 600,
          fontSize: 13.5,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Download size={15} /> Xuất số liệu (CSV)
      </button>
    </ModalShell>
  );
}

// Renders an emoji or an uploaded image inside a consistent tile
function Illustration({ emoji, image, size = 56, radius = 12 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        overflow: "hidden",
        background: C.surfaceRaised,
        border: `1px solid ${C.border}`,
        display: "grid",
        placeItems: "center",
      }}
    >
      {image ? (
        <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>{emoji || "❓"}</span>
      )}
    </div>
  );
}

// Marks "you voted for this one" next to an option's label. Uses the rankie
// creator's custom sticker/image (voteMarker) if they set one when creating the
// rankie; otherwise falls back to the default "VOTED" text badge.
function VotedMarker({ voteMarker, size = 16 }) {
  if (voteMarker && (voteMarker.emoji || voteMarker.image)) {
    return (
      <span style={{ display: "inline-flex", verticalAlign: "middle" }}>
        <Illustration emoji={voteMarker.emoji} image={voteMarker.image} size={size} radius={size >= 20 ? 6 : 4} />
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "1px 5px",
        borderRadius: 4,
        background: C.gold,
        color: "#1A1305",
        fontFamily: monoFont,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.3,
        verticalAlign: "middle",
      }}
    >
      VOTED
    </span>
  );
}

// Floating vote reaction — a small round sticker (an option's emoji/image, or a voter's
// avatar) that drifts upward and fades out, like Facebook Live's reaction bubbles.
// `left`/`bottom` position it (in px, relative to the nearest positioned ancestor).
function VoteBubble({ emoji, image, avatarColor, left, bottom, drift1, drift2, duration = 2.2 }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        bottom,
        width: 34,
        height: 34,
        borderRadius: 99,
        background: image ? undefined : avatarColor || C.surfaceRaised,
        border: `2px solid ${C.bg}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        fontSize: 17,
        pointerEvents: "none",
        animation: `bubbleFloat ${duration}s ease-out forwards`,
        // CSS custom properties consumed by the bubbleFloat keyframes for a slight sideways drift
        "--drift1": `${drift1}px`,
        "--drift2": `${drift2}px`,
      }}
    >
      {image ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : emoji || "👍"}
    </div>
  );
}

// Absolutely-positioned overlay that hosts all currently-floating VoteBubbles for a
// voting session. Sits inside a `position: relative` wrapper around the results/options
// area. Bubbles remove themselves from state once their float animation finishes.
function VoteBubbleLayer({ bubbles }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {bubbles.map((b) => (
        <VoteBubble
          key={b.id}
          emoji={b.emoji}
          image={b.image}
          avatarColor={b.avatarColor}
          left={b.left}
          bottom={b.bottom}
          drift1={b.drift1}
          drift2={b.drift2}
          duration={b.duration}
        />
      ))}
    </div>
  );
}


// Renders post media: an image (color-block placeholder) or a video (placeholder with play button).
// In the prototype, real files aren't uploaded; media carries { type, color, emoji, url? }.
function PostMedia({ media, height = 180, radius = 12 }) {
  if (!media) return null;
  const bg = media.url
    ? undefined
    : `linear-gradient(135deg, ${media.color || C.surfaceRaised}, ${C.surface})`;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: radius,
        overflow: "hidden",
        background: bg,
        border: `1px solid ${C.border}`,
        display: "grid",
        placeItems: "center",
      }}
    >
      {media.url ? (
        <img src={media.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: 54, opacity: 0.9 }}>{media.emoji || (media.type === "video" ? "🎬" : "🖼️")}</span>
      )}
      {media.type === "video" && (
        <>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
          <div
            style={{
              position: "absolute",
              width: 52,
              height: 52,
              borderRadius: 99,
              background: "rgba(0,0,0,0.55)",
              display: "grid",
              placeItems: "center",
              border: "2px solid rgba(255,255,255,0.85)",
            }}
          >
            <Play size={22} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
          </div>
          <span style={{ position: "absolute", bottom: 8, right: 10, fontFamily: monoFont, fontSize: 11, color: "#fff", background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: 5 }}>
            VIDEO
          </span>
        </>
      )}
    </div>
  );
}

// Post-style intro content shown above a card's data section: caption (clamped) + optional media.
// On feed cards, caption clamps to `clampLines` with a "…xem thêm" affordance (opens detail).
function PostContent({ caption, media, clampLines = 2, mediaHeight = 180, showMore = true }) {
  if (!caption && !media) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      {caption && (
        <div style={{ marginBottom: media ? 10 : 0 }}>
          <div
            style={{
              fontFamily: bodyFont,
              fontSize: 13.5,
              color: C.text,
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: clampLines,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {caption}
          </div>
          {showMore && (
            <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint, fontWeight: 600 }}>…xem thêm</span>
          )}
        </div>
      )}
      {media && <PostMedia media={media} height={mediaHeight} />}
    </div>
  );
}

function TopBar({ title, onBack, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderBottom: `1px solid ${C.border}`,
        background: C.bg,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {onBack && (
          <button onClick={onBack} style={{ ...iconButton, color: C.text }}>
            <ChevronLeft size={20} />
          </button>
        )}
        <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 17, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {title}
        </div>
      </div>
      <div>{right}</div>
    </div>
  );
}

// Facebook-style share icon (arrow curving up-right from a box)
function FbShareIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

// ---------- ENGAGEMENT BAR (kiểu Instagram) ----------
// Thanh tương tác dưới mỗi post Rankie/Path/Survey/Exam: icon + số đếm ngay
// cạnh nhau, không có chữ nhãn ("tham gia"/"bình luận"...). Icon đầu tiên đổi
// theo loại nội dung (cờ cho Rankie, nhánh cho Path, lớp cho Survey, bút cho
// Exam) và CHỈ đổi màu khi `joined` là true, tức là dữ liệu thật xác nhận
// người dùng đã tham gia (không còn là toggle trang trí). Khi chưa tham gia,
// bấm vào icon đó sẽ gọi onJoinClick để mở màn hình chi tiết (nơi họ thực sự
// tham gia), giống hệt việc bấm vào thẻ bài.
function FlagTypeIcon({ size = 20, color = C.textMuted }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </svg>
  );
}
// icon theo loại nội dung — dùng chung icon đã có ở badge PATH/SURVEY/EXAM để nhất quán
const ENGAGEMENT_TYPE_ICON = { rankie: FlagTypeIcon, path: GitBranch, survey: Layers, exam: Edit3 };

function IconCommentBubble({ size = 20, color = C.textMuted }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L21 21l-.344-3.992Z" />
    </svg>
  );
}
function IconShareArrow({ size = 20, color = C.textMuted }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3 22 12 2 21l4-9-4-9Z" />
      <path d="M6 12h13" />
    </svg>
  );
}
function IconBookmark({ filled, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? C.gold : "none"} stroke={filled ? C.gold : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
    </svg>
  );
}

// `type`: "rankie" | "path" | "survey" | "exam" — chọn icon phù hợp.
// `joined`: trạng thái tham gia THẬT (từ dữ liệu, không phải state nội bộ) —
// đây cũng chính là "lịch sử tham gia" (đã vote/đã làm bài hay chưa).
// `sessionCount`: số phiên trình chiếu mà CHÍNH bạn đã tạo/chạy cho bài này —
// chỉ áp dụng cho Rankie/Survey/Exam (Path chưa có tính năng trình chiếu nên
// truyền sessionCount={null} để ẩn hẳn icon này). Icon chỉ đổi màu (vàng) khi
// đã từng tạo ít nhất 1 phiên; chưa tạo lần nào thì vẫn hiện icon+0 nhưng màu xám.
// `onJoinClick`: luôn mở màn hình chi tiết — dù đã tham gia (xem lại kết quả)
// hay chưa (để tham gia thật).
function EngagementBar({ type = "rankie", joined = false, participants = 0, comments = 0, shares = 0, sessionCount = null, sessionList = [], onSeeAllSessions, onOpenSession, bookmarked = false, onJoinClick, onCommentClick, onShareClick, onBookmarkClick }) {
  const TypeIcon = ENGAGEMENT_TYPE_ICON[type] || FlagTypeIcon;
  const joinColor = joined ? C.coral : C.textMuted;
  const hasSessions = (sessionCount || 0) > 0;
  const [showSessions, setShowSessions] = useState(false);
  const visibleSessions = sessionList.slice(0, 3);

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0 2px" }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onJoinClick?.(); }}
            aria-pressed={joined}
            aria-label={joined ? "Đã tham gia" : "Tham gia"}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <TypeIcon size={20} color={joinColor} />
            <span style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: joined ? C.text : C.textFaint }}>{fmtCompact(participants)}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCommentClick?.(); }}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            aria-label="Bình luận"
          >
            <IconCommentBubble />
            <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint }}>{fmtCompact(comments)}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onShareClick?.(); }}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            aria-label="Chia sẻ"
          >
            <IconShareArrow />
            <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint }}>{fmtCompact(shares)}</span>
          </button>
          {sessionCount !== null && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowSessions((v) => !v); }}
              title={`${sessionCount} phiên trình chiếu đã lưu`}
              aria-expanded={showSessions}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              aria-label="Lịch sử trình chiếu"
            >
              <Monitor size={19} color={hasSessions ? C.gold : C.textMuted} />
              <span style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: hasSessions ? 700 : 400, color: hasSessions ? C.gold : C.textFaint }}>{fmtCompact(sessionCount)}</span>
            </button>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onBookmarkClick?.(); }}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}
          aria-label={bookmarked ? "Bỏ đánh dấu" : "Đánh dấu"}
        >
          <IconBookmark filled={bookmarked} />
        </button>
      </div>

      {/* Drop frame — 3 phiên trình chiếu gần nhất, bấm icon Monitor để mở/đóng ngay tại chỗ */}
      {showSessions && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ marginTop: 6, padding: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 }}
        >
          {visibleSessions.length === 0 ? (
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, textAlign: "center", padding: "4px 0" }}>
              Chưa có phiên trình chiếu nào được lưu.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={(e) => { e.stopPropagation(); onOpenSession?.(s); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: onOpenSession ? "pointer" : "default" }}
                >
                  <Monitor size={13} color={C.gold} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 12.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.name}
                    </div>
                    <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint }}>
                      {timeAgo(s.endedAt)} trước · {s.meta}
                    </div>
                  </div>
                  {onOpenSession && <ChevronRight size={14} color={C.textFaint} style={{ flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          )}
          {sessionList.length > 3 && (
            <button
              onClick={(e) => { e.stopPropagation(); onSeeAllSessions?.(); }}
              style={{ marginTop: 8, width: "100%", background: "none", border: "none", padding: "6px 0 0", borderTop: `1px solid ${C.border}`, color: C.teal, fontFamily: bodyFont, fontWeight: 600, fontSize: 12, cursor: "pointer", textAlign: "center" }}
            >
              ... Xem thêm ({sessionList.length - 3})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Reusable share button with "copied" feedback. Copies a link to the clipboard.
function ShareButton({ link, label = "Chia sẻ" }) {
  const [copied, setCopied] = useState(false);
  const doShare = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard may be blocked in sandboxed previews; the UI feedback still confirms intent.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={doShare}
      style={{ background: "none", border: "none", color: copied ? C.teal : C.gold, cursor: "pointer", display: "flex", gap: 6, alignItems: "center", fontFamily: bodyFont, fontSize: 12, fontWeight: 600 }}
    >
      {copied ? <Check size={16} /> : <FbShareIcon size={16} color={C.gold} />} {copied ? "Đã sao chép!" : label}
    </button>
  );
}

// Nút hành động trên thanh tiêu đề của trang chi tiết Path/Survey/Exam — bố cục giống
// hệt Rankie: "Trình chiếu" (teal) + "Chia sẻ" (gold) mở share sheet đầy đủ.
function DetailHeaderActions({ item, onPresent, isOwner = false, participated = false, allowGuestPresent = false, onShareToProfile, contacts = [], onShared }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [lockMsg, setLockMsg] = useState(false);
  useEffect(() => {
    if (!lockMsg) return;
    const t = setTimeout(() => setLockMsg(false), 2800);
    return () => clearTimeout(t);
  }, [lockMsg]);
  const iconBtn = { background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10, padding: 0 };
  // Luôn hiện nút trình chiếu. Khoá (Monitor gạch chéo đỏ) kèm thông báo khi:
  //  - không phải chủ bài và chủ bài KHÔNG cho phép người khác trình chiếu, hoặc
  //  - được phép nhưng CHƯA hoàn thành bài lần nào.
  let lockReason = null;
  if (onPresent && !isOwner) {
    if (!allowGuestPresent) lockReason = "Chủ bài chưa cho phép người khác trình chiếu";
    else if (!participated) lockReason = "Hãy hoàn thành bài trước khi trình chiếu";
  }
  const locked = !!lockReason;
  return (
    <div style={{ position: "relative", display: "flex", gap: 4, alignItems: "center" }}>
      {onPresent && (
        <button
          onClick={locked ? () => setLockMsg(lockReason) : onPresent}
          title={lockReason || "Trình chiếu"}
          style={iconBtn}
        >
          {locked ? <MonitorOff size={20} color={C.coral} /> : <Monitor size={20} color={C.teal} />}
        </button>
      )}
      <button onClick={() => setShareOpen(true)} title="Chia sẻ" style={iconBtn}>
        <FbShareIcon size={19} color={C.gold} />
      </button>
      {lockMsg && (
        <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: C.surfaceRaised, border: `1px solid ${C.coral}`, borderRadius: 10, padding: "8px 12px", fontFamily: bodyFont, fontSize: 12, color: C.text, whiteSpace: "nowrap", boxShadow: "0 6px 20px rgba(0,0,0,0.4)", zIndex: 20 }}>
          {lockMsg}
        </div>
      )}
      {shareOpen && (
        <ShareModal item={item} onClose={() => setShareOpen(false)} onShareToProfile={onShareToProfile} contacts={contacts} onShared={onShared} />
      )}
    </div>
  );
}

// Facebook-style share sheet: write a caption, pick who can see the share, pick where
// it goes (only "Hồ sơ cá nhân" is functional today — Nhóm/Tin nhắn are placeholders
// for once groups/messaging exist), plus the existing copy-link and QR options.
function ShareModal({ item, onClose, onShareToProfile, contacts = [], onShared }) {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [destination, setDestination] = useState("profile");
  const [posted, setPosted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null); // for "message" destination
  const [msgSent, setMsgSent] = useState(false);

  const link = `https://rankev.app/vote/${item.id}`;
  const typeLabel = { rankie: "Rankie", path: "Path", deck: "Deck" }[item.type] || "";

  const visibilityOptions = [
    { id: "public", label: "Công khai", icon: Globe },
    { id: "unlisted", label: "Theo link", icon: Link2 },
    { id: "private", label: "Chỉ mình tôi", icon: Lock },
  ];

  const destinations = [
    { id: "profile", label: "Hồ sơ cá nhân", icon: User },
    { id: "message", label: "Tin nhắn", icon: MessageCircle },
  ];

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePost = () => {
    if (destination === "profile") {
      onShareToProfile({ item, caption, visibility });
      onShared?.();
      setPosted(true);
      setTimeout(onClose, 900);
    } else if (destination === "message" && selectedContact) {
      onShared?.();
      setMsgSent(true);
      setTimeout(onClose, 900);
    }
  };

  const canPost = destination === "profile" || (destination === "message" && selectedContact);

  const successMsg = destination === "profile"
    ? "Đã chia sẻ vào hồ sơ của bạn!"
    : `Đã gửi cho ${selectedContact?.author?.name}!`;

  return (
    <ModalShell title="Chia sẻ" onClose={onClose}>
      {posted || msgSent ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: 99, background: C.goldSoft, border: `1px solid ${C.gold}`, display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
            <Check size={26} color={C.gold} />
          </div>
          <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 14, color: C.text }}>{successMsg}</div>
        </div>
      ) : (
        <>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Nói gì đó về nội dung này..."
            rows={3}
            style={{
              width: "100%", padding: "11px 12px", borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.surfaceRaised,
              color: C.text, fontFamily: bodyFont, fontSize: 14,
              resize: "vertical", marginBottom: 12,
            }}
          />

          {/* Preview */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, background: C.surfaceRaised, marginBottom: 16 }}>
            <Pill tone="gold">{typeLabel}</Pill>
            <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 14.5, color: C.text, marginTop: 6 }}>{item.title}</div>
            {item.category && <div style={{ ...captionText, marginTop: 3 }}>{item.category}</div>}
          </div>

          {/* Destination tabs */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: C.textFaint, marginBottom: 8 }}>Chia sẻ đến</div>
            <div style={{ display: "flex", gap: 8 }}>
              {destinations.map((d) => {
                const Icon = d.icon;
                const active = destination === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => { setDestination(d.id); setSelectedContact(null); }}
                    style={{
                      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                      padding: "10px 6px", borderRadius: 10,
                      border: `1px solid ${active ? C.gold : C.border}`,
                      background: active ? C.goldSoft : C.surface,
                      color: active ? C.gold : C.textMuted,
                      cursor: "pointer", fontFamily: bodyFont, fontSize: 12, fontWeight: 600,
                    }}
                  >
                    <Icon size={16} />
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy — only shown for profile */}
          {destination === "profile" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: C.textFaint, marginBottom: 8 }}>Ai có thể xem</div>
              <div style={{ display: "flex", gap: 8 }}>
                {visibilityOptions.map((v) => {
                  const Icon = v.icon;
                  const active = visibility === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVisibility(v.id)}
                      style={{
                        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                        padding: "10px 6px", borderRadius: 10,
                        border: `1px solid ${active ? C.gold : C.border}`,
                        background: active ? C.goldSoft : C.surface,
                        color: active ? C.gold : C.textMuted,
                        cursor: "pointer", fontFamily: bodyFont, fontSize: 11.5, fontWeight: 600,
                      }}
                    >
                      <Icon size={16} />
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact picker — only shown for message */}
          {destination === "message" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: C.textFaint, marginBottom: 8 }}>Gửi cho</div>
              {contacts.length === 0 ? (
                <div style={{ ...captionText, textAlign: "center", padding: "12px 0" }}>Chưa có liên hệ nào</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                  {contacts.map((c) => {
                    const active = selectedContact?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedContact(active ? null : c)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "9px 12px", borderRadius: 10,
                          border: `1px solid ${active ? C.gold : C.border}`,
                          background: active ? C.goldSoft : C.surface,
                          cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                          background: c.author.avatarColor || C.goldSoft,
                          display: "grid", placeItems: "center", fontSize: 17,
                          border: `1.5px solid ${active ? C.gold : C.border}`,
                        }}>
                          {c.author.avatarEmoji}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14, color: active ? C.gold : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.author.name}
                          </div>
                          <div style={{ ...captionText, marginTop: 1 }}>{c.author.handle}</div>
                        </div>
                        {active && <Check size={15} color={C.gold} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handlePost}
            disabled={!canPost}
            style={{ ...primaryButton, width: "100%", padding: 13, borderRadius: 12, marginBottom: 18, opacity: canPost ? 1 : 0.45, cursor: canPost ? "pointer" : "default" }}
          >
            {destination === "message" ? "Gửi tin nhắn" : "Đăng"}
          </button>

          {/* Copy link + QR */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={copyLink}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  padding: 11, borderRadius: 10, border: `1px solid ${C.border}`,
                  background: C.surface, color: copied ? C.teal : C.text,
                  fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                {copied ? <Check size={15} /> : <Link2 size={15} />} {copied ? "Đã sao chép!" : "Sao chép liên kết"}
              </button>
              <button
                onClick={() => setShowQR((s) => !s)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  padding: 11, borderRadius: 10,
                  border: `1px solid ${showQR ? C.gold : C.border}`,
                  background: showQR ? C.goldSoft : C.surface,
                  color: showQR ? C.gold : C.text,
                  fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                <QrCode size={15} /> Mã QR
              </button>
            </div>
            {showQR && (
              <div style={{ marginTop: 12, padding: 14, background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 64, height: 64, background: "#fff", borderRadius: 8, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <QrCode size={44} color="#111" />
                </div>
                <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textMuted }}>
                  Quét mã để tham gia ngay.
                  <div style={{ fontFamily: monoFont, color: C.teal, marginTop: 5, fontSize: 11.5 }}>{link}</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ---------- HEAD TO HEAD VISUAL (signature element) ----------
// onVote(optionId, event), when given, makes each side clickable to vote directly —
// mirrors BarViz's click-to-vote behavior for the head-to-head chart type.
// Only ever compares the first two options: head-to-head is a 1v1 chart, so any
// extra options (which shouldn't exist here, but user-created rankies aren't
// validated for this) must not be allowed to skew the percentages.
function HeadToHead({ rankie, options, onVote, votedId, isClosed, tapCounts, activeTapId }) {
  const [a, b] = options;
  if (!a || !b) return null; // not enough data to render a 1v1 comparison
  const total = a.votes + b.votes || 1;
  const pctA = Math.round((a.votes / total) * 1000) / 10;
  const pctB = Math.round((100 - pctA) * 10) / 10;
  const leaderIsA = a.votes >= b.votes;
  const clickable = !!onVote && !isClosed;
  // Fallback colors in case this rankie was created without colorA/colorB set
  // (only the head-to-head chart needs them, so other creation paths may omit them).
  const colorA = rankie.colorA || a.color || C.teal;
  const colorB = rankie.colorB || b.color || C.coral;
  // Tapping the tug-of-war bar toggles its in-bar numbers between raw vote totals
  // and percentages — independent of voting itself, so this works even where
  // onVote isn't wired up (feed card, presenter).
  const [showPct, setShowPct] = useState(false);

  const side = (opt, align) => {
    const isMine = votedId === opt.id;
    const tapCount = tapCounts ? tapCounts[opt.id] || 0 : 0;
    const isActivelyTapping = activeTapId === opt.id;
    const Wrap = clickable ? "button" : "div";
    return (
      <Wrap
        onClick={clickable ? (e) => onVote(opt.id, e) : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexDirection: align === "right" ? "row-reverse" : "row",
          background: "none",
          border: "1px solid transparent",
          borderRadius: 12,
          padding: clickable ? "6px 8px" : 0,
          cursor: clickable ? "pointer" : "default",
          fontFamily: bodyFont,
        }}
      >
        <span style={{ fontSize: 22 }}>{opt.flag}</span>
        <div style={{ textAlign: align === "right" ? "right" : "left" }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 5, flexDirection: align === "right" ? "row-reverse" : "row" }}>
            {opt.label}
            {isMine && <VotedMarker voteMarker={rankie.voteMarker} />}
            {isActivelyTapping && (
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 99,
                  background: C.gold,
                  color: "#1A1305",
                  fontFamily: monoFont,
                  fontSize: 10,
                  fontWeight: 700,
                  transform: "scale(1.15)",
                  transition: "transform 0.1s ease",
                }}
              >
                {tapCount}
              </span>
            )}
            {!isActivelyTapping && tapCount > 0 && <VotedMarker voteMarker={rankie.voteMarker} />}
          </div>
        </div>
      </Wrap>
    );
  };

  return (
    <div style={{ padding: "4px 0 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        {side(a, "left")}
        {side(b, "right")}
      </div>

      {/* Tug-of-war bar — tap to toggle between raw vote counts and percentages */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setShowPct((v) => !v);
        }}
        title="Bấm để đổi giữa số vote và %"
        style={{
          position: "relative",
          height: 46,
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          border: `1px solid ${C.border}`,
          background: C.surface,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: `${pctA}%`,
            background: `linear-gradient(90deg, ${colorA}cc, ${colorA})`,
            transition: "width 0.6s cubic-bezier(.22,1,.36,1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 10,
          }}
        >
          {pctA > 14 && (
            <span style={{ fontFamily: monoFont, fontWeight: 700, color: "#0B1710", fontSize: 13 }}>
              {showPct ? `${pctA}%` : fmt(a.votes)}
            </span>
          )}
        </div>
        <div
          style={{
            width: `${pctB}%`,
            background: `linear-gradient(270deg, ${colorB}cc, ${colorB})`,
            transition: "width 0.6s cubic-bezier(.22,1,.36,1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingLeft: 10,
          }}
        >
          {pctB > 14 && (
            <span style={{ fontFamily: monoFont, fontWeight: 700, color: "#0B1710", fontSize: 13 }}>
              {showPct ? `${pctB}%` : fmt(b.votes)}
            </span>
          )}
        </div>
        {/* center divider marker */}
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(0,0,0,0.25)" }} />
      </div>

      {clickable && (
        <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, textAlign: "center", marginTop: 8 }}>
          {votedId ? "Bấm lại để hủy, hoặc chọn bên kia để đổi" : "Bấm vào một bên để bình chọn"}
        </div>
      )}
    </div>
  );
}

// onVote(optionId, event), when given, makes each row clickable to vote directly from
// the chart — used for "single" (locks after one tap) and "unlimited" (tap repeatedly)
// voting types. votedId marks the option the viewer already picked (single-choice only).
function BarViz({ options, onVote, votedId, isClosed, tapCounts, activeTapId, voteMarker }) {
  const total = options.reduce((s, o) => s + o.votes, 0) || 1;
  const sorted = [...options].sort((a, b) => b.votes - a.votes);
  const clickable = !!onVote && !isClosed;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
      {sorted.map((o, i) => {
        const pct = Math.round((o.votes / total) * 1000) / 10;
        const hasIllus = o.emoji || o.image;
        const isMine = votedId === o.id;
        const tapCount = tapCounts ? tapCounts[o.id] || 0 : 0;
        const isActivelyTapping = activeTapId === o.id;
        // Every row stays tappable — tapping your own pick again undoes it, tapping a
        // different one switches your vote (handled in castVote itself).
        const rowClickable = clickable;
        const Row = rowClickable ? "button" : "div";
        return (
          <Row
            key={o.id}
            onClick={rowClickable ? (e) => onVote(o.id, e) : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              background: "none",
              border: "none",
              padding: 0,
              textAlign: "left",
              cursor: rowClickable ? "pointer" : "default",
              borderRadius: 12,
            }}
          >
            {hasIllus && (
              <div style={{ position: "relative" }}>
                <Illustration emoji={o.emoji} image={o.image} size={42} radius={11} />
                {isActivelyTapping ? (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                      borderRadius: 99,
                      background: C.gold,
                      display: "grid",
                      placeItems: "center",
                      border: `2px solid ${C.surface}`,
                      fontFamily: monoFont,
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "#1A1305",
                      transform: "scale(1.15)",
                      transition: "transform 0.1s ease",
                    }}
                  >
                    {tapCount}
                  </span>
                ) : (
                  (isMine || tapCount > 0) && (
                    <span style={{ position: "absolute", bottom: -6, right: -6 }}>
                      <VotedMarker voteMarker={voteMarker} size={18} />
                    </span>
                  )
                )}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: C.text, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {`#${i + 1} `}
                  {o.label}
                  {!hasIllus && (isMine || tapCount > 0) && <VotedMarker voteMarker={voteMarker} />}
                </span>
                <span style={{ color: C.textMuted, fontFamily: monoFont }}>{pct}% · {fmt(o.votes)}</span>
              </div>
              <div style={{ height: 14, borderRadius: 7, background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: o.color || C.teal,
                    transition: "width 0.6s cubic-bezier(.22,1,.36,1)",
                    borderRadius: 7,
                  }}
                />
              </div>
            </div>
          </Row>
        );
      })}
      {clickable && (
        <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, textAlign: "center", marginTop: 2 }}>
          {votedId ? "Bấm lại để hủy, hoặc chọn phương án khác" : "Bấm vào một phương án để bình chọn"}
        </div>
      )}
    </div>
  );
}

function PieViz({ options }) {
  const data = options.map((o) => ({ name: o.label, value: o.votes, color: o.color }));
  const total = options.reduce((s, o) => s + o.votes, 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 130, height: 130, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={35} outerRadius={62} paddingAngle={2}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} stroke={C.bg} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: bodyFont, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {options.map((o) => {
          const pct = Math.round((o.votes / total) * 1000) / 10;
          return (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: o.color, flexShrink: 0 }} />
              <span style={{ color: C.text, flex: 1 }}>{o.label}</span>
              <span style={{ color: C.textMuted, fontFamily: monoFont }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Cumulative vote history chart (stock-chart style).
// X = real time from Rankie creation to now. Y = cumulative vote count per option.
// The past curve is synthesised (deterministically) from createdAt up to each option's
// current vote total, since the prototype has no server-side history. New votes extend the tail.
function LineViz({ options, colorFor, createdAt }) {
  // Deterministic pseudo-random so the historical curve is stable across re-renders
  const seededRand = (seed) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const created = createdAt || Date.now() - 1000 * 60 * 60 * 6; // fallback: 6h ago
  const now = Date.now();
  const spanMs = Math.max(now - created, 60 * 1000);

  // Build ~24 historical buckets from created → now.
  // Each option's cumulative count rises from 0 to its current votes with mild randomness,
  // shaped by an easing curve so it looks organic (fast/slow phases) rather than linear.
  const STEPS = 24;
  const baseHistory = [];
  for (let s = 0; s <= STEPS; s++) {
    const frac = s / STEPS;
    const point = { ts: created + spanMs * frac };
    options.forEach((o, oi) => {
      // Ease-in-out curve + small per-bucket jitter, clamped monotonic
      const ease = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) / 2;
      const jitter = 0.9 + 0.2 * seededRand((oi + 1) * 97.13 + s * 3.7);
      point[o.id] = Math.round(o.votes * ease * jitter);
    });
    baseHistory.push(point);
  }
  // Ensure the final synthetic point matches the real current totals
  options.forEach((o) => { baseHistory[STEPS][o.id] = o.votes; });
  // Enforce monotonic non-decreasing per option (cumulative can't go down)
  for (let s = 1; s <= STEPS; s++) {
    options.forEach((o) => {
      if (baseHistory[s][o.id] < baseHistory[s - 1][o.id]) baseHistory[s][o.id] = baseHistory[s - 1][o.id];
    });
  }

  // Live tail: append points as votes change after the chart mounts
  const [liveTail, setLiveTail] = useState([]);
  const prevTotalRef = useRef(options.reduce((s, o) => s + o.votes, 0));
  useEffect(() => {
    const total = options.reduce((s, o) => s + o.votes, 0);
    if (total !== prevTotalRef.current) {
      prevTotalRef.current = total;
      const point = { ts: Date.now() };
      options.forEach((o) => { point[o.id] = o.votes; });
      setLiveTail((prev) => [...prev, point].slice(-60));
    }
  }, [options]);

  const data = [...baseHistory, ...liveTail];

  const getColor = (o, i) => (colorFor ? colorFor(o, i) : o.color || C.teal);

  // Format X ticks: show date if span > ~2 days, else time
  const longSpan = spanMs > 1000 * 60 * 60 * 48;
  const fmtTs = (ts) => {
    const d = new Date(ts);
    return longSpan
      ? d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
      : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -4 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tick={{ fill: C.textFaint, fontFamily: monoFont, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: C.border }}
              tickFormatter={fmtTs}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: C.textFaint, fontFamily: monoFont, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: C.border }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
              width={44}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: bodyFont, fontSize: 12 }}
              labelFormatter={(v) => new Date(v).toLocaleString("vi-VN")}
              formatter={(val, key) => {
                const o = options.find((x) => x.id === key);
                return [`${fmt(val)} vote`, o ? o.label : key];
              }}
            />
            {options.map((o, i) => (
              <Line
                key={o.id}
                type="monotone"
                dataKey={o.id}
                name={o.label}
                stroke={getColor(o, i)}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with current cumulative totals */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8, justifyContent: "center" }}>
        {options.map((o, i) => (
          <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: bodyFont, fontSize: 11.5 }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: getColor(o, i) }} />
            <span style={{ color: C.textMuted }}>{o.label}</span>
            <span style={{ color: C.text, fontFamily: monoFont, fontWeight: 600 }}>{fmt(o.votes)}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 6, fontFamily: bodyFont, fontSize: 10.5, color: C.textFaint }}>
        Tổng lượt vote tích lũy từ khi tạo · {fmtTs(created)} → nay
      </div>
    </div>
  );
}

// ---------- RANKIE CARD (FEED) ----------
function RankieCard({ rankie, onOpen, onOpenAuthor, menuSlot, myVoteIds, hideCategory, hideResults = false, sessionCount = 0, sessionList = [], onSeeAllSessions, onOpenSession, onShare, bookmarked = false, onToggleBookmark, rankTier = 0, onSetRank, onVote, fanCount = 0 }) {
  const total = rankie.options.reduce((s, o) => s + o.votes, 0);
  const sorted = [...rankie.options].sort((a, b) => b.votes - a.votes);
  const closed = isRankieClosed(rankie);
  const remaining = !closed ? formatRemaining(rankie.closesAt) : null;
  // myVoteIds covers every option the viewer picked (multi-select can have several;
  // single/rating/unlimited normally reduce to one). mainVoteId below is the one
  // "representative" pick used to decide which row to swap into the 3rd slot — for
  // multi-select this is whichever of the viewer's picks currently ranks highest, so
  // the swap logic below doesn't need its own multi-value branch.
  const votedIds = myVoteIds || [];
  const mainVoteId =
    votedIds.length > 1
      ? sorted.find((o) => votedIds.includes(o.id))?.id ?? votedIds[0]
      : votedIds[0] ?? null;
  // If the viewer's own pick doesn't naturally make the top 3, swap it into the 3rd
  // slot (displacing whichever option was there) so they always see their pick without
  // ever showing more than 3 rows — its true rank (e.g. "#7") is shown instead of a
  // medal, so this never looks like it actually placed 3rd.
  const myVoteRank = mainVoteId ? sorted.findIndex((o) => o.id === mainVoteId) : -1; // 0-indexed
  const topN =
    myVoteRank >= 3
      ? [sorted[0], sorted[1], sorted[myVoteRank]]
      : sorted.slice(0, 3);
  const extraCount = Math.max(0, rankie.options.length - 3);
  // Vote trực tiếp trên feed: chỉ với Rankie 1-lựa-chọn, ≤4 phương án, không dùng ảnh,
  // và chưa đóng. Vote xong biểu đồ cập nhật tại chỗ (Twitter-poll style).
  const canVoteInline =
    !!onVote && !closed && rankie.votingType === "single" &&
    rankie.options.length <= 4 && rankie.options.every((o) => !o.image);
  const inlineVote = (id, e) => { e?.stopPropagation?.(); onVote?.(id, e); };

  return (
    <div
      onClick={() => onOpen(rankie.id)}
      style={{
        ...cardSurface,
        cursor: "pointer",
        animation: "popIn 0.3s ease",
        opacity: closed ? 0.75 : 1,
      }}
    >
      {(() => {
        const statusSlot = (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {remaining && (
                <Pill tone="muted">
                  <Clock size={11} /> {remaining}
                </Pill>
              )}
              {closed ? (
                <Pill tone="muted">
                  <Lock size={11} /> Đã kết thúc
                </Pill>
              ) : rankie.live ? (
                <Pill tone="live">
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: C.teal, display: "inline-block" }} /> LIVE
                </Pill>
              ) : null}
            </div>
            {rankie.votingType === "unlimited" && (
              <TapHintPill tone="gold" hint="Không giới hạn">🔥</TapHintPill>
            )}
          </>
        );
        return rankie.author ? (
          <AuthorRow author={rankie.author} onOpenAuthor={onOpenAuthor} rightSlot={<>{menuSlot}{statusSlot}</>} rankTier={rankTier} onSetRank={onSetRank} fanCount={fanCount} />
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>{statusSlot}</div>
          </div>
        );
      })()}
      {!hideCategory && (
        <div style={{ marginBottom: 10 }}>
          <Pill tone="muted">{rankie.category}</Pill>
        </div>
      )}
      <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 18, color: C.text, marginBottom: 12 }}>
        {rankie.title}
      </div>

      {/* Results lead the card — this is what viewers scan for first.
          Any rankie with exactly two options reads better as a head-to-head
          comparison, so it's prioritized here even if chartType wasn't
          explicitly set to "head_to_head" (e.g. rankies made via Tạo mới,
          which doesn't offer that option directly but still benefits from it). */}
      {hideResults ? (
        // Chưa tham gia: che kết quả (tránh lộ), vẫn giữ mọi thông tin khác của bài.
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 12, background: C.surfaceRaised, border: `1px solid ${C.border}`, marginBottom: 2 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.goldSoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Lock size={17} color={C.gold} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 13.5, color: C.text }}>{rankie.options.length} lựa chọn</div>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint }}>Bình chọn để xem kết quả</div>
          </div>
        </div>
      ) : (rankie.chartType === "head_to_head" || rankie.options.length === 2) ? (
        <HeadToHead rankie={rankie} options={rankie.options} votedId={mainVoteId} onVote={canVoteInline ? inlineVote : undefined} isClosed={closed} />
      ) : rankie.votingType === "rating" ? (
        (() => {
          // Rating options are stored star-count-first (id "5" = 5 stars, etc.) with a
          // vote count per tier — a weighted average score reads far better here than
          // a top-3 list of star tiers, since the "options" aren't really competing
          // choices, they're buckets of one continuous scale.
          const totalRatings = rankie.options.reduce((s, o) => s + o.votes, 0) || 1;
          const weightedSum = rankie.options.reduce((s, o) => s + Number(o.id) * o.votes, 0);
          const avg = Math.round((weightedSum / totalRatings) * 10) / 10;
          const maxStars = Math.max(...rankie.options.map((o) => Number(o.id)));
          const myStarOption = mainVoteId ? rankie.options.find((o) => o.id === mainVoteId) : null;
          return (
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 28, color: C.gold }}>⭐ {avg}</span>
                <span style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted }}>/ {maxStars} · {fmt(totalRatings)} lượt đánh giá</span>
              </div>
              <div style={{ height: 8, borderRadius: 5, background: C.surface, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(avg / maxStars) * 100}%`, background: C.gold, borderRadius: 5 }} />
              </div>
              {myStarOption && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted }}>
                  Bạn đã đánh giá: <span style={{ color: C.text, fontWeight: 600 }}>{myStarOption.label}</span>
                  <VotedMarker voteMarker={rankie.voteMarker} />
                </div>
              )}
            </div>
          );
        })()
      ) : canVoteInline ? (
        <div onClick={(e) => e.stopPropagation()}>
          <BarViz options={rankie.options} onVote={inlineVote} votedId={mainVoteId} isClosed={closed} voteMarker={rankie.voteMarker} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {topN.map((o, i) => {
            const pct = Math.round((o.votes / total) * 100);
            const isMine = votedIds.includes(o.id);
            const trueRank = sorted.findIndex((s) => s.id === o.id); // 0-indexed
            return (
              <div key={o.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: C.text, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {`#${trueRank + 1} `}
                    {o.label}
                    {isMine && <VotedMarker voteMarker={rankie.voteMarker} />}
                  </span>
                  <span style={{ color: i === 0 ? C.gold : C.textMuted, fontFamily: monoFont, fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 5, background: C.surface, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: o.color || (i === 0 ? C.gold : C.border),
                      borderRadius: 5,
                    }}
                  />
                </div>
              </div>
            );
          })}
          {extraCount > 0 && (
            <div style={captionText}>+{extraCount} phương án khác</div>
          )}
        </div>
      )}

      {/* Description comes after the results, and only takes a sliver of space */}
      {(rankie.caption || rankie.media) && (
        <div style={{ marginTop: 12 }}>
          <PostContent caption={rankie.caption} media={rankie.media} clampLines={1} mediaHeight={140} />
        </div>
      )}

      <EngagementBar
        type="rankie"
        joined={votedIds.length > 0}
        participants={rankie.participants}
        comments={rankie.comments.length}
        shares={rankie.shares || 0}
        sessionCount={sessionCount}
        sessionList={sessionList}
        onSeeAllSessions={onSeeAllSessions}
        onOpenSession={onOpenSession}
        bookmarked={bookmarked}
        onJoinClick={() => onOpen(rankie.id)}
        onCommentClick={() => onOpen(rankie.id)}
        onShareClick={() => onShare?.(rankie)}
        onBookmarkClick={() => onToggleBookmark?.(rankie)}
      />
    </div>
  );
}

// ---------- FEED VIEW ----------
function FeedView({ feedItems, votedMap, participatedKeys, participationByKey, pathUnlocks, sessionCounts, deckSessionCounts, pathSessionCounts, onBumpShares, presentationHistory, onOpenPresentationHistory, bookmarks, onToggleBookmark, onOpenRankie, onOpenPath, onOpenDeck, onOpenAuthor, onOpenSearch, onShareToProfile, activeCategory, setActiveCategory, typeFilter, setTypeFilter, contacts, rankTiers, onSetRank, liveOptions, onVoteInline, fanCounts, onOpenSession }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState(null); // rankie currently open in the share sheet
  const typeOptions = [
    { id: "all", label: "Tất cả" },
    { id: "rankie", label: "📊 Rankie" },
    { id: "path", label: "🌿 Path" },
    { id: "deck", label: "📋 Survey" },
    { id: "exam", label: "📝 Exam" },
  ];
  const currentLabel = typeOptions.find((t) => t.id === typeFilter)?.label || "Tất cả";

  // When the user leaves the trending tab, reset the content-type filter and close
  // the dropdown — the filter is irrelevant for specific-category browsing.
  useEffect(() => {
    if (activeCategory !== "Đang thịnh hành") {
      setTypeFilter("all");
      setFilterOpen(false);
    }
  }, [activeCategory, setTypeFilter]);

  return (
    <div>
      <div style={{ padding: "20px 16px 4px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: displayFont, fontStyle: "italic", fontSize: 30, color: C.text, lineHeight: 1 }}>
            Rankev
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint, marginTop: 4, letterSpacing: 0.4 }}>
            RANK EVERYTHING
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          {/* Content-type filter — only relevant on the trending tab where all types mix */}
          {activeCategory === "Đang thịnh hành" && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 99,
                background: typeFilter !== "all" ? C.goldSoft : C.surface,
                border: `1px solid ${typeFilter !== "all" ? C.gold : C.border}`,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                position: "relative",
              }}
              title={`Lọc: ${currentLabel}`}
            >
              <SlidersHorizontal size={17} color={typeFilter !== "all" ? C.gold : C.textMuted} />
              {typeFilter !== "all" && (
                <span style={{ position: "absolute", top: -2, right: -2, width: 9, height: 9, borderRadius: 99, background: C.gold, border: `2px solid ${C.bg}` }} />
              )}
            </button>

            {filterOpen && (
              <>
                {/* Invisible backdrop to close the dropdown on outside click */}
                <div onClick={() => setFilterOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
                <div
                  style={{
                    position: "absolute",
                    top: 44,
                    right: 0,
                    background: C.surfaceRaised,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: 6,
                    minWidth: 140,
                    zIndex: 21,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                  }}
                >
                  {typeOptions.map((t) => {
                    const selected = typeFilter === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTypeFilter(t.id);
                          setFilterOpen(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: selected ? C.goldSoft : "transparent",
                          color: selected ? C.gold : C.text,
                          fontFamily: bodyFont,
                          fontSize: 13,
                          fontWeight: selected ? 700 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {t.label}
                        {selected && <Check size={13} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          )}

          <button
            onClick={onOpenSearch}
            style={{ width: 38, height: 38, borderRadius: 99, background: C.surface, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", cursor: "pointer" }}
            title="Tìm kiếm"
          >
            <Search size={18} color={C.textMuted} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
        {feedItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.textFaint, fontFamily: bodyFont, fontSize: 13.5 }}>
            Chưa có bài đăng nào phù hợp
            {typeFilter !== "all" ? ` (${currentLabel})` : ""}
            {activeCategory !== "Đang thịnh hành" ? ` trong "${activeCategory}"` : ""}.
          </div>
        )}
        {feedItems.map((item) => (
          <div key={item.id}>
            <FeedSourceLabel source={feedSourceFor(item)} />
            {item.type === "path" ? (
              <PathCard path={item} onOpen={() => onOpenPath(item.id)} onOpenAuthor={onOpenAuthor} hideCategory rankTier={rankTiers?.[item.author?.id] || 0} onSetRank={onSetRank} fanCount={fanCounts?.[item.author?.id] || 0} onShare={setShareTarget} joined={participatedKeys?.has(`path:${item.id}`) || false} bookmarked={!!bookmarks?.[`path:${item.id}`]} onToggleBookmark={onToggleBookmark} myResult={participationByKey?.[`path:${item.id}`]} unlockedEndings={pathUnlocks?.[item.id] || []} sessionCount={pathSessionCounts?.[item.id] || 0} sessionList={presentationHistory?.filter(h => h.type === "path" && h.itemId === item.id) || []} onSeeAllSessions={onOpenPresentationHistory} onOpenSession={onOpenSession} />
            ) : item.type === "deck" ? (
              <DeckCard deck={item} onOpen={() => onOpenDeck(item.id)} onOpenAuthor={onOpenAuthor} hideCategory rankTier={rankTiers?.[item.author?.id] || 0} onSetRank={onSetRank} fanCount={fanCounts?.[item.author?.id] || 0} onShare={setShareTarget} joined={participatedKeys?.has(`deck:${item.id}`) || false} sessionCount={deckSessionCounts?.[item.id] || 0} bookmarked={!!bookmarks?.[`deck:${item.id}`]} onToggleBookmark={onToggleBookmark} myResult={participationByKey?.[`deck:${item.id}`]} sessionList={presentationHistory?.filter(h => h.type === "deck" && h.itemId === item.id) || []} onSeeAllSessions={onOpenPresentationHistory} onOpenSession={onOpenSession} />
            ) : (
              <RankieCard
                rankie={liveOptions?.[item.id] ? { ...item, options: liveOptions[item.id] } : item}
                onOpen={onOpenRankie}
                onVote={(id, e) => onVoteInline?.(item, id, e)}
                onOpenAuthor={onOpenAuthor}
                rankTier={rankTiers?.[item.author?.id] || 0}
                onSetRank={onSetRank}
                fanCount={fanCounts?.[item.author?.id] || 0}
                myVoteIds={votedIdsFor(votedMap?.[item.id])}
                sessionCount={sessionCounts?.[item.id] || 0}
                sessionList={presentationHistory?.filter(h => h.type === "rankie" && h.itemId === item.id) || []}
                onSeeAllSessions={onOpenPresentationHistory}
                onOpenSession={onOpenSession}
                hideCategory
                onShare={setShareTarget}
                bookmarked={!!bookmarks?.[`rankie:${item.id}`]}
                onToggleBookmark={onToggleBookmark}
              />
            )}
          </div>
        ))}
      </div>
      {shareTarget && (
        <ShareModal item={shareTarget} onClose={() => setShareTarget(null)} onShareToProfile={onShareToProfile} contacts={contacts ?? []} onShared={() => onBumpShares?.(shareTarget)} />
      )}
    </div>
  );
}

// ---------- SEARCH ----------
function SearchView({ allPosts, votedMap, participatedKeys, participationByKey, pathUnlocks, sessionCounts, deckSessionCounts, pathSessionCounts, onBumpShares, presentationHistory, onOpenPresentationHistory, bookmarks, onToggleBookmark, searchHistory, onAddHistory, onRemoveHistory, onOpenRankie, onOpenPath, onOpenDeck, onOpenAuthor, onShareToProfile, onBack, contacts }) {
  const [query, setQuery] = useState("");
  const [browseCategory, setBrowseCategory] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const q = normalizeVi(query.trim());

  const trendingTopics = [...allPosts]
    .filter((p) => !p.hidden && !p.deletedAt && p.visibility !== "private")
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .slice(0, 10);

  const categoryPosts = browseCategory
    ? allPosts
        .filter((p) => !p.hidden && !p.deletedAt && p.category === browseCategory)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    : [];

  const results = q.length > 0
    ? allPosts.filter((item) => {
        const haystack = normalizeVi(
          [item.title, item.subtitle, item.caption, item.category].filter(Boolean).join(" ")
        );
        return haystack.includes(q);
      })
    : [];

  const commitSearch = (term) => {
    const t = term.trim();
    if (!t) return;
    setQuery(t);
    setBrowseCategory(null);
    onAddHistory(t);
  };

  const renderCard = (item, hideCategory = false) =>
    item.type === "path" ? (
      <PathCard key={item.id} path={item} onOpen={() => onOpenPath(item.id)} onOpenAuthor={onOpenAuthor} hideCategory={hideCategory} onShare={setShareTarget} joined={participatedKeys?.has(`path:${item.id}`) || false} bookmarked={!!bookmarks?.[`path:${item.id}`]} onToggleBookmark={onToggleBookmark} myResult={participationByKey?.[`path:${item.id}`]} unlockedEndings={pathUnlocks?.[item.id] || []} sessionCount={pathSessionCounts?.[item.id] || 0} sessionList={presentationHistory?.filter(h => h.type === "path" && h.itemId === item.id) || []} onSeeAllSessions={onOpenPresentationHistory} onOpenSession={onOpenSession} />
    ) : item.type === "deck" ? (
      <DeckCard key={item.id} deck={item} onOpen={() => onOpenDeck(item.id)} onOpenAuthor={onOpenAuthor} hideCategory={hideCategory} onShare={setShareTarget} joined={participatedKeys?.has(`deck:${item.id}`) || false} sessionCount={deckSessionCounts?.[item.id] || 0} bookmarked={!!bookmarks?.[`deck:${item.id}`]} onToggleBookmark={onToggleBookmark} myResult={participationByKey?.[`deck:${item.id}`]} sessionList={presentationHistory?.filter(h => h.type === "deck" && h.itemId === item.id) || []} onSeeAllSessions={onOpenPresentationHistory} onOpenSession={onOpenSession} />
    ) : (
      <RankieCard
        key={item.id}
        rankie={item}
        onOpen={onOpenRankie}
        onOpenAuthor={onOpenAuthor}
        myVoteIds={votedIdsFor(votedMap?.[item.id])}
        sessionCount={sessionCounts?.[item.id] || 0}
        sessionList={presentationHistory?.filter(h => h.type === "rankie" && h.itemId === item.id) || []}
        onSeeAllSessions={onOpenPresentationHistory}
        hideCategory={hideCategory}
        onShare={setShareTarget}
        bookmarked={!!bookmarks?.[`rankie:${item.id}`]}
        onToggleBookmark={onToggleBookmark}
      />
    );

  const sectionLabel = (txt) => (
    <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>{txt}</div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
        <button
          onClick={() => { if (browseCategory) setBrowseCategory(null); else onBack(); }}
          style={{ ...iconButton, color: C.text, flexShrink: 0 }}
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px" }}>
          <Search size={16} color={C.textFaint} />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setBrowseCategory(null); }}
            onKeyDown={(e) => e.key === "Enter" && commitSearch(query)}
            placeholder="Tìm Rankie, chủ đề, tác giả..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontFamily: bodyFont, fontSize: 14 }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", display: "grid", placeItems: "center" }}>
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: 16 }}>

        {/* ── Browsing a category ── */}
        {browseCategory && q.length === 0 && (
          <div>
            {sectionLabel(`${CATEGORIES.find((c) => CATEGORY_NAMES[c.id] === browseCategory)?.label || browseCategory}`)}
            {categoryPosts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.textFaint, fontFamily: bodyFont, fontSize: 13.5 }}>
                Chưa có bài đăng nào trong danh mục này.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {categoryPosts.map((item) => renderCard(item, true))}
              </div>
            )}
          </div>
        )}

        {/* ── Search results ── */}
        {q.length > 0 && (
          <div>
            {results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: C.textFaint, fontFamily: bodyFont, fontSize: 13.5 }}>
                Không tìm thấy kết quả nào cho "{query}".
              </div>
            ) : (
              <div>
                <div style={{ ...captionText, marginBottom: 10 }}>{results.length} kết quả</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {results.map((item) => renderCard(item))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Discovery: lịch sử + trending + danh mục ── */}
        {q.length === 0 && !browseCategory && (
          <div>

            {/* 5 lịch sử tìm kiếm gần nhất */}
            {(searchHistory || []).length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  {sectionLabel("🕐 Tìm kiếm gần đây")}
                  <button
                    onClick={() => (searchHistory || []).forEach((s) => onRemoveHistory(s))}
                    style={{ background: "none", border: "none", color: C.textFaint, fontFamily: bodyFont, fontSize: 12, cursor: "pointer" }}
                  >
                    Xoá tất cả
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {(searchHistory || []).map((term) => (
                    <div
                      key={term}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px", borderBottom: `1px solid ${C.border}` }}
                    >
                      <button
                        onClick={() => commitSearch(term)}
                        style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", flex: 1, textAlign: "left" }}
                      >
                        <Search size={14} color={C.textFaint} />
                        <span style={{ fontFamily: bodyFont, fontSize: 14, color: C.text }}>{term}</span>
                      </button>
                      <button onClick={() => onRemoveHistory(term)} style={{ ...iconButton, color: C.textFaint }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top 10 trending topics */}
            {trendingTopics.length > 0 && (
              <div style={{ marginBottom: 28, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "12px 14px 4px" }}>
                  {sectionLabel("🔥 Đang thịnh hành")}
                </div>
                {trendingTopics.map((post, i) => (
                  <button
                    key={post.id}
                    onClick={() => commitSearch(post.title)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 14px",
                      borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <span style={{
                      fontFamily: monoFont,
                      fontWeight: 700,
                      fontSize: 13,
                      color: i === 0 ? "#E4634A" : i < 3 ? C.gold : C.textFaint,
                      width: 22,
                      textAlign: "right",
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {post.title}
                      </div>
                      <div style={{ ...captionText, marginTop: 2 }}>
                        {post.category} · {fmt(post.participants || 0)} lượt
                      </div>
                    </div>
                    {post.live && (
                      <Pill tone="live">
                        <span style={{ width: 5, height: 5, borderRadius: 99, background: C.teal, display: "inline-block" }} /> LIVE
                      </Pill>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Browse by category */}
            <div>
              {sectionLabel("📂 Khám phá theo chủ đề")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {CATEGORIES.filter((c) => c.id !== "trending").map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setBrowseCategory(CATEGORY_NAMES[cat.id])}
                    style={{
                      padding: "14px 12px",
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      color: C.text,
                      fontFamily: bodyFont,
                      fontWeight: 600,
                      fontSize: 13.5,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{cat.label.split(" ")[0]}</span>
                    {cat.label.split(" ").slice(1).join(" ")}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
      {shareTarget && (
        <ShareModal item={shareTarget} onClose={() => setShareTarget(null)} onShareToProfile={onShareToProfile} contacts={contacts ?? []} onShared={() => onBumpShares?.(shareTarget)} />
      )}
    </div>
  );
}

// ---------- COMMENTS (shared by Rankie & Path) ----------
// Bảng emoji hệ thống dùng cho ô bình luận (không cần asset).
const COMMENT_EMOJIS = ["😀","😂","🥰","😍","😎","🤔","😢","😡","👍","👎","🔥","🎉","❤️","💯","🙏","👏","🥳","😭","🤯","✨","⚽","🎮","🎯","🚀"];
const MOCK_IMG_COLORS = ["#3A4E6A","#5A3E4E","#2E5D4E","#5A4E2E","#4A2E5A"];
function mockImageColor() { return MOCK_IMG_COLORS[Math.floor(Math.random() * MOCK_IMG_COLORS.length)]; }
const iconGhost = { background: "none", border: "none", cursor: "pointer", padding: 4, display: "grid", placeItems: "center", borderRadius: 8 };

// Ô soạn bình luận/trả lời: text + emoji picker + đính ảnh (mô phỏng). `extra` là phần
// chọn phương án ủng hộ (chỉ dùng cho bình luận gốc).
function CommentComposer({ value, onChange, onSubmit, placeholder, image, setImage, extra, submitLabel = "Đăng", compact }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const canSend = value.trim() || image;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: compact ? 10 : 12 }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Viết bình luận của bạn..."}
        rows={compact ? 1 : 2}
        style={{ width: "100%", resize: "none", background: "transparent", border: "none", outline: "none", color: C.text, fontFamily: bodyFont, fontSize: 16 }}
      />
      {image && (
        <div style={{ marginTop: 6, display: "inline-block", position: "relative" }}>
          <div style={{ width: 54, height: 54, borderRadius: 8, background: image }} />
          <button onClick={() => setImage && setImage(null)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 999, background: C.bg, border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", display: "grid", placeItems: "center", fontSize: 10 }}>✕</button>
        </div>
      )}
      {extra}
      {showEmoji && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8, padding: 8, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
          {COMMENT_EMOJIS.map((e) => (
            <button key={e} onClick={() => onChange(value + e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 2 }}>{e}</button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setShowEmoji((v) => !v)} title="Biểu tượng cảm xúc" style={iconGhost}><Smile size={18} color={showEmoji ? C.gold : C.textMuted} /></button>
          {setImage && <button onClick={() => setImage(image ? null : mockImageColor())} title="Đính ảnh" style={iconGhost}><ImageIcon size={18} color={image ? C.gold : C.textMuted} /></button>}
        </div>
        <button onClick={onSubmit} disabled={!canSend} style={{ padding: "7px 16px", borderRadius: 9, border: "none", background: canSend ? C.gold : C.surfaceRaised, color: canSend ? "#1A1305" : C.textFaint, fontFamily: bodyFont, fontWeight: 700, fontSize: 12.5, cursor: canSend ? "pointer" : "not-allowed" }}>{submitLabel}</button>
      </div>
    </div>
  );
}

// Dropdown chọn phương án ủng hộ (đa chọn) — dùng khi Rankie có > 4 phương án.
function SupportDropdown({ options, selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const sel = options.filter((o) => selected.includes(o.id));
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontFamily: bodyFont, fontSize: 12.5, cursor: "pointer" }}>
        <span style={{ color: sel.length ? C.text : C.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sel.length ? sel.map((o) => o.label).join(", ") : "Chọn phương án ủng hộ (có thể chọn nhiều)"}
        </span>
        <ChevronDown size={16} color={C.textMuted} style={{ flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ marginTop: 6, maxHeight: 220, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface }}>
          {options.map((opt) => {
            const active = selected.includes(opt.id);
            return (
              <button key={opt.id} onClick={() => onToggle(opt.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: active ? `${opt.color || C.gold}18` : "transparent", border: "none", borderBottom: `1px solid ${C.border}`, color: C.text, fontFamily: bodyFont, fontSize: 12.5, cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${active ? (opt.color || C.gold) : C.border}`, background: active ? (opt.color || C.gold) : "transparent", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {active && <Check size={11} strokeWidth={3} color="#1A1305" />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Each comment is itself a mini-vote: rank up / rank down, and shows which option the author supports.
// getSupportLabel maps a comment's "supports" id to a display label + color (option or path result).
function CommentsSection({ initialComments, getSupportLabel, supportOptions, promptLabel, supportPrefix, placeholder, postId = null, ending = null }) {
  const norm = (s) => (Array.isArray(s) ? s : s == null ? [] : [s]);
  const apiMode = isUuid(postId); // bài THẬT → comment đọc/ghi qua backend
  const [comments, setComments] = useState(
    (initialComments || []).map((c) => ({ ...c, supports: norm(c.supports), myReaction: null, replies: c.replies || [] }))
  );
  const [sort, setSort] = useState("hot"); // hot = Phù hợp nhất, new = Mới nhất, all = Tất cả
  const [draft, setDraft] = useState("");
  const [draftSupport, setDraftSupport] = useState([]);
  const [draftImage, setDraftImage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyImage, setReplyImage] = useState(null);

  // Nạp comment THẬT cho bài API (lọc theo ending nếu là thảo luận theo kết quả Path).
  useEffect(() => {
    if (!apiMode) return;
    let alive = true;
    api.comments
      .list(postId, ending ? { ending } : {})
      .then((res) => { if (alive) setComments(((res && res.items) || res || []).map(apiCommentToProto)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [apiMode, postId, ending]);

  const toggleSupport = (id) =>
    setDraftSupport((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const react = (id, kind) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        let { rankUp, rankDown, myReaction } = c;
        if (myReaction === "up") rankUp--;
        if (myReaction === "down") rankDown--;
        const next = myReaction === kind ? null : kind;
        if (next === "up") rankUp++;
        if (next === "down") rankDown++;
        return { ...c, rankUp, rankDown, myReaction: next };
      })
    );
    // Bài THẬT: gửi rank lên backend (tự toggle nếu bấm lại) rồi đồng bộ số đếm chuẩn.
    if (apiMode && isUuid(id)) {
      api.comments
        .rank(id, kind)
        .then((res) =>
          setComments((prev) =>
            prev.map((c) => (c.id === id ? { ...c, rankUp: res.rankUp, rankDown: res.rankDown, myReaction: res.myRank === 1 ? "up" : res.myRank === -1 ? "down" : null } : c))
          )
        )
        .catch(() => {});
    }
  };

  const post = () => {
    if (!draft.trim() && !draftImage) return;
    if (apiMode) {
      const body = { text: draft.trim() || undefined, supports: draftSupport.length ? draftSupport : undefined };
      if (draftImage && /^https?:/.test(draftImage)) body.imageUrl = draftImage;
      api.comments
        .create(postId, body)
        .then((c) => setComments((prev) => [apiCommentToProto(c), ...prev]))
        .catch(() => {});
    } else {
      setComments((prev) => [
        { id: "c" + Date.now(), user: "Bạn", text: draft.trim(), image: draftImage, rankUp: 0, rankDown: 0, supports: draftSupport, createdAt: Date.now(), myReaction: null, replies: [] },
        ...prev,
      ]);
    }
    setDraft(""); setDraftSupport([]); setDraftImage(null);
  };

  const postReply = (cid) => {
    if (!replyDraft.trim() && !replyImage) return;
    if (apiMode && isUuid(cid)) {
      api.comments
        .create(postId, { text: replyDraft.trim() || undefined, parentId: cid })
        .then((c) =>
          setComments((prev) => prev.map((x) => (x.id === cid ? { ...x, replies: [...(x.replies || []), { id: c.id, user: (c.author && (c.author.name || c.author.handle)) || "Bạn", text: c.text || "", createdAt: Date.parse(c.createdAt) || Date.now() }] } : x)))
        )
        .catch(() => {});
    } else {
      setComments((prev) => prev.map((c) => (c.id === cid ? { ...c, replies: [...(c.replies || []), { id: "r" + Date.now(), user: "Bạn", text: replyDraft.trim(), image: replyImage, createdAt: Date.now() }] } : c)));
    }
    setReplyTo(null); setReplyDraft(""); setReplyImage(null);
  };

  const sorted = [...comments].sort((a, b) =>
    sort === "hot" ? (b.rankUp + b.rankDown) - (a.rankUp + a.rankDown)
    : sort === "new" ? (b.createdAt || 0) - (a.createdAt || 0)
    : (a.createdAt || 0) - (b.createdAt || 0) // "Tất cả" = theo thứ tự thời gian
  );

  const tab = (id, txt) => (
    <button
      onClick={() => setSort(id)}
      style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${sort === id ? C.gold : C.border}`, background: sort === id ? C.goldSoft : "transparent", color: sort === id ? C.gold : C.textMuted, fontFamily: bodyFont, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
    >
      {txt}
    </button>
  );

  const supportPicker = supportOptions && supportOptions.length > 0 && (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, marginBottom: 6 }}>
        {promptLabel || "Bạn ủng hộ phương án nào? (chọn nhiều, để trống là trung lập)"}
      </div>
      {supportOptions.length > 4 ? (
        <SupportDropdown options={supportOptions} selected={draftSupport} onToggle={toggleSupport} />
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {supportOptions.map((opt) => {
            const active = draftSupport.includes(opt.id);
            return (
              <button key={opt.id} onClick={() => toggleSupport(opt.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 999, border: `1px solid ${active ? (opt.color || C.gold) : C.border}`, background: active ? `${opt.color || C.gold}22` : "transparent", color: active ? (opt.color || C.gold) : C.textMuted, fontFamily: bodyFont, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                {active && <Check size={11} strokeWidth={3} />}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Bộ lọc kiểu Facebook — bỏ chữ "Bình luận" */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {tab("hot", "Phù hợp nhất")}
        {tab("new", "Mới nhất")}
        {tab("all", "Tất cả")}
      </div>

      {/* Composer bình luận gốc */}
      <div style={{ marginBottom: 14 }}>
        <CommentComposer value={draft} onChange={setDraft} onSubmit={post} placeholder={placeholder} image={draftImage} setImage={setDraftImage} extra={supportPicker} />
      </div>

      {/* Danh sách bình luận */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.length === 0 && (
          <div style={{ color: C.textFaint, fontFamily: bodyFont, fontSize: 13 }}>Chưa có bình luận nào. Hãy là người đầu tiên!</div>
        )}
        {sorted.map((c) => {
          const supportIds = norm(c.supports);
          const supportLabels = getSupportLabel ? supportIds.map((id) => getSupportLabel(id)).filter(Boolean) : [];
          return (
            <div key={c.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, display: "flex", gap: 10 }}>
              {/* Rank up/down rail */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <button onClick={() => react(c.id, "up")} title="Rank up" style={{ background: "none", border: "none", cursor: "pointer", color: c.myReaction === "up" ? C.teal : C.textFaint, padding: 2, display: "grid", placeItems: "center" }}>
                  <ChevronsUp size={20} strokeWidth={2.5} />
                </button>
                <span style={{ fontFamily: monoFont, fontSize: 11, fontWeight: 700, color: c.rankUp - c.rankDown >= 0 ? C.teal : C.coral }}>{fmt(c.rankUp - c.rankDown)}</span>
                <button onClick={() => react(c.id, "down")} title="Rank down" style={{ background: "none", border: "none", cursor: "pointer", color: c.myReaction === "down" ? C.coral : C.textFaint, padding: 2, display: "grid", placeItems: "center" }}>
                  <ChevronsDown size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ color: C.text, fontWeight: 700, fontFamily: bodyFont, fontSize: 13, marginRight: 2 }}>{c.user}</span>
                  {supportLabels.length > 0 && (
                    <>
                      <span style={{ color: C.textFaint, fontFamily: bodyFont, fontSize: 10.5 }}>{supportPrefix || "ủng hộ:"}</span>
                      {supportLabels.map((sp, idx) => (
                        <span key={idx} style={{ fontFamily: bodyFont, fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: `${sp.color || C.gold}22`, color: sp.color || C.gold }}>{sp.label}</span>
                      ))}
                    </>
                  )}
                  <span style={{ color: C.textFaint, fontFamily: bodyFont, fontSize: 11 }}>· {timeAgo(c.createdAt)}</span>
                </div>
                {c.text && <div style={{ color: C.textMuted, fontFamily: bodyFont, fontSize: 13, lineHeight: 1.4, wordBreak: "break-word" }}>{c.text}</div>}
                {c.image && <div style={{ marginTop: 6, width: 120, height: 120, borderRadius: 10, background: c.image }} />}
                <div style={{ marginTop: 6, display: "flex", gap: 14, alignItems: "center" }}>
                  <button onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyDraft(""); setReplyImage(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: replyTo === c.id ? C.gold : C.textMuted }}>Trả lời</button>
                  <span style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint }}>{fmt(c.rankUp)} rank up · {fmt(c.rankDown)} rank down</span>
                </div>

                {/* Replies */}
                {(c.replies && c.replies.length > 0) && (
                  <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: `2px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                    {c.replies.map((r) => (
                      <div key={r.id}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                          <span style={{ color: C.text, fontWeight: 700, fontFamily: bodyFont, fontSize: 12.5 }}>{r.user}</span>
                          <span style={{ color: C.textFaint, fontFamily: bodyFont, fontSize: 10.5 }}>· {timeAgo(r.createdAt)}</span>
                        </div>
                        {r.text && <div style={{ color: C.textMuted, fontFamily: bodyFont, fontSize: 12.5, lineHeight: 1.4, wordBreak: "break-word" }}>{r.text}</div>}
                        {r.image && <div style={{ marginTop: 4, width: 96, height: 96, borderRadius: 8, background: r.image }} />}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply composer */}
                {replyTo === c.id && (
                  <div style={{ marginTop: 8 }}>
                    <CommentComposer value={replyDraft} onChange={setReplyDraft} onSubmit={() => postReply(c.id)} placeholder={`Trả lời ${c.user}...`} image={replyImage} setImage={setReplyImage} submitLabel="Gửi" compact />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Icon nhỏ cho từng dạng biểu đồ (thay chữ Cột/Tròn/Thời gian/Đối đầu).
function ChartTypeIcon({ id, size = 16, color = "currentColor" }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (id === "bar")
    return (<svg {...common}><line x1="6" y1="20" x2="6" y2="12" /><line x1="12" y1="20" x2="12" y2="5" /><line x1="18" y1="20" x2="18" y2="14" /></svg>);
  if (id === "pie")
    return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 12 L12 3" /><path d="M12 12 L20 15" /></svg>);
  if (id === "line")
    return (<svg {...common}><polyline points="3,17 9,11 13,14 21,6" /></svg>);
  // head_to_head
  return (<svg {...common}><polyline points="9,5 4,12 9,19" /><polyline points="15,5 20,12 15,19" /></svg>);
}

// Phần bình luận bị khóa (blur) hiển thị khi người xem CHƯA tham gia Path/Survey/Exam.
// Hiện mờ phía sau + lớp phủ nhắc tham gia; không mở được cho tới khi hoàn thành bài.
function LockedCommentsNotice() {
  return (
    <div style={{ position: "relative", marginTop: 24, textAlign: "left" }}>
      <div style={{ filter: "blur(5px)", opacity: 0.5, pointerEvents: "none", userSelect: "none" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <div style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${C.gold}`, color: C.gold, fontSize: 12, fontFamily: bodyFont, fontWeight: 600 }}>Phù hợp nhất</div>
          <div style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12, fontFamily: bodyFont }}>Mới nhất</div>
        </div>
        {[0, 1].map((i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ height: 10, width: "40%", background: C.surfaceRaised, borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 10, width: "92%", background: C.surfaceRaised, borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: 10, width: "70%", background: C.surfaceRaised, borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center", padding: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: C.surfaceRaised, border: `1px solid ${C.border}`, display: "grid", placeItems: "center" }}>
          <Lock size={20} color={C.textMuted} />
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 13.5, fontWeight: 700, color: C.text }}>Tham gia để xem bình luận</div>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint }}>Hoàn thành bài để mở phần bình luận &amp; trình chiếu</div>
      </div>
    </div>
  );
}

// Trang Series: danh sách tất cả chapter, chỉnh sửa tên/thứ tự (kèm cảnh báo).
function SeriesView({ series, allSeries, onOpenPost, onBack, onRename, onReorder, onRemove }) {
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState(series?.name || "");
  const [dragIdx, setDragIdx] = useState(null);
  const [reorderWarn, setReorderWarn] = useState(false);
  const posts = series?.posts || [];
  if (!series) return null;

  const typeLabel = (p) => p.type === "rankie" ? "Rankie" : p.type === "path" ? "Path" : p.deckMode === "exam" ? "Exam" : "Survey";
  const typeColor = (p) => p.type === "rankie" ? C.gold : p.type === "path" ? C.teal : p.deckMode === "exam" ? C.coral : "#8B7FD1";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
        <button onClick={onBack} style={{ ...iconButton, color: C.text }}><ChevronLeft size={20} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editName ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontFamily: bodyFont, fontSize: 14, outline: "none" }} autoFocus />
              <button onClick={() => { onRename?.(series.id, nameInput); setEditName(false); }} style={{ padding: "6px 12px", borderRadius: 8, background: C.gold, border: "none", color: "#1A1305", fontFamily: bodyFont, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Lưu</button>
            </div>
          ) : (
            <button onClick={() => { setNameInput(series.name); setEditName(true); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
              <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 15, color: C.text }}>{series.name}</span>
              <Edit3 size={13} color={C.textFaint} />
            </button>
          )}
        </div>
        <Pill tone="muted">{posts.length} chapter</Pill>
      </div>

      {reorderWarn && (
        <div style={{ margin: "12px 16px 0", padding: 12, background: `${C.coral}18`, border: `1px solid ${C.coral}`, borderRadius: 12, fontFamily: bodyFont, fontSize: 12.5, color: C.text }}>
          ⚠️ Thay đổi thứ tự có thể gây nhầm lẫn cho người đang đọc dở.
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => setReorderWarn(false)} style={{ flex: 1, padding: "7px", borderRadius: 8, background: C.coral, border: "none", color: "#fff", fontFamily: bodyFont, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Vẫn tiếp tục</button>
            <button onClick={() => { setReorderWarn(false); onReorder?.(series.id, posts.map((p) => p.id)); }} style={{ flex: 1, padding: "7px", borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted, fontFamily: bodyFont, fontSize: 12, cursor: "pointer" }}>Huỷ</button>
          </div>
        </div>
      )}

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {posts.map((p, idx) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 12px" }}>
            <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 13, color: C.textFaint, flexShrink: 0, width: 24, textAlign: "center" }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, color: C.text, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: typeColor(p), background: `${typeColor(p)}18`, padding: "2px 7px", borderRadius: 999 }}>{typeLabel(p)}</span>
                <span style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint }}>{timeAgo(p.createdAt)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <button onClick={() => onOpenPost?.(p)} style={{ ...iconButton, color: C.teal }}><Eye size={16} /></button>
              <button onClick={() => onRemove?.(series.id, p.id)} style={{ ...iconButton, color: C.textFaint }}><X size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pill navigator ẩn — hiện 2 giây sau khi vuốt chapter rồi mờ dần.
// Vị trí chapter trong series — không còn vuốt, chỉ dùng để hiện chip + biết chapter
// hiện tại đang ở đâu trong danh sách.
function useChapterNav({ post, allSeries }) {
  const series = post?.seriesId ? allSeries?.[post.seriesId] : null;
  const chapterIdx = series ? series.posts.findIndex((p) => p.id === post?.id) : -1;
  return { series, chapterIdx };
}

// Chip nhỏ cố định góc dưới-phải — vùng ít nội dung nhất trên màn hình chi tiết nên
// không che tiêu đề/nội dung khi cuộn. Luôn bấm được, mở ChapterSwitcher.
function ChapterQuickAccess({ current, total, onOpen }) {
  return (
    <button onClick={onOpen} style={{ position: "fixed", bottom: 18, right: 14, zIndex: 12, display: "flex", alignItems: "center", gap: 5, background: "rgba(18,14,7,0.82)", border: `1px solid ${C.border}`, borderRadius: 999, padding: "7px 12px 7px 10px", cursor: "pointer", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }}>
      <Layers size={12} color={C.gold} />
      <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 11.5, color: C.text }}>Ch.{current}/{total}</span>
    </button>
  );
}

// Bộ chuyển chapter kiểu "đa nhiệm" điện thoại — overlay toàn màn hình, thẻ preview
// cuộn ngang scroll-snap giống app switcher iOS. Chỉ để LƯỚT XEM + NHẢY THẲNG; đổi
// tên/xoá/sắp xếp lại vẫn nằm ở SeriesView (mở qua nút quản lý góc phải).
function ChapterSwitcher({ series, currentIdx, participatedKeys, resultData, onSelect, onManage, onClose }) {
  const { liveOptions, votedMap, participationByKey } = resultData || {};
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    const card = el?.children?.[currentIdx];
    card?.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
  }, [currentIdx]);

  // Mọi chapter render card feed thật (đầy đủ thông tin: tác giả, tiêu đề, mô tả,
  // ảnh, engagement...). Chapter chưa tham gia chỉ ẩn phần KẾT QUẢ để tránh lộ:
  // Deck/Path tự ẩn khi joined=false; Rankie dùng hideResults (vốn luôn phô biểu đồ).
  const isJoined = (p) => {
    if (p.type === "rankie") return votedIdsFor(votedMap?.[p.id]).length > 0;
    const key = p.type === "path" ? `path:${p.id}` : `deck:${p.id}`;
    return !!participatedKeys?.has(key);
  };
  const renderCard = (p) => {
    const joined = isJoined(p);
    if (p.type === "rankie") {
      const rankie = liveOptions?.[p.id] ? { ...p, options: liveOptions[p.id] } : p;
      return <RankieCard rankie={rankie} onOpen={() => onSelect(p)} hideCategory hideResults={!joined} myVoteIds={votedIdsFor(votedMap?.[p.id])} />;
    }
    if (p.type === "path") return <PathCard path={p} onOpen={() => onSelect(p)} hideCategory joined={joined} myResult={joined ? participationByKey?.[`path:${p.id}`] : undefined} />;
    return <DeckCard deck={p} onOpen={() => onSelect(p)} hideCategory joined={joined} myResult={joined ? participationByKey?.[`deck:${p.id}`] : undefined} />;
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(8,6,3,0.96)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 12px 8px" }}>
          <button onClick={onClose} style={{ ...iconButton, color: C.text }}><X size={20} /></button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 15, color: C.text }}>{series.name}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, marginTop: 2 }}>Chapter {currentIdx + 1} / {series.posts.length}</div>
          </div>
          <button onClick={onManage} title="Quản lý chapter" style={{ ...iconButton, color: C.textFaint }}><Edit3 size={17} /></button>
        </div>

        <div
          ref={scrollRef}
          style={{ flex: 1, display: "flex", alignItems: "stretch", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory", padding: "4px 3vw 16px", WebkitOverflowScrolling: "touch" }}
        >
          {series.posts.map((p, idx) => {
            const isCurrent = idx === currentIdx;
            return (
              <div
                key={p.id}
                style={{
                  scrollSnapAlign: "center", flexShrink: 0, width: "94vw", maxWidth: 420,
                  display: "flex", flexDirection: "column",
                }}
              >
                <div style={{ padding: "2px 4px 8px" }}>
                  <span style={{ fontFamily: monoFont, fontWeight: 800, fontSize: 13, color: isCurrent ? C.gold : C.textFaint }}>Chapter {String(idx + 1).padStart(2, "0")}</span>
                </div>
                <div className="chSwitchCard" style={{ flex: 1, overflowY: "auto", paddingBottom: 6, borderRadius: 18, boxShadow: isCurrent ? `0 0 0 2px ${C.gold}, 0 10px 32px ${C.gold}2E` : "none", transition: "box-shadow 0.15s" }}>
                  {renderCard(p)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RankieDetailWithSwipe({ selected, allSeries, navigateChapter, participatedKeys, resultData, onOpenSeries, children }) {
  const { series, chapterIdx } = useChapterNav({ post: selected, allSeries });
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [skipToast, setSkipToast] = useState(null);
  useEffect(() => {
    if (!skipToast) return;
    const t = setTimeout(() => setSkipToast(null), 2500);
    return () => clearTimeout(t);
  }, [skipToast]);
  const selectChapter = (p) => {
    setSwitcherOpen(false);
    const key = p.type === "rankie" ? `rankie:${p.id}` : p.type === "path" ? `path:${p.id}` : `deck:${p.id}`;
    if (participatedKeys && !participatedKeys.has(key)) setSkipToast({ title: p.title });
    navigateChapter?.(p);
  };
  return (
    <>
      {series && <ChapterQuickAccess current={chapterIdx + 1} total={series.posts.length} onOpen={() => setSwitcherOpen(true)} />}
      {skipToast && (
        <div style={{ position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "rgba(18,14,7,0.90)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "9px 16px", fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted, whiteSpace: "nowrap", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
          Bạn chưa tham gia chapter này
        </div>
      )}
      {switcherOpen && series && (
        <ChapterSwitcher
          series={series}
          currentIdx={chapterIdx}
          participatedKeys={participatedKeys}
          resultData={resultData}
          onSelect={selectChapter}
          onManage={() => { setSwitcherOpen(false); onOpenSeries?.(series.id); }}
          onClose={() => setSwitcherOpen(false)}
        />
      )}
      {children}
    </>
  );
}
function PathDetailWithSwipe({ selectedPath, allSeries, navigateChapter, participatedKeys, resultData, onOpenSeries, children }) {
  const { series, chapterIdx } = useChapterNav({ post: selectedPath, allSeries });
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [skipToast, setSkipToast] = useState(null);
  useEffect(() => {
    if (!skipToast) return;
    const t = setTimeout(() => setSkipToast(null), 2500);
    return () => clearTimeout(t);
  }, [skipToast]);
  const selectChapter = (p) => {
    setSwitcherOpen(false);
    const key = p.type === "rankie" ? `rankie:${p.id}` : p.type === "path" ? `path:${p.id}` : `deck:${p.id}`;
    if (participatedKeys && !participatedKeys.has(key)) setSkipToast({ title: p.title });
    navigateChapter?.(p);
  };
  return (
    <>
      {series && <ChapterQuickAccess current={chapterIdx + 1} total={series.posts.length} onOpen={() => setSwitcherOpen(true)} />}
      {skipToast && (
        <div style={{ position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "rgba(18,14,7,0.90)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "9px 16px", fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted, whiteSpace: "nowrap", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
          Bạn chưa tham gia chapter này
        </div>
      )}
      {switcherOpen && series && (
        <ChapterSwitcher
          series={series}
          currentIdx={chapterIdx}
          participatedKeys={participatedKeys}
          resultData={resultData}
          onSelect={selectChapter}
          onManage={() => { setSwitcherOpen(false); onOpenSeries?.(series.id); }}
          onClose={() => setSwitcherOpen(false)}
        />
      )}
      {children}
    </>
  );
}
function DeckDetailWithSwipe({ selectedDeck, allSeries, navigateChapter, participatedKeys, resultData, onOpenSeries, children }) {
  const { series, chapterIdx } = useChapterNav({ post: selectedDeck, allSeries });
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [skipToast, setSkipToast] = useState(null);
  useEffect(() => {
    if (!skipToast) return;
    const t = setTimeout(() => setSkipToast(null), 2500);
    return () => clearTimeout(t);
  }, [skipToast]);
  const selectChapter = (p) => {
    setSwitcherOpen(false);
    const key = p.type === "rankie" ? `rankie:${p.id}` : p.type === "path" ? `path:${p.id}` : `deck:${p.id}`;
    if (participatedKeys && !participatedKeys.has(key)) setSkipToast({ title: p.title });
    navigateChapter?.(p);
  };
  return (
    <>
      {series && <ChapterQuickAccess current={chapterIdx + 1} total={series.posts.length} onOpen={() => setSwitcherOpen(true)} />}
      {skipToast && (
        <div style={{ position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "rgba(18,14,7,0.90)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "9px 16px", fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted, whiteSpace: "nowrap", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
          Bạn chưa tham gia chapter này
        </div>
      )}
      {switcherOpen && series && (
        <ChapterSwitcher
          series={series}
          currentIdx={chapterIdx}
          participatedKeys={participatedKeys}
          resultData={resultData}
          onSelect={selectChapter}
          onManage={() => { setSwitcherOpen(false); onOpenSeries?.(series.id); }}
          onClose={() => setSwitcherOpen(false)}
        />
      )}
      {children}
    </>
  );
}

// ---------- RANKIE DETAIL VIEW ----------
function RankieDetailView({ rankie, options, setOptions, voted, setVoted, onBack, onPresent, sessions, onParticipate, onShareToProfile, contacts, onOpenSession }) {
  const isUnlimited = rankie.votingType === "unlimited";
  const isClosed = isRankieClosed(rankie);
  const [shareOpen, setShareOpen] = useState(false);
  // Any rankie with exactly two options reads best as a head-to-head comparison —
  // default to that chart on open even if chartType wasn't explicitly set to it
  // (mirrors the same prioritization used for the feed card).
  const [activeChart, setActiveChart] = useState(
    options.length === 2 ? "head_to_head" : rankie.chartType
  );
  // Pre-submit local selections for multi-select / rating voting types
  const [multiSelected, setMultiSelected] = useState([]);
  const [ratingSelected, setRatingSelected] = useState(0);
  // For "unlimited" (spam) voting: which result metric to display
  const [resultMetric, setResultMetric] = useState("votes"); // "votes" (kể cả spam) | "voters" (chỉ user đã vote)
  // Nhãn tên loại biểu đồ nháy lên khi đổi rồi mờ dần.
  const [chartFlash, setChartFlash] = useState(null);
  const [presentLockMsg, setPresentLockMsg] = useState(false);
  useEffect(() => {
    if (!presentLockMsg) return;
    const t = setTimeout(() => setPresentLockMsg(false), 2800);
    return () => clearTimeout(t);
  }, [presentLockMsg]);
  useEffect(() => {
    if (!chartFlash) return;
    const id = setTimeout(() => setChartFlash(null), 1400);
    return () => clearTimeout(id);
  }, [chartFlash]);
  const total = options.reduce((s, o) => s + o.votes, 0);

  // Floating vote-reaction bubbles (own vote + simulated other viewers), Facebook-Live-style.
  // resultsAreaRef wraps the results/vote area so bubbles float within that region only.
  const resultsAreaRef = useRef(null);
  const [bubbles, setBubbles] = useState([]);
  const bubbleSeq = useRef(0);

  const spawnBubble = (opt, originEl) => {
    if (!opt) return;
    const containerEl = resultsAreaRef.current;
    let left = 20 + Math.random() * 60; // fallback: roughly centered, slight randomness
    if (containerEl && originEl) {
      const cRect = containerEl.getBoundingClientRect();
      const oRect = originEl.getBoundingClientRect();
      left = oRect.left - cRect.left + oRect.width / 2 - 17; // center the 34px bubble on the origin
      left = Math.max(4, Math.min(left, cRect.width - 38));
    }
    const id = ++bubbleSeq.current;
    const bubble = {
      id,
      emoji: opt.emoji || opt.flag,
      image: opt.image,
      avatarColor: opt.color || C.surfaceRaised,
      left,
      bottom: 4,
      drift1: Math.round((Math.random() - 0.5) * 30),
      drift2: Math.round((Math.random() - 0.5) * 70),
      duration: 1.8 + Math.random() * 0.8,
    };
    setBubbles((prev) => [...prev, bubble]);
    setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), bubble.duration * 1000 + 100);
  };

  // Simulated "other viewers" voting live: each tick from useLiveTicker also pops a
  // bubble for whichever option it bumped, floating up from a randomized spot along the
  // bottom of the results card — so the session feels alive even without the viewer tapping.
  // optionsRef always holds the latest options without making handleLiveTick change every
  // render (which would otherwise restart useLiveTicker's interval on every vote).
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const handleLiveTick = useCallback((idx) => {
    const opt = optionsRef.current[idx];
    if (opt) spawnBubble(opt, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Bài THẬT (_api): không giả lập vote ngẫu nhiên — số phiếu chỉ đến từ backend + WebSocket.
  useLiveTicker(setOptions, !isClosed, rankie.live && !rankie._api, isUnlimited, handleLiveTick);

  // Which chart types the viewer can switch between for this rankie.
  // Head-to-head is offered only when there are exactly 2 options.
  const chartTypes = [
    ...(options.length === 2 ? [{ id: "head_to_head", label: "Đối đầu" }] : []),
    { id: "bar", label: "Cột" },
    { id: "pie", label: "Tròn" },
    { id: "line", label: "Theo thời gian" },
  ];

  const castVote = (optId, e) => {
    if (isClosed) return;
    if (voted === optId) {
      // Tapping the option you already picked again undoes the vote.
      setVoted(null);
      setOptions((prev) => prev.map((o) => (o.id === optId ? { ...o, votes: Math.max(0, o.votes - 1) } : o)));
      return;
    }
    const previousVote = voted;
    setVoted(optId);
    setOptions((prev) =>
      prev.map((o) => {
        if (o.id === optId) return { ...o, votes: o.votes + 1 };
        if (o.id === previousVote) return { ...o, votes: Math.max(0, o.votes - 1) }; // switching: undo the old pick
        return o;
      })
    );
    spawnBubble(options.find((o) => o.id === optId), e?.currentTarget);
    const opt = options.find((o) => o.id === optId);
    onParticipate?.({ type: "rankie", itemId: rankie.id, title: rankie.title, category: rankie.category, detail: opt?.label });
  };

  const toggleMulti = (id) =>
    setMultiSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submitMulti = (e) => {
    if (multiSelected.length === 0 || isClosed) return;
    setVoted(multiSelected);
    setOptions((prev) => prev.map((o) => (multiSelected.includes(o.id) ? { ...o, votes: o.votes + 1 } : o)));
    multiSelected.forEach((id) => spawnBubble(options.find((o) => o.id === id), e?.currentTarget));
    const labels = options.filter((o) => multiSelected.includes(o.id)).map((o) => o.label).join(", ");
    onParticipate?.({ type: "rankie", itemId: rankie.id, title: rankie.title, category: rankie.category, detail: labels });
  };

  const submitRating = (e) => {
    if (!ratingSelected || isClosed) return;
    // Rating options are stored star-count-first (e.g. id "5" = 5 stars); fall back
    // to counting from the end of the list if ids don't follow that convention.
    const target = options.find((o) => o.id === String(ratingSelected)) || options[options.length - ratingSelected];
    if (!target) return;
    setVoted(target.id);
    setOptions((prev) => prev.map((o) => (o.id === target.id ? { ...o, votes: o.votes + 1 } : o)));
    spawnBubble({ ...target, emoji: "⭐" }, e?.currentTarget);
    onParticipate?.({ type: "rankie", itemId: rankie.id, title: rankie.title, category: rankie.category, detail: `${ratingSelected}⭐` });
  };

  // "Unlimited" voting: every tap counts toward the spam total; the FIRST tap on a given
  // option also counts the viewer as one unique voter for it. `voted` is repurposed here
  // as { [optionId]: myTapCount } so the UI can show exactly how many times *you* tapped
  // each option — not just whether you've tapped it at all.
  const myTapCounts = tapCountsFor(voted);
  // Which option (if any) the viewer is actively mashing right now — shows a live tap
  // counter inside the circle while true, and settles back to a plain checkmark ~700ms
  // after the last tap, like a "seen" indicator settling after a burst of reactions.
  const [activeTapOption, setActiveTapOption] = useState(null);
  const activeTapTimer = useRef(null);
  const castUnlimitedVote = (optId, e) => {
    if (isClosed) return;
    const alreadyCountedAsVoter = (myTapCounts[optId] || 0) > 0;
    setOptions((prev) =>
      prev.map((o) =>
        o.id === optId
          ? { ...o, votes: o.votes + 1, voters: (o.voters ?? 0) + (alreadyCountedAsVoter ? 0 : 1) }
          : o
      )
    );
    setVoted({ ...myTapCounts, [optId]: (myTapCounts[optId] || 0) + 1 });
    spawnBubble(options.find((o) => o.id === optId), e?.currentTarget);
    // Mark this option as "actively being tapped" so its sticker shows a live counter;
    // restart the settle-down timer on every tap so a fast burst keeps the counter open.
    setActiveTapOption(optId);
    clearTimeout(activeTapTimer.current);
    activeTapTimer.current = setTimeout(() => setActiveTapOption(null), 700);
    if (!alreadyCountedAsVoter) {
      const opt = options.find((o) => o.id === optId);
      onParticipate?.({ type: "rankie", itemId: rankie.id, title: rankie.title, category: rankie.category, detail: opt?.label });
    }
  };
  useEffect(() => () => clearTimeout(activeTapTimer.current), []);

  // Both clickable charts (bar, head-to-head) take the same handler and voted id, so
  // derive them once. Multi-select and rating are excluded: they need their own
  // confirm step below rather than voting on a single chart tap.
  const chartVoteHandler = isUnlimited
    ? castUnlimitedVote
    : rankie.votingType === "multiple" || rankie.votingType === "rating"
    ? undefined
    : castVote;
  const chartVotedId = isUnlimited ? undefined : singleVotedId(voted) ?? undefined;

  // Consistent colors across chart types (esp. head-to-head which stores colors on rankie)
  const colorFor = (o, i) =>
    o.color || (rankie.chartType === "head_to_head" ? (i === 0 ? rankie.colorA : rankie.colorB) : [C.teal, C.gold, C.coral, "#8B7FD1", "#6B4E43"][i % 5]);
  // Give options a resolved color so bar/pie/line all match
  const coloredOptions = options.map((o, i) => ({ ...o, color: colorFor(o, i) }));
  // For "unlimited" type, charts/totals reflect whichever metric the viewer picked
  const displayOptions = isUnlimited
    ? coloredOptions.map((o) => ({ ...o, votes: resultMetric === "voters" ? (o.voters ?? 0) : o.votes }))
    : coloredOptions;
  const displayTotal = displayOptions.reduce((s, o) => s + o.votes, 0);

  return (
    <div>
      <TopBar
        onBack={onBack}
        right={
          <div style={{ position: "relative", display: "flex", gap: 4, alignItems: "center" }}>
            {(() => {
              const isOwner = rankie.mine || rankie.author?.id === "me";
              let lockReason = null;
              if (!isOwner) {
                if (!rankie.allowGuestPresent) lockReason = "Chủ bài chưa cho phép người khác trình chiếu";
                else if (!voted) lockReason = "Hãy bình chọn trước khi trình chiếu";
              }
              const locked = !!lockReason;
              return (
                <button
                  onClick={locked ? () => setPresentLockMsg(lockReason) : onPresent}
                  title={lockReason || "Trình chiếu"}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10, padding: 0 }}
                >
                  {locked ? <MonitorOff size={20} color={C.coral} /> : <Monitor size={20} color={C.teal} />}
                </button>
              );
            })()}
            {presentLockMsg && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: C.surfaceRaised, border: `1px solid ${C.coral}`, borderRadius: 10, padding: "8px 12px", fontFamily: bodyFont, fontSize: 12, color: C.text, whiteSpace: "nowrap", boxShadow: "0 6px 20px rgba(0,0,0,0.4)", zIndex: 20 }}>
                {presentLockMsg}
              </div>
            )}
          </div>
        }
      />

      <div style={{ padding: 16 }}>
        {rankie.author && (
          <AuthorRow author={rankie.author} onOpenAuthor={undefined} />
        )}
        <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 21, color: C.text, marginBottom: 12, lineHeight: 1.25 }}>
          {rankie.title}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <Pill tone="muted">{rankie.category}</Pill>
          {isClosed ? (
            <Pill tone="muted">
              <Lock size={11} /> Đã kết thúc
            </Pill>
          ) : (
            rankie.live && (
              <Pill tone="live">
                <span style={{ width: 6, height: 6, borderRadius: 99, background: C.teal, display: "inline-block" }} /> LIVE
              </Pill>
            )
          )}
          <Pill tone="muted">
            <Users size={11} /> {fmt(isUnlimited ? displayTotal : total)}
          </Pill>
          {isUnlimited && (
            <Pill tone="live">
              <Flame size={11} /> KHÔNG GIỚI HẠN
            </Pill>
          )}
        </div>

        {(rankie.caption || rankie.media) && (
          <PostContent caption={rankie.caption} media={rankie.media} clampLines={99} showMore={false} mediaHeight={200} />
        )}

        <div ref={resultsAreaRef} style={{ position: "relative" }}>
        <div style={{ ...cardSurface, marginBottom: 16, position: "relative", paddingBottom: 44 }}>
          {/* Đổi loại biểu đồ bằng icon (tap hiện tên rồi mờ dần) — không dùng dropdown */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            {chartTypes.map((ct) => {
              const active = activeChart === ct.id;
              return (
                <button
                  key={ct.id}
                  onClick={() => { setActiveChart(ct.id); setChartFlash({ label: ct.label, id: Date.now() }); }}
                  title={ct.label}
                  style={{ width: 34, height: 30, display: "grid", placeItems: "center", borderRadius: 8, cursor: "pointer", background: active ? C.goldSoft : "transparent", border: `1px solid ${active ? C.gold : C.border}` }}
                >
                  <ChartTypeIcon id={ct.id} size={16} color={active ? C.gold : C.textMuted} />
                </button>
              );
            })}
            {chartFlash && (
              <span key={chartFlash.id} style={{ marginLeft: 4, fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: C.gold, pointerEvents: "none", animation: "labelFade 1.4s ease forwards" }}>
                {chartFlash.label}
              </span>
            )}
          </div>

          {activeChart === "head_to_head" && (
            <HeadToHead
              rankie={rankie}
              options={displayOptions}
              isClosed={isClosed}
              onVote={chartVoteHandler}
              votedId={chartVotedId}
              tapCounts={isUnlimited ? myTapCounts : undefined}
              activeTapId={isUnlimited ? activeTapOption : undefined}
            />
          )}
          {activeChart === "bar" && (
            <BarViz
              options={displayOptions}
              isClosed={isClosed}
              onVote={chartVoteHandler}
              votedId={chartVotedId}
              tapCounts={isUnlimited ? myTapCounts : undefined}
              activeTapId={isUnlimited ? activeTapOption : undefined}
              voteMarker={rankie.voteMarker}
            />
          )}
          {activeChart === "pie" && <PieViz options={displayOptions} />}
          {activeChart === "line" && <LineViz options={displayOptions} colorFor={colorFor} createdAt={rankie.createdAt} />}

          {/* Góc dưới TRÁI: số người tham gia / lượt tương tác. Với rankie không giới hạn,
              chạm để chuyển giữa "người tham gia" và "lượt tương tác" (đổi icon) — không dropdown. */}
          <button
            onClick={isUnlimited ? () => { const nx = resultMetric === "votes" ? "voters" : "votes"; setResultMetric(nx); setChartFlash({ label: nx === "votes" ? "Lượt tương tác" : "Người tham gia", id: Date.now() }); } : undefined}
            title={isUnlimited ? (resultMetric === "votes" ? "Lượt tương tác — chạm để đổi" : "Người tham gia — chạm để đổi") : "Người tham gia"}
            style={{ position: "absolute", left: 10, bottom: 10, display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 999, background: "rgba(18,14,7,0.82)", border: `1px solid ${C.border}`, cursor: isUnlimited ? "pointer" : "default", zIndex: 3 }}
          >
            {isUnlimited && resultMetric === "votes" ? <SlidersHorizontal size={12} color={C.teal} /> : <Users size={12} color={C.textMuted} />}
            <span style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 13, color: C.text }}>{fmt(isUnlimited && resultMetric === "votes" ? displayTotal : total)}</span>
          </button>

          <RankieCountdownBox closesAt={rankie.closesAt} />
        </div>

        {isClosed ? (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: C.surfaceRaised,
              border: `1px solid ${C.border}`,
              color: C.textMuted,
              fontFamily: bodyFont,
              fontSize: 13,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Lock size={16} color={C.textFaint} />
            <span>
              Bình chọn đã kết thúc {rankie.closesAt ? `lúc ${new Date(rankie.closesAt).toLocaleString("vi-VN")}` : ""}. Bạn vẫn xem được kết quả ở trên.
            </span>
          </div>
        ) : isUnlimited ? (
          activeChart === "bar" || activeChart === "head_to_head" ? null : (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint, marginBottom: 8 }}>
              Bấm liên tục để tăng vote cho phương án yêu thích — không giới hạn số lần!
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {options.map((o) => {
                const tapCount = myTapCounts[o.id] || 0;
                const isActivelyTapping = activeTapOption === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={(e) => castUnlimitedVote(o.id, e)}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: `1px solid ${tapCount > 0 ? C.gold : C.border}`,
                      background: tapCount > 0 ? C.goldSoft : C.surfaceRaised,
                      color: C.text,
                      fontFamily: bodyFont,
                      fontWeight: 700,
                      fontSize: 14,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      userSelect: "none",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {(o.emoji || o.image) && <Illustration emoji={o.emoji} image={o.image} size={40} radius={11} />}
                      {o.label}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {tapCount > 0 && (
                        <span
                          style={{
                            display: "grid",
                            placeItems: "center",
                            minWidth: 22,
                            height: 22,
                            padding: isActivelyTapping ? "0 6px" : 0,
                            borderRadius: 99,
                            background: C.gold,
                            color: "#1A1305",
                            fontFamily: monoFont,
                            fontSize: 11,
                            fontWeight: 700,
                            transition: "transform 0.1s ease",
                            transform: isActivelyTapping ? "scale(1.1)" : "scale(1)",
                          }}
                        >
                          {isActivelyTapping ? tapCount : <Check size={12} strokeWidth={3} />}
                        </span>
                      )}
                      <span style={{ fontFamily: monoFont, fontSize: 12, color: C.textMuted }}>+1</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          )
        ) : rankie.votingType === "multiple" ? (
          !voted ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint, marginBottom: 2 }}>
                Chọn các phương án bạn ủng hộ (được chọn nhiều):
              </div>
              {options.map((o) => {
                const active = multiSelected.includes(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() => toggleMulti(o.id)}
                    style={{
                      padding: "13px 16px",
                      borderRadius: 12,
                      border: `1px solid ${active ? C.gold : C.border}`,
                      background: active ? C.goldSoft : C.surfaceRaised,
                      color: active ? C.gold : C.text,
                      fontFamily: bodyFont,
                      fontWeight: 600,
                      fontSize: 14,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        border: `1.5px solid ${active ? C.gold : C.textFaint}`,
                        background: active ? C.gold : "transparent",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {active && <Check size={12} strokeWidth={3} color="#1A1305" />}
                    </span>
                    {o.flag ? (
                      <span style={{ fontSize: 18 }}>{o.flag}</span>
                    ) : (o.emoji || o.image) ? (
                      <Illustration emoji={o.emoji} image={o.image} size={40} radius={11} />
                    ) : null}
                    {o.label}
                  </button>
                );
              })}
              <button
                onClick={(e) => submitMulti(e)}
                disabled={multiSelected.length === 0}
                style={{
                  marginTop: 4,
                  padding: 13,
                  borderRadius: 12,
                  border: "none",
                  background: multiSelected.length ? C.gold : C.surfaceRaised,
                  color: multiSelected.length ? "#1A1305" : C.textFaint,
                  fontFamily: bodyFont,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: multiSelected.length ? "pointer" : "not-allowed",
                }}
              >
                Xác nhận bình chọn {multiSelected.length > 0 && `(${multiSelected.length})`}
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: C.goldSoft,
                border: `1px solid ${C.gold}`,
                color: C.gold,
                fontFamily: bodyFont,
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
                animation: "pulseGlow 1.6s ease-out",
              }}
            >
              <Check size={16} />
              {`Đã ghi nhận bình chọn: ${(Array.isArray(voted) ? voted : []).map((id) => options.find((o) => o.id === id)?.label).filter(Boolean).join(", ")}`}
            </div>
          )
        ) : rankie.votingType === "rating" ? (
          !voted ? (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint, marginBottom: 10 }}>
                Chọn mức đánh giá của bạn:
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 14 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRatingSelected(n)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 30, lineHeight: 1, padding: 2 }}
                  >
                    {n <= ratingSelected ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <button
                onClick={(e) => submitRating(e)}
                disabled={!ratingSelected}
                style={{
                  width: "100%",
                  padding: 13,
                  borderRadius: 12,
                  border: "none",
                  background: ratingSelected ? C.gold : C.surfaceRaised,
                  color: ratingSelected ? "#1A1305" : C.textFaint,
                  fontFamily: bodyFont,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: ratingSelected ? "pointer" : "not-allowed",
                }}
              >
                Gửi đánh giá
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: C.goldSoft,
                border: `1px solid ${C.gold}`,
                color: C.gold,
                fontFamily: bodyFont,
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
                animation: "pulseGlow 1.6s ease-out",
              }}
            >
              <Check size={16} />
              {`Đã ghi nhận bình chọn: ${options.find((o) => o.id === voted)?.label || ""}`}
            </div>
          )
        ) : (
          // Single-choice: the sticker grid always stays visible (even after voting) so
          // the viewer can tap their pick again to undo it, or tap a different option
          // to switch — it's only hidden when Cột/Đối đầu is active, since those charts
          // already let the viewer vote directly on the same options.
          <>
            {activeChart !== "bar" && activeChart !== "head_to_head" && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint, marginBottom: 8 }}>
                  {voted ? "Bình chọn của bạn (bấm lại để hủy, hoặc chọn phương án khác):" : "Bình chọn của bạn:"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
                  {options.map((o) => {
                    const isMine = voted === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={(e) => castVote(o.id, e)}
                        style={{
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          padding: "12px 8px",
                          borderRadius: 14,
                          border: `1px solid ${isMine ? C.gold : C.border}`,
                          background: isMine ? C.goldSoft : C.surfaceRaised,
                          cursor: "pointer",
                        }}
                      >
                        {isMine && (
                          <span
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              width: 18,
                              height: 18,
                              borderRadius: 99,
                              background: C.gold,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <Check size={11} color="#1A1305" strokeWidth={3} />
                          </span>
                        )}
                        {o.flag ? (
                          <span style={{ fontSize: 34, lineHeight: 1 }}>{o.flag}</span>
                        ) : (
                          <Illustration emoji={o.emoji} image={o.image} size={56} radius={12} />
                        )}
                        <span
                          style={{
                            fontFamily: bodyFont,
                            fontWeight: 600,
                            fontSize: 12.5,
                            color: isMine ? C.gold : C.text,
                            textAlign: "center",
                            lineHeight: 1.25,
                          }}
                        >
                          {o.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
        <VoteBubbleLayer bubbles={bubbles} />
        </div>

        <RankieTimeline rankie={rankie} options={displayOptions} />

        <EngagementBar
          type="rankie"
          joined={!!voted}
          participants={isUnlimited ? displayTotal : total}
          comments={rankie.comments?.length || 0}
          shares={rankie.shares || 0}
          sessionCount={sessions?.length || 0}
          sessionList={sessions || []}
          onOpenSession={onOpenSession}
          onShareClick={() => setShareOpen(true)}
        />
        <div style={{ height: 14 }} />

        <CommentsSection
          postId={rankie.id}
          initialComments={rankie.comments}
          supportOptions={options.map((o, i) => ({
            id: o.id,
            label: o.label,
            color: o.color || (rankie.chartType === "head_to_head" ? (i === 0 ? rankie.colorA : rankie.colorB) : C.gold),
          }))}
          getSupportLabel={(id) => {
            const idx = options.findIndex((x) => x.id === id);
            if (idx < 0) return null;
            const o = options[idx];
            const color = o.color || (rankie.chartType === "head_to_head" ? (idx === 0 ? rankie.colorA : rankie.colorB) : C.gold);
            return { label: o.label, color };
          }}
        />

        {/* Presenter sessions saved for this rankie */}
        {(sessions || []).length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 13, color: C.text, padding: "0 4px", marginBottom: 10 }}>
              🎬 Phiên trình chiếu ({sessions.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sessions.map((s) => <SessionResultCard key={s.id} session={s} />)}
            </div>
          </div>
        )}
      </div>
      {shareOpen && (
        <ShareModal item={rankie} onClose={() => setShareOpen(false)} onShareToProfile={onShareToProfile} contacts={contacts ?? []} />
      )}
    </div>
  );
}

// ---------- PATH VIEW ----------
// A single illustrated choice button
function ChoiceButton({ choice, onClick, accent, layout = "col", imageSize = 76 }) {
  const isRow = layout === "row";
  // Có ảnh → dạng "text trên ảnh": ảnh làm nền, nhãn đè lên cùng lớp phủ tối để chữ
  // luôn đọc được (tài liệu PATH: Text on images / Mixed image and text). Không ảnh →
  // dạng emoji + nhãn như cũ.
  if (choice.image) {
    const h = isRow ? 84 : imageSize >= 90 ? 150 : 118;
    return (
      <button
        onClick={onClick}
        style={{ flex: 1, width: "100%", position: "relative", height: h, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "pointer", padding: 0, transition: "transform 0.15s ease, border-color 0.15s ease" }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = C.border; }}
      >
        <img src={choice.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)" }} />
        <span style={{ position: "absolute", left: 12, right: 12, bottom: 10, fontFamily: bodyFont, fontWeight: 800, fontSize: 15, color: "#fff", textAlign: "left", lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
          {choice.label}
        </span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        width: "100%",
        display: "flex",
        flexDirection: isRow ? "row" : "column",
        alignItems: "center",
        gap: isRow ? 14 : 10,
        padding: isRow ? "12px 14px" : "18px 12px",
        borderRadius: 16,
        background: C.surface,
        border: `1px solid ${C.border}`,
        cursor: "pointer",
        transition: "transform 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <Illustration emoji={choice.emoji} image={choice.image} size={imageSize} radius={16} />
      <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 14, color: C.text, textAlign: isRow ? "left" : "center", lineHeight: 1.25, flex: isRow ? 1 : "none" }}>
        {choice.label}
      </span>
    </button>
  );
}

function PathView({ path = samplePath, startAtIntro = false, onComplete, onPresent, initialResultStep = null, unlockedEndings = [] }) {
  const [step, setStep] = useState(initialResultStep || (startAtIntro ? "intro" : "q1"));
  const [answered, setAnswered] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [threadEnding, setThreadEnding] = useState(null); // ending đang xem thread bình luận
  // Nếu mở thẳng vào kết quả đã có sẵn (đã tham gia trước đó), không coi đó là một
  // lượt tham gia MỚI — chỉ ghi vào lịch sử khi thật sự đi hết các câu hỏi lần này.
  const reportedResultRef = useRef(initialResultStep || null);

  // Record participation the first time a result is reached in this session — guarded
  // by a ref so re-renders don't create duplicate history entries. Computed and hooked
  // here, before any early return below, so this always runs in the same hook order.
  const isResultStep = !path.questions.find((q) => q.id === step);
  useEffect(() => {
    if (isResultStep && reportedResultRef.current !== step) {
      reportedResultRef.current = step;
      onComplete?.({ type: "path", itemId: path.id, title: path.title, category: path.category, detail: step });
    }
  }, [isResultStep, step]);

  // Sample discussion for the result screen (support = which result the author got)
  const resultNames = Object.keys(path.results);
  const pathComments = [
    { id: "pc1", user: "minh_hr", text: "Ra kết quả này chuẩn với mình luôn, làm nghề 6 năm rồi.", rankUp: 340, rankDown: 20, supports: resultNames[0], createdAt: Date.now() - 1000 * 60 * 90 },
    { id: "pc2", user: "devlan", text: "Mình ra kết quả khác nhưng thấy bài test khá vui 😆", rankUp: 512, rankDown: 610, supports: resultNames[Math.min(1, resultNames.length - 1)], createdAt: Date.now() - 1000 * 60 * 30 },
  ];

  const shareResult = async (resultName) => {
    const link = `https://rankev.app/path/${path.id}?result=${encodeURIComponent(resultName)}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard API may be unavailable in some embedded/sandboxed views — the
      // UI feedback below still confirms intent even if the copy silently fails.
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2200);
  };

  const answer = (choice) => {
    setStep(choice.next);
    setAnswered((a) => a + 1);
  };

  const reset = () => {
    setStep("intro");
    setAnswered(0);
  };

  const isOwner = path.author?.id === "me";
  const [ownerPreview, setOwnerPreview] = useState(false); // chủ bài bấm "Xem trước" để tự thử qua

  // INTRO SCREEN
  if (step === "intro") {
    const first = path.questions[0];

    // Chủ bài đã biết rõ nội dung & đáp án — hiện màn tổng quan quản lý thay vì bắt
    // đi qua từng câu hỏi. Có nút "Xem trước" nếu họ vẫn muốn tự trải nghiệm như
    // người tham gia.
    if (isOwner && !ownerPreview) {
      const resultEntries = Object.entries(path.results);
      return (
        <div style={{ padding: 20 }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 14 }}>
              {resultEntries.slice(0, 4).map(([name, r], i) => (
                <Illustration key={i} emoji={r.emoji} image={r.image} size={44} radius={11} />
              ))}
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, letterSpacing: 0.5, marginBottom: 6 }}>
              BÀI CỦA BẠN · TỔNG QUAN
            </div>
            <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 21, color: C.text, marginBottom: 8, lineHeight: 1.25 }}>
              {path.title}
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted }}>
              {fmt(path.participants)} người đã thử · {path.questions.length} câu hỏi · {resultEntries.length} kết quả
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>
              Phân bố kết quả
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {resultEntries.map(([name, r]) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Illustration emoji={r.emoji} image={r.image} size={30} radius={8} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 12.5, marginBottom: 3 }}>
                      <span style={{ color: C.text, fontWeight: 600 }}>{name}</span>
                      <span style={{ color: C.textFaint, fontFamily: monoFont }}>{r.pct}%</span>
                    </div>
                    <div style={{ height: 7, background: C.surfaceRaised, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${r.pct}%`, height: "100%", background: C.gold, borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => setOwnerPreview(true)}
              style={{ width: "100%", padding: 13, borderRadius: 12, background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
            >
              Xem trước dạng người tham gia
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 18 }}>
          {(() => {
            // Không spoil kết quả: chỉ hiện ending THẬT khi tác giả bật revealMode="all",
            // là chủ bài, hoặc người xem đã khám phá ending đó. Còn lại hiện dấu "?".
            const revealAll = isOwner || (path.revealMode || "hidden") === "all";
            const unlockedSet = new Set(unlockedEndings || []);
            return Object.entries(path.results).slice(0, 4).map(([name, r], i) => {
              const reveal = revealAll || unlockedSet.has(name);
              return reveal
                ? <Illustration key={i} emoji={r.emoji} image={r.image} size={52} radius={12} />
                : <div key={i} style={{ width: 52, height: 52, borderRadius: 12, background: C.surfaceRaised, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", fontSize: 24, color: C.textFaint }}>?</div>;
            });
          })()}
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, letterSpacing: 0.5, marginBottom: 6 }}>
          RANKEV PATH
        </div>
        <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 24, color: C.text, marginBottom: 10, lineHeight: 1.25 }}>
          {path.title}
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
          {fmt(path.participants)} người đã thử · {path.questions.length} câu hỏi
        </div>
        {(path.caption || path.media) && (
          <div style={{ textAlign: "left", marginBottom: 20 }}>
            <PostContent caption={path.caption} media={path.media} clampLines={99} showMore={false} mediaHeight={190} />
          </div>
        )}
        <button
          onClick={() => setStep(first.id)}
          style={{ ...primaryButton, width: "100%", padding: 15, borderRadius: 14, fontSize: 15 }}
        >
          Bắt đầu
        </button>
        {!isOwner && <LockedCommentsNotice />}
      </div>
    );
  }

  const isResult = !path.questions.find((q) => q.id === step);

  // RESULT SCREEN — bố cục theo khuôn Rankie: tác giả + tiêu đề + banner kết quả +
  // thẻ biểu đồ phân bố (cùng khung cardSurface, chip số người góc dưới trái) + hành động.
  if (isResult) {
    const r = path.results[step];
    const allEndings = Object.keys(path.results);
    // Tập ending đã khám phá — gồm mọi lần chơi trước + ending hiện tại. Chủ bài xem
    // được hết (họ tạo ra bài). revealMode của người tạo sẽ tinh chỉnh ở đợt sau; hiện
    // mặc định ẩn hết ending chưa khám phá để giữ bí ẩn, khuyến khích chơi lại.
    const unlocked = new Set([...(unlockedEndings || []), step]);
    // 4 chế độ tiết lộ của người tạo (tài liệu PATH): 'all' hiện tất cả · 'names' chỉ
    // hiện tên · 'stats' chỉ hiện thống kê % · 'hidden' ẩn hết (mặc định, giữ bí ẩn).
    const revealMode = path.revealMode || "hidden";
    const revealAll = isOwner || revealMode === "all";
    // Chỉ đếm những ending THỰC SỰ thuộc bài này (unlockedEndings có thể lẫn giá trị cũ),
    // nên discovered không bao giờ vượt tổng số kết quả (sửa lỗi hiện 5/4).
    const discovered = revealAll ? allEndings.length : allEndings.filter((e) => unlocked.has(e)).length;
    const remaining = allEndings.length - discovered;
    const hideCount = path.hideEndingCount && revealMode === "hidden" && !isOwner; // ẩn cả số lượng kết quả
    return (
      <div style={{ padding: 16 }}>
        {path.author && <AuthorRow author={path.author} onOpenAuthor={undefined} />}
        <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 21, color: C.text, marginBottom: 12, lineHeight: 1.25 }}>
          {path.title}
        </div>

        {r.image ? (
          // Có ảnh đính kèm → hiện LỚN dạng ảnh bìa kết quả, chữ nằm dưới.
          <div style={{ background: C.goldSoft, border: `1px solid ${C.gold}55`, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
            <img src={r.image} alt={step} style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block", animation: "popIn 0.4s ease" }} />
            <div style={{ padding: 14 }}>
              <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, letterSpacing: 0.5, marginBottom: 3 }}>KẾT QUẢ CỦA BẠN</div>
              <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: C.text, lineHeight: 1.15 }}>{step}</div>
              <div style={{ fontFamily: monoFont, fontSize: 12, color: C.gold, marginTop: 3 }}>{r.pct}% giống bạn · {fmt(r.count)} người</div>
            </div>
          </div>
        ) : (
          // Chỉ có emoji → giữ sticker nhỏ cạnh chữ như cũ.
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.goldSoft, border: `1px solid ${C.gold}55`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <div style={{ animation: "popIn 0.4s ease", flexShrink: 0 }}>
              <Illustration emoji={r.emoji} image={r.image} size={60} radius={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, letterSpacing: 0.5, marginBottom: 3 }}>KẾT QUẢ CỦA BẠN</div>
              <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: C.text, lineHeight: 1.15 }}>{step}</div>
              <div style={{ fontFamily: monoFont, fontSize: 12, color: C.gold, marginTop: 3 }}>{r.pct}% giống bạn · {fmt(r.count)} người</div>
            </div>
          </div>
        )}

        {/* Companions — tài liệu PATH: ≤5 endings mỗi ending là 1 cộng đồng riêng;
            >5 endings tự chuyển sang cộng đồng chung (global) cho toàn Path. */}
        {(() => {
          const useGlobal = allEndings.length > 5;
          const seed = useGlobal ? sdHash(path.id || path.title || "p") : sdHash((path.id || path.title || "p") + "|" + step);
          const mates = makeCompanions(seed);
          const others = Math.max(0, (useGlobal ? path.participants : r.count || 0) - 1);
          return (
            <div style={{ ...cardSurface, marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", flexShrink: 0 }}>
                {mates.slice(0, 5).map((m, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: m.color, display: "grid", placeItems: "center", fontSize: 15, border: `2px solid ${C.surface}`, marginLeft: i ? -10 : 0 }}>{m.emoji}</div>
                ))}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 13, color: C.text }}>{useGlobal ? "Cộng đồng Path" : "Bạn đồng hành"}</div>
                <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textMuted, marginTop: 1 }}>
                  {useGlobal
                    ? `${mates[0]?.name} và ${fmt(others)} người khác đã trải nghiệm Path này`
                    : `${mates[0]?.name}${others > 1 ? ` và ${fmt(others)} người khác` : ""} cũng đến "${step}"`}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tiến độ khám phá — cốt lõi của trải nghiệm replay: mỗi lần chơi mở thêm một
            "thực tại" khác. Ẩn với chủ bài (họ thấy toàn bộ). Khi creator bật ẩn số
            kết quả (hideCount), không lộ tổng số để giữ bí ẩn "còn bao nhiêu ending". */}
        {!revealAll && (
          <div style={{ ...cardSurface, marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flexShrink: 0, position: "relative", width: 44, height: 44 }}>
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="19" fill="none" stroke={C.surfaceRaised} strokeWidth="4" />
                {!hideCount && (
                  <circle cx="22" cy="22" r="19" fill="none" stroke={C.gold} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(discovered / allEndings.length) * 119.4} 119.4`} transform="rotate(-90 22 22)" />
                )}
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: monoFont, fontWeight: 800, fontSize: 12, color: C.gold }}>
                {hideCount ? discovered : `${discovered}/${allEndings.length}`}
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 13.5, color: C.text }}>
                {hideCount ? `Đã khám phá ${discovered} kết quả` : `Đã khám phá ${discovered}/${allEndings.length} kết quả`}
              </div>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textMuted, marginTop: 1 }}>
                {hideCount
                  ? "Vẫn còn những kết quả bí ẩn đang chờ bạn khám phá"
                  : (remaining > 0 ? `Còn ${remaining} thực tại khác đang chờ bạn khám phá` : "Bạn đã khám phá tất cả kết quả! 🎉")}
              </div>
            </div>
          </div>
        )}

        <div style={{ ...cardSurface, marginBottom: 16, position: "relative", paddingBottom: 44 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Phân bố kết quả</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(path.results).map(([name, d]) => {
              const isUnlocked = revealAll || unlocked.has(name);
              // Khi ẩn hết + creator ẩn số kết quả: KHÔNG hiện từng dòng khoá (sẽ lộ
              // tổng số), gộp thành 1 dòng bí ẩn bên dưới.
              if (!isUnlocked && hideCount) return null;
              if (!isUnlocked) {
                // Ending chưa khám phá — hiển thị tuỳ chế độ tiết lộ của người tạo.
                const showName = revealMode === "names"; // chỉ tên, ẩn %
                const showStats = revealMode === "stats"; // chỉ %, ẩn tên
                return (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, opacity: showName || showStats ? 1 : 0.75 }}>
                    {showName ? (
                      <Illustration emoji={d.emoji} image={d.image} size={30} radius={8} />
                    ) : (
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: C.surfaceRaised, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <Lock size={14} color={C.textFaint} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 12.5, marginBottom: 3 }}>
                        <span style={{ color: C.textFaint }}>{showName ? name : "Kết quả chưa khám phá"}</span>
                        {showStats && <span style={{ color: C.textFaint, fontFamily: monoFont }}>{d.pct}%</span>}
                      </div>
                      <div style={{ height: 8, background: C.surfaceRaised, borderRadius: 5, overflow: "hidden" }}>
                        {showStats ? (
                          <div style={{ width: `${d.pct}%`, height: "100%", background: C.border, borderRadius: 5 }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: `repeating-linear-gradient(45deg, ${C.surfaceRaised}, ${C.surfaceRaised} 6px, ${C.border} 6px, ${C.border} 12px)`, borderRadius: 5 }} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Illustration emoji={d.emoji} image={d.image} size={30} radius={8} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 12.5, marginBottom: 3 }}>
                      <span style={{ color: name === step ? C.gold : C.textMuted, fontWeight: name === step ? 700 : 500 }}>{name}{name === step ? " · bạn" : ""}</span>
                      <span style={{ color: C.textFaint, fontFamily: monoFont }}>{d.pct}%</span>
                    </div>
                    <div style={{ height: 8, background: C.surfaceRaised, borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ width: `${d.pct}%`, height: "100%", background: name === step ? C.gold : C.border, borderRadius: 5 }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {hideCount && remaining > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint, fontStyle: "italic" }}>
                <Lock size={13} color={C.textFaint} /> Còn những kết quả bí ẩn khác…
              </div>
            )}
          </div>
          <div style={{ position: "absolute", left: 10, bottom: 10, display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 999, background: "rgba(18,14,7,0.82)", border: `1px solid ${C.border}` }}>
            <Users size={12} color={C.textMuted} />
            <span style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 13, color: C.text }}>{fmt(path.participants)}</span>
          </div>
        </div>

        <button onClick={reset} style={{ width: "100%", padding: "13px", borderRadius: 12, background: (remaining > 0 || hideCount) && !revealAll ? C.gold : C.surfaceRaised, border: (remaining > 0 || hideCount) && !revealAll ? "none" : `1px solid ${C.border}`, color: (remaining > 0 || hideCount) && !revealAll ? "#1A1305" : C.text, fontFamily: bodyFont, fontWeight: 700, cursor: "pointer" }}>
          {revealAll ? "Thử lại" : hideCount ? "Thử lại để khám phá kết quả khác" : remaining > 0 ? `Thử lại để khám phá ${remaining} kết quả còn ẩn` : "Thử lại"}
        </button>

        <div style={{ marginTop: 24 }}>
          <EngagementBar type="path" joined participants={path.participants} comments={path.comments} shares={path.shares || 0} onShareClick={() => shareResult(step)} />
        </div>

        {/* Bình luận — tài liệu PATH: ≤5 endings mỗi ending là 1 thread riêng (chỉ xem
            thread ending đã mở, chuyển qua lại); >5 endings tự chuyển sang bình luận
            chung (global), tắt kênh theo ending. */}
        {(() => {
          const useGlobal = allEndings.length > 5;
          if (useGlobal) {
            return (
              <div style={{ textAlign: "left", marginTop: 14 }}>
                <div style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: C.textFaint, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7 }}>Bình luận chung</div>
                <CommentsSection postId={path.id} initialComments={pathComments} supportOptions={[]} />
              </div>
            );
          }
          const unlockedList = allEndings.filter((e) => revealAll || unlocked.has(e));
          const activeThread = threadEnding && unlockedList.includes(threadEnding) ? threadEnding : step;
          const threadComments = pathComments.filter((c) => c.supports === activeThread);
          return (
            <div style={{ textAlign: "left", marginTop: 14 }}>
              {unlockedList.length > 1 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: C.textFaint, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7 }}>Thảo luận theo kết quả</div>
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
                    {unlockedList.map((name) => {
                      const active = name === activeThread;
                      return (
                        <button key={name} onClick={() => setThreadEnding(name)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: `1px solid ${active ? C.gold : C.border}`, background: active ? C.goldSoft : "transparent", cursor: "pointer" }}>
                          <span style={{ fontSize: 14 }}>{path.results[name].emoji}</span>
                          <span style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? C.gold : C.textMuted }}>{name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <CommentsSection
                key={activeThread}
                postId={path.id}
                ending={activeThread}
                initialComments={threadComments}
                supportOptions={[{ id: activeThread, label: activeThread, color: activeThread === step ? C.gold : C.teal }]}
                getSupportLabel={(id) =>
                  path.results[id] && (revealAll || unlocked.has(id))
                    ? { label: id, color: id === step ? C.gold : C.teal }
                    : (path.results[id] ? { label: "Kết quả chưa khám phá", color: C.textFaint } : null)
                }
              />
            </div>
          );
        })()}
      </div>
    );
  }

  // QUESTION SCREEN
  const q = path.questions.find((q) => q.id === step);
  const progress = Math.round((answered / path.questions.length) * 100);
  // Auto layout theo số lựa chọn (tài liệu PATH): 2 → 2 thẻ lớn cạnh nhau, 3 → 3 thẻ
  // ngang xếp dọc, 4 → lưới 2×2. Ưu tiên vùng đáp án, thu gọn vùng câu hỏi (visual-first).
  const choices = q.answers ? q.answers : [q.yes, q.no];
  const n = choices.length;
  const gridCols = n === 2 ? "1fr 1fr" : n === 4 ? "1fr 1fr" : "1fr";
  const choiceLayout = n === 3 ? "row" : "col";
  const choiceImg = n === 2 ? 96 : n === 4 ? 64 : 52;
  // Choice Areas / Hotspot: lựa chọn có toạ độ {x,y} sẽ đặt NGAY TRÊN ảnh cảnh; lựa
  // chọn không có toạ độ xếp thành thẻ bên dưới như thường.
  const hotspotChoices = q.sceneImage ? choices.filter((c) => c && c.hotspot) : [];
  const flowChoices = choices.filter((c) => c && (!q.sceneImage || !c.hotspot));
  const interactive = hotspotChoices.length > 0;

  return (
    <div style={{ padding: "16px 20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 6, background: C.surfaceRaised, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: C.teal, transition: "width 0.4s ease", borderRadius: 3 }} />
        </div>
      </div>
      {q.sceneImage ? (
        // Cảnh tương tác (Scene): ảnh nền + câu hỏi đè lên (Scene-Based Interaction).
        // Ảnh do người tạo gắn thủ công — không phụ thuộc AI.
        <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 16, minHeight: interactive ? 0 : 150 }}>
          <img src={q.sceneImage} alt="" style={interactive
            ? { width: "100%", height: "auto", display: "block" }
            : { width: "100%", display: "block", maxHeight: 260, objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: interactive
            ? "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.35) 100%)"
            : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 100%)" }} />
          <div style={{ position: "absolute", left: 14, right: 14, ...(interactive ? { top: 12 } : { bottom: 12 }), fontFamily: displayFont, fontWeight: 700, fontSize: 19, color: "#fff", lineHeight: 1.25, textShadow: "0 1px 6px rgba(0,0,0,0.7)", textAlign: interactive ? "center" : "left" }}>
            {q.text}
          </div>
          {/* Nút lựa chọn đặt tự do trên ảnh */}
          {hotspotChoices.map((choice, i) => (
            <button
              key={i}
              onClick={() => answer(choice)}
              style={{ position: "absolute", left: `${choice.hotspot.x}%`, top: `${choice.hotspot.y}%`, transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 999, background: "rgba(18,14,7,0.82)", border: `1.5px solid ${C.gold}`, color: "#fff", fontFamily: bodyFont, fontWeight: 700, fontSize: 13.5, cursor: "pointer", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", boxShadow: "0 4px 14px rgba(0,0,0,0.4)", maxWidth: "70%", whiteSpace: "nowrap" }}
            >
              {choice.emoji && <span style={{ fontSize: 16 }}>{choice.emoji}</span>}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{choice.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 19, color: C.text, marginBottom: 18, textAlign: "center", lineHeight: 1.3 }}>
          {q.text}
        </div>
      )}
      {flowChoices.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: flowChoices.length === 2 ? "1fr 1fr" : flowChoices.length === 4 ? "1fr 1fr" : "1fr", gap: 12 }}>
          {flowChoices.map((choice, i) => (
            <ChoiceButton key={i} choice={choice} onClick={() => answer(choice)} accent={i % 2 ? C.gold : C.teal} layout={flowChoices.length === 3 ? "row" : "col"} imageSize={choiceImg} />
          ))}
        </div>
      )}
    </div>
  );
}

// Path shown as a post in the feed
function PathCard({ path, onOpen, onOpenAuthor, menuSlot, hideCategory, onShare, joined = false, bookmarked = false, onToggleBookmark, myResult, unlockedEndings = [], sessionCount = 0, sessionList = [], onSeeAllSessions, onOpenSession, rankTier = 0, onSetRank, fanCount = 0 }) {
  const myResultData = myResult?.detail ? path.results?.[myResult.detail] : null;
  const allEndings = Object.keys(path.results || {});
  const discovered = allEndings.filter((e) => (unlockedEndings || []).includes(e) || e === myResult?.detail).length;
  const hideCount = !!path.hideEndingCount;
  return (
    <div
      onClick={onOpen}
      style={{
        ...cardSurface,
        cursor: "pointer",
        animation: "popIn 0.3s ease",
      }}
    >
      {path.author ? (
        <AuthorRow author={path.author} onOpenAuthor={onOpenAuthor} rightSlot={<>{menuSlot}<Pill tone="gold"><GitBranch size={11} /> PATH</Pill></>} rankTier={rankTier} onSetRank={onSetRank} fanCount={fanCount} />
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <Pill tone="gold"><GitBranch size={11} /> PATH</Pill>
        </div>
      )}
      {!hideCategory && (
        <div style={{ marginBottom: 10 }}>
          <Pill tone="muted">{path.category}</Pill>
        </div>
      )}
      <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 18, color: C.text, marginBottom: 4 }}>
        {path.title}
      </div>

      {myResultData ? (
        // Đã tham gia — hiện kết quả gần nhất của chính mình, giống cách Rankie hiện "lựa chọn của bạn"
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: C.goldSoft, border: `1px solid ${C.gold}55`, marginBottom: 12 }}>
          <Illustration emoji={myResultData.emoji} image={myResultData.image} size={38} radius={10} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint }}>
              Kết quả gần nhất của bạn
            </div>
            <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 14, color: C.text }}>{myResult.detail}</div>
            {allEndings.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, fontFamily: bodyFont, fontSize: 11, color: C.gold, fontWeight: 600 }}>
                <GitBranch size={11} />
                {hideCount ? `Đã khám phá ${discovered} kết quả` : `Đã khám phá ${discovered}/${allEndings.length} kết quả`}
              </div>
            )}
          </div>
        </div>
      ) : path.caption || path.media ? (
        <PostContent caption={path.caption} media={path.media} mediaHeight={170} />
      ) : (
        // Fallback when the path has no post content: a neutral prompt (no spoilers)
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: C.surfaceRaised, border: `1px solid ${C.border}`, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.goldSoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <GitBranch size={18} color={C.gold} />
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted, lineHeight: 1.35 }}>
            Trắc nghiệm {path.questions?.length || 0} câu · nhấn để xem giới thiệu và thử
          </div>
        </div>
      )}

      <EngagementBar
        type="path"
        joined={joined}
        participants={path.participants}
        comments={path.comments}
        shares={path.shares || 0}
        sessionCount={sessionCount}
        sessionList={sessionList}
        onSeeAllSessions={onSeeAllSessions}
        onOpenSession={onOpenSession}
        bookmarked={bookmarked}
        onJoinClick={onOpen}
        onCommentClick={onOpen}
        onShareClick={() => onShare?.(path)}
        onBookmarkClick={() => onToggleBookmark?.(path)}
      />
    </div>
  );
}

// ---------- PATH PRESENTER (trình chiếu) ----------
// Mirrors Rankie/Survey/Exam's presenter flow: phòng chờ → kết thúc → xem phân bố kết
// quả của người tham gia → đặt tên & lưu phiên (đếm vào icon Monitor trên PathCard).
function PathPresenterView({ path, onBack, onSessionEnd }) {
  const [phase, setPhase] = useState("setup"); // setup -> waiting -> results
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [csvCopied, setCsvCopied] = useState(false);
  const [presenterSessionName, setPresenterSessionName] = useState("");
  const [presenterSessionSaved, setPresenterSessionSaved] = useState(false);

  useEffect(() => {
    if (phase !== "waiting") return;
    const iv = setInterval(() => setParticipantCount((n) => n + Math.ceil(Math.random() * 3)), 750);
    return () => clearInterval(iv);
  }, [phase]);

  const startResults = () => {
    setParticipants(genPathParticipants(path));
    setPhase("results");
  };

  const distribution = Object.entries(path.results).map(([label, d]) => {
    const count = participants.filter((p) => p.result === label).length;
    const pct = participants.length > 0 ? Math.round((count / participants.length) * 100) : d.pct;
    return { label, ...d, liveCount: count, livePct: pct };
  }).sort((a, b) => b.liveCount - a.liveCount);

  const handleExportCSV = () => {
    const rows = [["Tên", "Kết quả"], ...participants.map((p) => [p.name, p.result])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${path.title.replace(/[^\w\d\s]/g, "").trim().replace(/\s+/g, "_")}_ket_qua.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    setCsvCopied(true); setTimeout(() => setCsvCopied(false), 2200);
  };

  if (phase === "setup") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        <TopBar title="Chuẩn bị trình chiếu" onBack={onBack} />
        <div style={{ padding: 24, flex: 1 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 6, lineHeight: 1.3 }}>{path.title}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted, marginBottom: 24 }}>
            {path.questions.length} câu hỏi · {Object.keys(path.results).length} kết quả · Người tham gia làm bài qua QR hoặc link.
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, lineHeight: 1.5 }}>
            Sau bước này là phòng chờ — mỗi người tham gia tự đi qua các câu hỏi và ra một kết quả; bạn xem phân bố kết quả của cả nhóm khi kết thúc.
          </div>
          <button onClick={() => setPhase("waiting")} style={{ ...primaryButton, width: "100%", marginTop: 24, padding: 15, borderRadius: 14, fontSize: 15 }}>
            Mở phòng chờ
          </button>
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 13, fontWeight: 600 }}>
            <ChevronLeft size={18} /> Thoát
          </button>
          <Pill tone="live"><span style={{ width: 6, height: 6, borderRadius: 99, background: C.teal, display: "inline-block" }} /> PHÒNG CHỜ</Pill>
        </div>
        <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, letterSpacing: 0.5, marginBottom: 6 }}>ĐANG CHỜ NGƯỜI THAM GIA</div>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 4, lineHeight: 1.3 }}>{path.title}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted, marginBottom: 28 }}>{path.questions.length} câu hỏi</div>
          <div style={{ width: 180, height: 180, background: "#fff", borderRadius: 16, display: "grid", placeItems: "center", marginBottom: 20 }}>
            <QrCode size={140} color="#111" />
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, fontWeight: 600, color: C.text, marginBottom: 4 }}>Quét mã hoặc bấm link để bắt đầu</div>
          <div style={{ fontFamily: monoFont, fontSize: 14, color: C.teal, fontWeight: 700, marginBottom: 28 }}>rankev.app/path/{path.id}</div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 28px", marginBottom: 28 }}>
            <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 34, color: C.gold, lineHeight: 1 }}>{fmt(participantCount)}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, marginTop: 4 }}>người đã vào phòng chờ</div>
          </div>
          <button onClick={startResults} style={{ ...primaryButton, width: "100%", maxWidth: 320, padding: 16, borderRadius: 14, fontSize: 15.5 }}>
            Kết thúc & Xem kết quả
          </button>
        </div>
      </div>
    );
  }

  // ----- RESULTS -----
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 13, fontWeight: 600 }}>
          <ChevronLeft size={18} /> Đóng
        </button>
        <Pill tone="muted">KẾT QUẢ PATH</Pill>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 30, color: C.gold }}>{fmt(participants.length)}</div>
          <div style={{ ...captionText, marginTop: 2 }}>người đã tham gia</div>
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>Phân bố kết quả</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {distribution.map((d) => (
            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Illustration emoji={d.emoji} image={d.image} size={34} radius={9} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: C.text, fontWeight: 600 }}>{d.label}</span>
                  <span style={{ color: C.textFaint, fontFamily: monoFont, fontWeight: 700 }}>{d.liveCount} · {d.livePct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 5, background: C.surface, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${d.livePct}%`, background: C.gold, borderRadius: 5 }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action panel — đặt tên & lưu phiên, giống Rankie/Survey/Exam */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
          {!presenterSessionSaved ? (
            <>
              <input
                type="text"
                value={presenterSessionName}
                onChange={(e) => setPresenterSessionName(e.target.value)}
                placeholder="Đặt tên phiên (VD: Lớp 10A1 · buổi sáng)"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontSize: 16 }}
              />
              <button
                onClick={() => {
                  onSessionEnd?.({ name: presenterSessionName.trim() || `Phiên ${new Date().toLocaleString("vi-VN")}`, endedAt: Date.now(), participants: participants.length });
                  setPresenterSessionSaved(true);
                }}
                style={{ padding: 13, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Monitor size={16} /> Lưu phiên trình chiếu
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 10, color: C.gold, fontFamily: bodyFont, fontWeight: 700, fontSize: 13 }}>
              <Check size={16} /> Đã lưu phiên "{presenterSessionName.trim() || "không tên"}"
            </div>
          )}
          <button
            onClick={handleExportCSV}
            style={{ padding: 11, borderRadius: 12, border: `1px solid ${csvCopied ? C.teal : C.border}`, background: C.surface, color: csvCopied ? C.teal : C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            {csvCopied ? <Check size={14} /> : <Download size={14} />} {csvCopied ? "Đã xuất!" : "Xuất CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- DECK (multi-question survey / future exam) ----------
// One question inside a Deck. Handles single / multiple / rating, tracks its own answer.
function DeckQuestion({ q, answer, onAnswer, showResults, graded }) {
  const total = q.options.reduce((s, o) => s + o.votes, 0) || 1;

  if (q.votingType === "text") {
    return (
      <div>
        <textarea
          value={answer || ""}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={showResults}
          placeholder="Nhập câu trả lời của bạn..."
          rows={3}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10,
            border: `1px solid ${C.border}`, background: showResults ? C.surfaceRaised : C.surface,
            color: C.text, fontFamily: bodyFont, fontSize: 13.5, resize: "vertical", outline: "none",
          }}
        />
        {showResults && graded && (
          <div style={{ ...captionText, marginTop: 6, fontStyle: "italic" }}>
            Câu tự luận — người tạo sẽ xem và chấm thủ công.
          </div>
        )}
      </div>
    );
  }

  if (q.votingType === "rating") {
    const current = answer || 0;
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => !showResults && onAnswer(n)}
              disabled={showResults}
              style={{ background: "none", border: "none", cursor: showResults ? "default" : "pointer", fontSize: 30, lineHeight: 1, padding: 2 }}
            >
              {n <= current ? "⭐" : "☆"}
            </button>
          ))}
        </div>
        {showResults && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {q.options.map((o) => {
              const pct = Math.round((o.votes / total) * 1000) / 10;
              return (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: bodyFont, fontSize: 12 }}>
                  <span style={{ width: 54, color: C.text }}>{o.label}</span>
                  <div style={{ flex: 1, height: 8, background: C.surfaceRaised, borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: C.gold, borderRadius: 5 }} />
                  </div>
                  <span style={{ color: C.textMuted, fontFamily: monoFont, width: 40, textAlign: "right" }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const multi = q.votingType === "multiple";
  const selected = multi ? (Array.isArray(answer) ? answer : []) : answer;

  const toggle = (id) => {
    if (showResults) return;
    if (multi) {
      const arr = Array.isArray(answer) ? answer : [];
      onAnswer(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
    } else {
      onAnswer(id);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {q.options.map((o) => {
        const isSel = multi ? selected.includes(o.id) : selected === o.id;
        const pct = Math.round((o.votes / total) * 1000) / 10;
        const isCorrect = graded && o.correct;
        const isWrongPick = graded && showResults && isSel && !o.correct;
        const showGradeIcon = graded && showResults && (isCorrect || isWrongPick);
        const resultBorder = isWrongPick ? C.coral : isCorrect ? C.teal : isSel ? C.gold : C.border;
        const resultBg = isWrongPick ? `${C.coral}14` : isCorrect ? `${C.teal}14` : isSel ? C.goldSoft : C.surfaceRaised;
        return (
          <button
            key={o.id}
            onClick={() => toggle(o.id)}
            disabled={showResults}
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "12px 14px",
              borderRadius: 11,
              border: `1px solid ${showResults ? resultBorder : isSel ? C.gold : C.border}`,
              background: showResults ? resultBg : isSel ? C.goldSoft : C.surfaceRaised,
              color: C.text,
              fontFamily: bodyFont,
              fontWeight: 600,
              fontSize: 13.5,
              textAlign: "left",
              cursor: showResults ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Result fill behind label */}
            {showResults && !graded && (
              <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `${C.gold}18`, zIndex: 0 }} />
            )}
            <span style={{ zIndex: 1, display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              {/* Leading status icon — standard quiz convention: green check = correct, red cross = your wrong pick */}
              {graded && showResults && (
                <span style={{
                  width: 20, height: 20, borderRadius: 99, flexShrink: 0,
                  display: "grid", placeItems: "center",
                  background: isCorrect ? C.teal : isWrongPick ? C.coral : "transparent",
                  border: isCorrect || isWrongPick ? "none" : `1.5px solid ${C.border}`,
                }}>
                  {isCorrect && <Check size={13} strokeWidth={3} color="#fff" />}
                  {isWrongPick && <X size={13} strokeWidth={3} color="#fff" />}
                </span>
              )}
              {!graded && multi && (
                <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isSel ? C.gold : C.textFaint}`, background: isSel ? C.gold : "transparent", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {isSel && <Check size={11} strokeWidth={3} color="#1A1305" />}
                </span>
              )}
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span style={{ color: showResults && graded ? resultBorder : C.text }}>{o.label}</span>
                {showGradeIcon && (
                  <span style={{ fontFamily: bodyFont, fontSize: 10.5, fontWeight: 700, color: resultBorder, marginTop: 1 }}>
                    {isCorrect ? "Đáp án đúng" : "Bạn đã chọn — sai"}
                  </span>
                )}
              </span>
            </span>
            {showResults && !graded && <span style={{ zIndex: 1, fontFamily: monoFont, fontSize: 12, color: C.textMuted }}>{pct}%</span>}
          </button>
        );
      })}
    </div>
  );
}

// Full Deck-taking experience: step-by-step or single-scroll, per the deck's answerMode.
function DeckView({ deck, onPresent, onComplete, initialAnswers = null, initialSubmitted = false, serverResult = null, serverStats = null }) {
  const [started, setStarted] = useState(!!initialSubmitted);
  const [answers, setAnswers] = useState(initialAnswers || {}); // { [questionId]: answer }
  const [stepIdx, setStepIdx] = useState(0);
  const [submitted, setSubmitted] = useState(!!initialSubmitted);
  const [freshSubmit, setFreshSubmit] = useState(false); // true chỉ khi vừa nộp trong phiên này (để hiện xác nhận); mở lại bài đã làm thì false
  const [showQuestionDetail, setShowQuestionDetail] = useState(false); // tóm tắt trước, bấm mới xem chi tiết từng câu

  const setAnswer = (qid, val) => setAnswers((prev) => ({ ...prev, [qid]: val }));
  const answeredCount = Object.keys(answers).filter((k) => {
    const a = answers[k];
    return Array.isArray(a) ? a.length > 0 : a != null && a !== 0;
  }).length;

  // Score a single question: returns { correct: bool, earned, max }
  const scoreQuestion = (q) => {
    const pts = q.points || 1;
    const correctIds = q.options.filter((o) => o.correct).map((o) => o.id);
    if (correctIds.length === 0) return { correct: null, earned: 0, max: pts };
    const a = answers[q.id];
    const chosen = Array.isArray(a) ? a : a != null ? [a] : [];
    const isRight = correctIds.length === chosen.length && correctIds.every((id) => chosen.includes(id));
    return { correct: isRight, earned: isRight ? pts : 0, max: pts };
  };

  const totalMax = deck.questions.reduce((s, q) => s + (q.votingType === "text" ? 0 : (q.points || 1)), 0) || 1;
  const totalEarned = deck.questions.reduce((s, q) => s + scoreQuestion(q).earned, 0);
  const localCorrect = deck.questions.filter((q) => scoreQuestion(q).correct).length;
  const localGradable = deck.questions.filter((q) => q.votingType !== "text").length || 1;
  const localScore10 = Math.round((totalEarned / totalMax) * 100) / 10;

  // Dữ liệu THẬT từ backend cho deck API — thay grading local (client KHÔNG có cờ `correct`
  // do chống gian lận → luôn ra 0) và thay peer giả lập bằng thống kê thật.
  const sr = deck.deckMode === "exam" && serverResult && serverResult.score != null ? serverResult : null;
  const realParticipants = serverStats && serverStats.participants != null ? serverStats.participants : null;
  const realAvg = serverStats && serverStats.avgScore != null ? serverStats.avgScore : null;

  const score10 = sr ? sr.score : localScore10;
  const correctCount = sr ? sr.correctCount : localCorrect;
  const gradableCount = sr ? (sr.totalGradable || localGradable) : localGradable;
  const grade = deck.deckMode === "exam" ? getGrade(score10) : null;

  // Peer giả lập — CHỈ dùng cho deck mock (không có dữ liệu thật).
  const [peerScores] = useState(() => {
    const n = 40 + Math.floor(Math.random() * 60);
    return Array.from({ length: n }, () => Math.round((3 + Math.random() * 7) * 10) / 10);
  });
  const percentile = deck.deckMode === "exam" && !sr
    ? Math.round((peerScores.filter((s) => s <= score10).length / peerScores.length) * 100)
    : null;
  // Số liệu cộng đồng. Deck THẬT: điểm TB + số người từ backend; KHÔNG bịa "% vượt qua"
  // (backend không trả phân bố từng người). Deck mock: dùng peer giả lập như cũ.
  const communityAvg = deck.deckMode !== "exam" ? 0
    : sr ? (realAvg != null ? realAvg : score10)
    : Math.round((peerScores.reduce((a, b) => a + b, 0) / peerScores.length) * 10) / 10;
  const diffFromAvg = Math.round((score10 - communityAvg) * 10) / 10;
  const beatPct = sr ? null : (deck.deckMode === "exam" ? Math.round((peerScores.filter((s) => s < score10).length / peerScores.length) * 100) : 0);
  const topPct = beatPct == null ? null : Math.max(1, 100 - beatPct);
  const highestScore = deck.deckMode === "exam" && !sr ? Math.max(...peerScores, score10) : score10;
  const lowestScore = deck.deckMode === "exam" && !sr ? Math.min(...peerScores, score10) : score10;

  // Phân bố điểm. Deck thật: chỉ có điểm của mình (backend chưa trả phân bố) → hiện 1 điểm.
  const allScores = deck.deckMode !== "exam" ? [] : sr ? [score10] : [...peerScores, score10];
  const gradeDistribution = GRADE_SCALE.map((g) => {
    const count = allScores.filter((s) => getGrade(s).grade === g.grade).length;
    return { ...g, count, pct: allScores.length > 0 ? Math.round((count / allScores.length) * 100) : 0 };
  });
  const [gradeFilter, setGradeFilter] = useState(null); // null = chưa chọn lọc, hoặc "A".."F"

  // Phân bố theo thang điểm (mỗi khoảng 1 điểm: 0–1, 1–2, ..., 9–10) — độ phân giải
  // mịn hơn xếp loại, để xem chính xác mình rơi vào khoảng điểm nào.
  const SCORE_BANDS = Array.from({ length: 10 }, (_, i) => ({ min: i, max: i + 1, label: `${i}–${i + 1}` }));
  const scoreDistribution = SCORE_BANDS.map((b) => {
    const count = allScores.filter((s) => s >= b.min && (b.max === 10 ? s <= b.max : s < b.max)).length;
    return { ...b, count, pct: allScores.length > 0 ? Math.round((count / allScores.length) * 100) : 0 };
  });
  const [scoreFilter, setScoreFilter] = useState(null); // null hoặc chỉ số band (0–9)
  const myBandIdx = Math.min(9, Math.floor(score10));
  const [distMode, setDistMode] = useState("grade"); // grade | score — chuyển đổi kiểu xem phân bố
  const [showDistPanel, setShowDistPanel] = useState(true); // phân bố điểm hiện thẳng như Rankie
  const [prevScore, setPrevScore] = useState(null); // điểm lần làm trước (để hiện tiến độ)
  const [showAnalysis, setShowAnalysis] = useState(false); // mục phân tích chi tiết (mặc định thu gọn)

  const finishDeck = () => {
    onComplete?.({
      type: "deck",
      deckMode: deck.deckMode,
      itemId: deck.id,
      title: deck.title,
      category: deck.category,
      detail: deck.deckMode === "exam" ? `${score10}/10 điểm · ${correctCount}/${gradableCount} câu đúng` : `${answeredCount} câu đã trả lời`,
      answers: { ...answers },
    });
    setSubmitted(true);
    setFreshSubmit(true);
  };

  const resetDeck = () => {
    if (deck.deckMode === "exam") setPrevScore(score10); // ghi lại điểm để so sánh lần sau
    setAnswers({});
    setStepIdx(0);
    setSubmitted(false);
    setFreshSubmit(false);
    setStarted(false);
  };

  const isOwner = deck.author?.id === "me";
  const [ownerPreview, setOwnerPreview] = useState(false);
  const [ownerShowQuestions, setOwnerShowQuestions] = useState(false);

  // INTRO
  if (!started) {
    // Chủ bài đã biết rõ nội dung & đáp án — hiện màn tổng quan quản lý thay vì bắt
    // làm bài từ đầu. Có nút "Xem trước" nếu họ vẫn muốn tự trải nghiệm như người
    // tham gia thật.
    if (isOwner && !ownerPreview) {
      return (
        <div style={{ padding: 20 }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: C.surfaceRaised, display: "grid", placeItems: "center", margin: "0 auto 12px", border: `1px solid ${C.border}` }}>
              {deck.deckMode === "exam" ? <Edit3 size={24} color={C.gold} /> : <Layers size={24} color={C.gold} />}
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, letterSpacing: 0.5, marginBottom: 6 }}>
              BÀI CỦA BẠN · TỔNG QUAN
            </div>
            <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 21, color: C.text, marginBottom: 8, lineHeight: 1.25 }}>{deck.title}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted }}>
              {deck.questions.length} câu hỏi · {fmt(deck.participants)} người đã tham gia
              {deck.deckMode === "exam" && deck.passingScore != null && <> · Điểm đạt {deck.passingScore}/10</>}
            </div>
          </div>

          <button
            onClick={() => setOwnerShowQuestions((v) => !v)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: ownerShowQuestions ? 10 : 16 }}
          >
            <BarChart3 size={15} />
            <span style={{ flex: 1, textAlign: "left" }}>Xem trước câu hỏi{deck.deckMode === "exam" ? " & đáp án đúng" : ""}</span>
            <ChevronDown size={15} style={{ transform: ownerShowQuestions ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {ownerShowQuestions && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {deck.questions.map((q, i) => (
                <div key={q.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
                  <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 8 }}>
                    {i + 1}. {q.text}
                    {deck.deckMode === "exam" && <span style={{ marginLeft: 6, color: C.textFaint, fontWeight: 500 }}>({q.points || 1}đ)</span>}
                  </div>
                  {q.votingType === "text" ? (
                    <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, fontStyle: "italic" }}>
                      Câu tự luận{q.answerKey ? ` · đáp án mẫu: ${q.answerKey}` : " · chưa có đáp án mẫu"}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {q.options.map((o) => (
                        <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 12.5, color: o.correct ? "#4ADE80" : C.textMuted }}>
                          {o.correct ? <Check size={13} color="#4ADE80" /> : <span style={{ width: 13, display: "inline-block" }} />}
                          {o.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {deck.deckMode !== "exam" && (
              <button
                onClick={() => setOwnerPreview(true)}
                style={{ width: "100%", padding: 13, borderRadius: 12, background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
              >
                Xem trước dạng người tham gia
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: C.surfaceRaised, display: "grid", placeItems: "center", margin: "0 auto 16px", border: `1px solid ${C.border}` }}>
          <Layers size={28} color={C.gold} />
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, letterSpacing: 0.5, marginBottom: 6 }}>
            {deck.deckMode === "exam" ? "RANKEV BÀI THI" : "RANKEV SURVEY"}
        </div>
        <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 23, color: C.text, marginBottom: 10, lineHeight: 1.25 }}>{deck.title}</div>
        <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
          {deck.questions.length} câu hỏi · {fmt(deck.participants)} người đã tham gia ·{" "}
          {deck.answerMode === "step" ? "trả lời từng câu" : "trả lời trên một trang"}
          {deck.deckMode === "exam" && deck.passingScore != null && <> · Điểm đạt: {deck.passingScore}</>}
        </div>
        {(deck.caption || deck.media) && (
          <div style={{ textAlign: "left", marginBottom: 20 }}>
            <PostContent caption={deck.caption} media={deck.media} clampLines={99} showMore={false} mediaHeight={190} />
          </div>
        )}
        <button
          onClick={() => setStarted(true)}
          style={{ ...primaryButton, width: "100%", padding: 15, borderRadius: 14, fontSize: 15 }}
        >
          Bắt đầu
        </button>
        {!isOwner && <LockedCommentsNotice />}
      </div>
    );
  }

  // SUBMITTED SUMMARY
  if (submitted) {
    return (
      <div style={{ padding: 16 }}>
        {deck.author && <AuthorRow author={deck.author} onOpenAuthor={undefined} />}
        <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 21, color: C.text, marginBottom: 12, lineHeight: 1.25 }}>
          {deck.title}
        </div>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          {freshSubmit && (
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 14 }}>
              {deck.deckMode === "exam" ? "Đã nộp bài!" : "Đã gửi câu trả lời!"}
            </div>
          )}

          {deck.deckMode === "exam" ? (
            <>
              {/* SECTION 1 — Kết quả chính: điểm nổi bật + Top % + số người vượt qua */}
              <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                <div style={{ animation: "popIn 0.4s ease", fontFamily: monoFont, fontWeight: 800, fontSize: 56, color: C.gold, lineHeight: 1 }}>
                  {score10}<span style={{ fontSize: 22, color: C.textFaint, fontWeight: 500 }}>/10</span>
                </div>
                {topPct != null ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "5px 14px", borderRadius: 999, background: C.goldSoft, border: `1px solid ${C.gold}` }}>
                    <span style={{ fontFamily: bodyFont, fontWeight: 800, fontSize: 14, color: C.gold }}>TOP {topPct}%</span>
                  </div>
                ) : realParticipants != null ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "5px 14px", borderRadius: 999, background: C.goldSoft, border: `1px solid ${C.gold}` }}>
                    <span style={{ fontFamily: bodyFont, fontWeight: 800, fontSize: 14, color: C.gold }}>{fmt(realParticipants)} người đã làm</span>
                  </div>
                ) : null}
                <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted, marginTop: 10 }}>
                  {beatPct != null ? (
                    <>Bạn làm tốt hơn <strong style={{ color: C.text }}>{beatPct}%</strong> người tham gia</>
                  ) : realParticipants != null && realParticipants > 1 && realAvg != null ? (
                    <>{score10 >= realAvg ? "Bạn trên mức trung bình cộng đồng 🎉" : "Bạn dưới mức trung bình — thử lại nhé"}</>
                  ) : (
                    <>Hãy là một trong những người đầu tiên hoàn thành 🎯</>
                  )}
                </div>
                {deck.passingScore != null && (
                  <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: score10 >= deck.passingScore ? "#4ADE80" : C.coral, marginTop: 6 }}>
                    {score10 >= deck.passingScore ? "✓ ĐẠT" : "CHƯA ĐẠT"} · {correctCount}/{gradableCount} câu đúng
                  </div>
                )}
              </div>

              {/* SECTION 2 — So sánh cộng đồng: điểm TB + chênh lệch của bạn */}
              <div style={{ ...cardSurface, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left" }}>
                <div>
                  <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint }}>Điểm trung bình cộng đồng</div>
                  <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 22, color: C.text, marginTop: 2 }}>{communityAvg}<span style={{ fontSize: 12, color: C.textFaint }}>/10</span></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint }}>Chênh lệch của bạn</div>
                  <div style={{ fontFamily: monoFont, fontWeight: 800, fontSize: 22, color: diffFromAvg >= 0 ? "#4ADE80" : C.coral, marginTop: 2 }}>
                    {diffFromAvg >= 0 ? "+" : ""}{diffFromAvg}
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted, marginTop: 8, textAlign: "center" }}>
                {diffFromAvg >= 0
                  ? `Bạn cao hơn trung bình ${Math.abs(diffFromAvg)} điểm 🎉`
                  : `Bạn thấp hơn trung bình ${Math.abs(diffFromAvg)} điểm — thử lại để cải thiện nhé`}
              </div>

              {/* SECTION 3 — Histogram phân bố điểm + vị trí của bạn (thay xếp loại A–F) */}
              <div style={{ ...cardSurface, marginTop: 16, textAlign: "left" }}>
                <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 14 }}>
                  Phân bố điểm · {fmt(allScores.length)} người đã thi
                </div>
                {(() => {
                  const maxCount = Math.max(...scoreDistribution.map((b) => b.count), 1);
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 110, marginBottom: 6 }}>
                        {scoreDistribution.map((b, i) => {
                          const isMine = i === myBandIdx;
                          const h = Math.max(4, (b.count / maxCount) * 74);
                          return (
                            <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                              {isMine && (
                                <div style={{ fontFamily: bodyFont, fontSize: 9.5, fontWeight: 800, color: C.gold, marginBottom: 1, whiteSpace: "nowrap" }}>▲ Bạn</div>
                              )}
                              {b.count > 0 && (
                                <div style={{ fontFamily: monoFont, fontSize: 9.5, fontWeight: 700, color: isMine ? C.gold : C.textMuted, marginBottom: 2 }}>{b.count}</div>
                              )}
                              <div style={{ width: "100%", height: h, borderRadius: 4, background: isMine ? C.gold : C.border, transition: "height 0.5s ease" }} />
                            </div>
                          );
                        })}
                      </div>
                      {/* Nhãn trục theo ranh giới: 0 ở mép trái … 10 ở mép phải (11 mốc) */}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 1px" }}>
                        {Array.from({ length: 11 }, (_, i) => (
                          <span key={i} style={{ fontFamily: monoFont, fontSize: 9.5, color: (i === myBandIdx || i === myBandIdx + 1) ? C.gold : C.textFaint, fontWeight: (i === myBandIdx || i === myBandIdx + 1) ? 800 : 400 }}>{i}</span>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* SECTION 4 — Tiến độ: chỉ hiện khi đã có lần làm trước */}
              {prevScore != null && (
                <div style={{ ...cardSurface, marginTop: 16, textAlign: "left" }}>
                  <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>Tiến bộ của bạn</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 20, color: C.textMuted }}>{prevScore}</div>
                      <div style={{ ...captionText, marginTop: 2 }}>Lần trước</div>
                    </div>
                    <ChevronRight size={18} color={C.textFaint} />
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ fontFamily: monoFont, fontWeight: 800, fontSize: 24, color: C.gold }}>{score10}</div>
                      <div style={{ ...captionText, marginTop: 2 }}>Lần này</div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ display: "inline-block", padding: "5px 12px", borderRadius: 999, background: score10 >= prevScore ? "#4ADE8018" : `${C.coral}18`, border: `1px solid ${score10 >= prevScore ? "#4ADE80" : C.coral}` }}>
                        <span style={{ fontFamily: monoFont, fontWeight: 800, fontSize: 15, color: score10 >= prevScore ? "#4ADE80" : C.coral }}>
                          {score10 - prevScore >= 0 ? "+" : ""}{Math.round((score10 - prevScore) * 10) / 10}
                        </span>
                      </div>
                      <div style={{ ...captionText, marginTop: 4 }}>{score10 >= prevScore ? "Tiến bộ 🎉" : "Cần cố gắng"}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* PHÂN TÍCH CHI TIẾT — thu gọn mặc định, mở khi người dùng muốn xem sâu */}
              <div style={{ marginTop: 16, textAlign: "left" }}>
                <button onClick={() => setShowAnalysis((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "11px 12px", borderRadius: 12, background: showAnalysis ? C.goldSoft : C.surface, border: `1px solid ${showAnalysis ? C.gold : C.border}`, color: showAnalysis ? C.gold : C.textMuted, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  <BarChart3 size={15} />
                  <span style={{ flex: 1 }}>Phân tích chi tiết</span>
                  <ChevronDown size={15} style={{ transform: showAnalysis ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>

                {showAnalysis && (() => {
                  const seed = sdHash(deck.id || deck.title || "exam");
                  const stats = deck.questions.map((q) => ({ q, s: examQuestionStats(q, seed) }));
                  const graded = stats.filter((x) => x.s);
                  const hardest = graded.length ? graded.reduce((a, b) => (b.s.correctRate < a.s.correctRate ? b : a)) : null;
                  const easiest = graded.length ? graded.reduce((a, b) => (b.s.correctRate > a.s.correctRate ? b : a)) : null;
                  const optLetter = (i) => String.fromCharCode(65 + i);
                  return (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Thống kê đề */}
                      <div style={{ ...cardSurface, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[["Người tham gia", fmt(allScores.length)], ["Điểm trung bình", communityAvg], ["Điểm cao nhất", highestScore], ["Điểm thấp nhất", lowestScore]].map(([lbl, val]) => (
                          <div key={lbl}>
                            <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 18, color: C.text }}>{val}</div>
                            <div style={{ ...captionText, marginTop: 1 }}>{lbl}</div>
                          </div>
                        ))}
                      </div>

                      {/* Câu khó & dễ nhất */}
                      {hardest && easiest && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <div style={{ flex: 1, ...cardSurface }}>
                            <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: C.coral, marginBottom: 4 }}>🔥 Khó nhất</div>
                            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textMuted }}>Câu {deck.questions.indexOf(hardest.q) + 1} · chỉ {hardest.s.correctRate}% đúng</div>
                          </div>
                          <div style={{ flex: 1, ...cardSurface }}>
                            <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: "#4ADE80", marginBottom: 4 }}>⭐ Dễ nhất</div>
                            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textMuted }}>Câu {deck.questions.indexOf(easiest.q) + 1} · {easiest.s.correctRate}% đúng</div>
                          </div>
                        </div>
                      )}

                      {/* Phân tích từng câu */}
                      {stats.map(({ q, s }, qi) => {
                        if (!s) return null;
                        const myA = answers[q.id];
                        const myIdx = q.options.findIndex((o) => (Array.isArray(myA) ? myA.includes(o.id) : myA === o.id));
                        const correct = myIdx === s.correctIdx;
                        const rare = myIdx >= 0 && s.dist[myIdx] < 15;
                        return (
                          <div key={q.id} style={{ ...cardSurface, border: `1px solid ${correct ? C.teal + "55" : C.coral + "55"}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: C.textFaint }}>Câu {qi + 1}</span>
                              <span style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: correct ? C.teal : C.coral }}>{correct ? "✓ Đúng" : "✗ Sai"} · {s.correctRate}% làm đúng</span>
                            </div>
                            <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.text, marginBottom: 10, lineHeight: 1.3 }}>{q.text}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {q.options.map((o, oi) => {
                                const isCorrect = oi === s.correctIdx;
                                const isMine = oi === myIdx;
                                return (
                                  <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontFamily: monoFont, fontSize: 11, fontWeight: 700, color: isCorrect ? C.teal : isMine ? C.coral : C.textFaint, width: 14 }}>{optLetter(oi)}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 12, marginBottom: 2 }}>
                                        <span style={{ color: isCorrect ? C.teal : isMine ? C.coral : C.textMuted, fontWeight: isCorrect || isMine ? 700 : 400 }}>
                                          {o.label}{isCorrect ? " ✓" : ""}{isMine && !isCorrect ? " · bạn chọn" : ""}
                                        </span>
                                        <span style={{ fontFamily: monoFont, color: C.textFaint }}>{s.dist[oi]}%</span>
                                      </div>
                                      <div style={{ height: 5, borderRadius: 3, background: C.surfaceRaised, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${s.dist[oi]}%`, background: isCorrect ? C.teal : isMine ? C.coral : C.border, borderRadius: 3 }} />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {rare && (
                              <div style={{ marginTop: 8, fontFamily: bodyFont, fontSize: 11.5, color: C.gold, background: C.goldSoft, borderRadius: 8, padding: "6px 10px" }}>
                                💡 Chỉ {s.dist[myIdx]}% người tham gia chọn giống bạn — một lựa chọn hiếm gặp!
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </>
          ) : freshSubmit ? (
            <div>
              <div style={{ animation: "popIn 0.4s ease", width: 56, height: 56, borderRadius: 99, background: C.goldSoft, border: `1px solid ${C.gold}`, display: "grid", placeItems: "center", margin: "0 auto 10px" }}>
                <Check size={26} color={C.gold} />
              </div>
              <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted }}>Cảm ơn bạn đã tham gia khảo sát.</div>
            </div>
          ) : null}
        </div>

        {deck.deckMode !== "exam" && (() => {
          const palette = [C.teal, C.gold, C.coral, "#8B7FD1", "#6B4E43"];
          const totalResponses = deck.questions.reduce((sum, q) => {
            const myA = answers[q.id];
            const isMine = (id) => (Array.isArray(myA) ? myA.includes(id) : myA === id);
            return sum + q.options.reduce((a, o) => a + o.votes + (isMine(o.id) ? 1 : 0), 0);
          }, 0);
          return (
            <>
              {/* Tổng quan — kiểu màn kết quả phiên trình chiếu */}
              <div style={{ ...cardSurface, marginBottom: 16, display: "flex", justifyContent: "space-around", textAlign: "center" }}>
                <div>
                  <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 26, color: C.gold }}>{fmt(deck.participants + 1)}</div>
                  <div style={{ ...captionText, marginTop: 3 }}>người tham gia</div>
                </div>
                <div style={{ width: 1, background: C.border }} />
                <div>
                  <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 26, color: C.teal }}>{fmt(totalResponses)}</div>
                  <div style={{ ...captionText, marginTop: 3 }}>lượt trả lời</div>
                </div>
                <div style={{ width: 1, background: C.border }} />
                <div>
                  <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 26, color: C.text }}>{deck.questions.length}</div>
                  <div style={{ ...captionText, marginTop: 3 }}>câu hỏi</div>
                </div>
              </div>

              {deck.questions.map((q, qi) => {
                const myA = answers[q.id];
                const isMine = (id) => (Array.isArray(myA) ? myA.includes(id) : myA === id);
                // Cộng lượt chọn của CHÍNH BẠN vào phân bố để số liệu phản ánh cả bạn.
                const augOpts = q.options.map((o) => ({ ...o, votes: o.votes + (isMine(o.id) ? 1 : 0) }));
                const qTotal = augOpts.reduce((s, o) => s + o.votes, 0) || 1;
                const sortedQ = [...augOpts].sort((a, b) => b.votes - a.votes);
                return (
                  <div key={q.id} style={{ ...cardSurface, marginBottom: 12 }}>
                    <div style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: C.textFaint, marginBottom: 6 }}>
                      Câu {qi + 1} · {q.votingType === "multiple" ? "Chọn nhiều" : q.votingType === "rating" ? "Đánh giá" : "Chọn một"}
                    </div>
                    <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 14, lineHeight: 1.3 }}>{q.text}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {sortedQ.map((o, i) => {
                        const pct = Math.round((o.votes / qTotal) * 1000) / 10;
                        const isTop = i === 0;
                        const mine = isMine(o.id);
                        return (
                          <div key={o.id}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontFamily: bodyFont, fontSize: 13.5 }}>
                              <span style={{ color: isTop || mine ? C.text : C.textMuted, fontWeight: isTop || mine ? 700 : 500 }}>
                                {isTop && "🥇 "}{o.label}{mine ? " · bạn chọn" : ""}
                              </span>
                              <span style={{ color: mine ? C.gold : palette[i % 5], fontFamily: monoFont, fontWeight: 700 }}>{pct}% <span style={{ color: C.textFaint, fontWeight: 400, fontSize: 11 }}>({fmt(o.votes)})</span></span>
                            </div>
                            <div style={{ height: 22, borderRadius: 8, background: C.surfaceRaised, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: mine ? C.gold : palette[i % 5], borderRadius: 8, transition: "width 0.6s cubic-bezier(.22,1,.36,1)" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()}

        {deck.deckMode === "exam" && (
        <>
        {/* Chi tiết từng câu (chỉ Exam) — thu gọn mặc định để giữ màn kết quả gọn gàng */}
        <button
          onClick={() => setShowQuestionDetail((v) => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", background: "none", border: "none", borderTop: `1px solid ${C.border}`, borderBottom: showQuestionDetail ? "none" : `1px solid ${C.border}`, color: C.teal, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          {showQuestionDetail ? "Ẩn chi tiết từng câu" : "Xem chi tiết từng câu"}
          <ChevronDown size={15} style={{ transform: showQuestionDetail ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </button>
        {showQuestionDetail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            {deck.questions.map((q, i) => {
              const { correct, earned, max } = scoreQuestion(q);
              return (
                <div key={q.id} style={{ background: C.surface, border: `1px solid ${deck.deckMode === "exam" ? (correct ? C.teal + "55" : C.coral + "55") : C.border}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                    <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, color: C.text, flex: 1 }}>
                      {i + 1}. {q.text}
                    </div>
                    {deck.deckMode === "exam" && (
                      <span style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 700, color: correct ? C.teal : C.coral, flexShrink: 0 }}>
                        {earned}/{max}đ
                      </span>
                    )}
                  </div>
                  <DeckQuestion q={q} answer={answers[q.id]} onAnswer={() => {}} showResults graded={deck.deckMode === "exam"} />
                </div>
              );
            })}
          </div>
        )}
        </>
        )}

        {/* Làm lại — chỉ Survey mới cho làm lại tự do; Exam có tính điểm nên vẫn cho phép
            nhưng không tự động ghi đè lịch sử tham gia trước đó cho tới khi nộp lại. */}
        <button
          onClick={resetDeck}
          style={{ width: "100%", marginTop: 20, padding: 13, borderRadius: 12, background: C.surfaceRaised, border: `1px solid ${C.border}`, color: C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <ArchiveRestore size={15} /> Làm lại
        </button>

        <div style={{ marginTop: 24 }}>
          <EngagementBar type="deck" joined participants={deck.participants} comments={deck.comments} shares={deck.shares || 0} />
        </div>

        {/* Comments — same component as Rankie/Path, but tags reference question number instead of an answer option */}
        <div style={{ marginTop: 18, borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
          <CommentsSection
            postId={deck.id}
            initialComments={deck.deckComments || []}
            supportOptions={deck.questions.map((q, qi) => ({ id: q.id, label: `Câu ${qi + 1}`, color: [C.teal, C.gold, C.coral, "#8B7FD1", "#6B4E43"][qi % 5] }))}
            getSupportLabel={(id) => {
              const qi = deck.questions.findIndex((q) => q.id === id);
              if (qi === -1) return null;
              return { label: `Câu ${qi + 1}`, color: [C.teal, C.gold, C.coral, "#8B7FD1", "#6B4E43"][qi % 5] };
            }}
            promptLabel="Nhắc đến câu hỏi nào? (chọn nhiều, hoặc để trung lập)"
            supportPrefix="về:"
            placeholder={deck.deckMode === "exam" ? "VD: Câu này khó quá #4" : "VD: Ý kiến của bạn về câu 2"}
          />
        </div>
      </div>
    );
  }

  // STEP MODE — one question at a time
  if (deck.answerMode === "step") {
    const q = deck.questions[stepIdx];
    const isLast = stepIdx === deck.questions.length - 1;
    const hasAnswer = (() => {
      const a = answers[q.id];
      return Array.isArray(a) ? a.length > 0 : a != null && a !== 0;
    })();
    const progress = Math.round(((stepIdx + (hasAnswer ? 1 : 0)) / deck.questions.length) * 100);
    return (
      <div style={{ padding: 20 }}>
        <div style={{ height: 6, background: C.surfaceRaised, borderRadius: 3, marginBottom: 8, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: C.teal, transition: "width 0.3s ease", borderRadius: 3 }} />
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, marginBottom: 18 }}>
          Câu {stepIdx + 1} / {deck.questions.length}
        </div>
        <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 20, lineHeight: 1.3 }}>
          {q.text}
        </div>
        <DeckQuestion q={q} answer={answers[q.id]} onAnswer={(v) => setAnswer(q.id, v)} />
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {stepIdx > 0 && (
            <button
              onClick={() => setStepIdx((s) => s - 1)}
              style={{ flex: 1, padding: 14, borderRadius: 12, background: C.surfaceRaised, border: `1px solid ${C.border}`, color: C.text, fontFamily: bodyFont, fontWeight: 600, cursor: "pointer" }}
            >
              Quay lại
            </button>
          )}
          <button
            onClick={() => (isLast ? finishDeck() : setStepIdx((s) => s + 1))}
            disabled={!hasAnswer}
            style={{
              flex: 2,
              padding: 14,
              borderRadius: 12,
              border: "none",
              background: hasAnswer ? C.gold : C.surfaceRaised,
              color: hasAnswer ? "#1A1305" : C.textFaint,
              fontFamily: bodyFont,
              fontWeight: 700,
              cursor: hasAnswer ? "pointer" : "not-allowed",
            }}
          >
            {isLast ? "Gửi" : "Tiếp theo"}
          </button>
        </div>
      </div>
    );
  }

  // SCROLL MODE — all questions on one page
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, marginBottom: 16 }}>
        Đã trả lời {answeredCount}/{deck.questions.length} câu
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {deck.questions.map((q, i) => (
          <div key={q.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14.5, color: C.text, marginBottom: 12 }}>
              {i + 1}. {q.text}
            </div>
            <DeckQuestion q={q} answer={answers[q.id]} onAnswer={(v) => setAnswer(q.id, v)} />
          </div>
        ))}
      </div>
      <button
        onClick={finishDeck}
        disabled={answeredCount === 0}
        style={{
          width: "100%",
          padding: 15,
          borderRadius: 12,
          border: "none",
          background: answeredCount ? C.gold : C.surfaceRaised,
          color: answeredCount ? "#1A1305" : C.textFaint,
          fontFamily: bodyFont,
          fontWeight: 700,
          fontSize: 15,
          cursor: answeredCount ? "pointer" : "not-allowed",
          marginTop: 20,
        }}
      >
        Gửi tất cả
      </button>
    </div>
  );
}

// Deck shown as a post in the feed
function DeckCard({ deck, onOpen, onOpenAuthor, menuSlot, hideCategory, onShare, joined = false, sessionCount = 0, sessionList = [], onSeeAllSessions, onOpenSession, bookmarked = false, onToggleBookmark, myResult, rankTier = 0, onSetRank, fanCount = 0 }) {
  const badgeLabel = deck.deckMode === "exam" ? "EXAM" : "SURVEY";
  const examTime = deck.deckMode === "exam" && deck.examDurationMinutes != null ? fmtExamDuration(deck.examDurationMinutes) : null;
  const badge = (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {examTime && <Pill tone="muted"><Clock size={11} /> {examTime}</Pill>}
      <Pill tone="gold">{deck.deckMode === "exam" ? <Edit3 size={11} /> : <Layers size={11} />} {badgeLabel}</Pill>
    </div>
  );
  return (
    <div
      onClick={onOpen}
      style={{ ...cardSurface, cursor: "pointer", animation: "popIn 0.3s ease" }}
    >
      {deck.author ? (
        <AuthorRow author={deck.author} onOpenAuthor={onOpenAuthor} rightSlot={<>{menuSlot}{badge}</>} rankTier={rankTier} onSetRank={onSetRank} fanCount={fanCount} />
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          {badge}
        </div>
      )}
      {!hideCategory && (
        <div style={{ marginBottom: 10 }}>
          <Pill tone="muted">{deck.category}</Pill>
        </div>
      )}
      <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 18, color: C.text, marginBottom: 12 }}>{deck.title}</div>

      {myResult?.detail ? (
        // Đã tham gia — hiện kết quả gần nhất của chính mình, giống Rankie/Path
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: C.goldSoft, border: `1px solid ${C.gold}55`, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.surface, display: "grid", placeItems: "center", flexShrink: 0 }}>
            {deck.deckMode === "exam" ? <Edit3 size={17} color={C.gold} /> : <Layers size={17} color={C.gold} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint }}>
              Kết quả gần nhất của bạn
            </div>
            <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 14, color: C.text }}>{myResult.detail}</div>
          </div>
        </div>
      ) : deck.caption || deck.media ? (
        <PostContent caption={deck.caption} media={deck.media} mediaHeight={170} />
      ) : (
        // Neutral summary strip — intentionally hides question content to avoid spoilers
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: C.surfaceRaised, border: `1px solid ${C.border}`, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.goldSoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Layers size={18} color={C.gold} />
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted, lineHeight: 1.35 }}>
            {deck.deckMode === "exam" ? `📝 ${deck.questions.length} câu · Bài thi có chấm điểm` : `Bộ ${deck.questions.length} câu hỏi · nhấn để xem giới thiệu và tham gia`}
          </div>
        </div>
      )}

      <EngagementBar
        type={deck.deckMode === "exam" ? "exam" : "survey"}
        joined={joined}
        participants={deck.participants}
        comments={deck.comments}
        shares={deck.shares || 0}
        sessionCount={sessionCount}
        sessionList={sessionList}
        onSeeAllSessions={onSeeAllSessions}
        onOpenSession={onOpenSession}
        bookmarked={bookmarked}
        onJoinClick={onOpen}
        onCommentClick={onOpen}
        onShareClick={() => onShare?.(deck)}
        onBookmarkClick={() => onToggleBookmark?.(deck)}
      />
    </div>
  );
}

// A "share" post: the sharer's own caption on top, with a compact reference card
// pointing back at whatever they shared (Rankie/Path/Deck). Tapping anywhere opens
// the original item — a share has no content of its own to view.
function SharedPostCard({ post, onOpen, onOpenAuthor, menuSlot }) {
  const typeLabel = { rankie: "Rankie", path: "Path", deck: "Deck" }[post.sharedType] || "bài đăng";
  const visIcon = post.visibility === "private" ? Lock : post.visibility === "unlisted" ? Link2 : Globe;
  const VisIcon = visIcon;
  return (
    <div onClick={onOpen} style={{ ...cardSurface, cursor: "pointer", animation: "popIn 0.3s ease" }}>
      <AuthorRow
        author={post.author}
        onOpenAuthor={onOpenAuthor}
        rightSlot={
          <>
            {menuSlot}
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.textFaint }}>
              <VisIcon size={12} />
            </span>
          </>
        }
      />
      {post.caption && (
        <div style={{ fontFamily: bodyFont, fontSize: 14, color: C.text, marginBottom: 12, lineHeight: 1.4 }}>
          {post.caption}
        </div>
      )}
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, background: C.surfaceRaised }}>
        <Pill tone="gold">Đã chia sẻ · {typeLabel}</Pill>
        <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 15, color: C.text, marginTop: 8 }}>
          {post.sharedTitle}
        </div>
        {post.sharedCategory && (
          <div style={{ ...captionText, marginTop: 4 }}>{post.sharedCategory}</div>
        )}
      </div>
    </div>
  );
}

// ---------- DECK PRESENTER (live check, one question at a time) ----------
// ---------- EXAM PRESENTER VIEW ----------
function ExamPresenterView({ deck, onBack, onShareToProfile, contacts, onSessionEnd }) {
  const [phase, setPhase] = useState("setup"); // setup | waiting | live | results
  const [durationMinutes, setDurationMinutes] = useState(deck.examDurationMinutes !== undefined ? deck.examDurationMinutes : 10);
  const [passingScore, setPassingScore] = useState(deck.passingScore || 5);
  const [participants, setParticipants] = useState([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [gradeFilter, setGradeFilter] = useState("all"); // all | A | B | C | D | F
  const [sortBy, setSortBy] = useState("score"); // score | name | time
  const [expandedId, setExpandedId] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [csvDone, setCsvDone] = useState(false);
  const [presenterSessionName, setPresenterSessionName] = useState("");
  const [presenterSessionSaved, setPresenterSessionSaved] = useState(false);
  const { remainingSec, expired } = useCountdown(durationMinutes, phase === "live");

  const JOINING_NAMES = ["Minh Khoa","Lan Anh","Tuấn Anh","Hà My","Quang Huy","Thu Trang","Bảo Long","Yến Nhi","Đức Khải","Kim Ngân","Hoài Nam","Phương Linh","Trọng Nghĩa","Gia Hân","Nhật Minh","Mỹ Linh","Văn Toàn","Thùy Dung","Hữu Đức","Ngọc Mai"];

  // Simulate people joining waiting room
  useEffect(() => {
    if (phase !== "waiting") return;
    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= JOINING_NAMES.length) { clearInterval(iv); return; }
      const name = JOINING_NAMES[idx++];
      setParticipants((prev) => [...prev, { id: "p" + idx, name, status: "waiting", score10: null, answers: {} }]);
    }, 700);
    return () => clearInterval(iv);
  }, [phase]);

  // When time runs out or host ends → generate results
  useEffect(() => {
    if ((expired || sessionEnded) && phase === "live") {
      setPhase("results");
      const results = genParticipants(deck);
      setParticipants(results);
    }
  }, [expired, sessionEnded]);

  const maxPts = deck.questions.reduce((s, q) => s + (q.points || 1), 0) || 1;

  // --- filtered / sorted participant list for results ---
  const gradeGroups = {};
  GRADE_SCALE.forEach((g) => { gradeGroups[g.grade] = 0; });
  participants.forEach((p) => {
    if (p.score10 != null) { const g = getGrade(p.score10); gradeGroups[g.grade] = (gradeGroups[g.grade] || 0) + 1; }
  });

  const filtered = participants
    .filter((p) => p.score10 != null)
    .filter((p) => gradeFilter === "all" || getGrade(p.score10).grade === gradeFilter)
    .sort((a, b) => sortBy === "name" ? a.name.localeCompare(b.name) : sortBy === "time" ? a.submittedAt - b.submittedAt : b.score10 - a.score10);

  // Confirm/override the score for one essay (tự luận) answer, then recompute
  // that participant's overall score10 from all questions' points.
  const setEssayScore = (participantId, qId, newScore) => {
    setParticipants((prev) => prev.map((p) => {
      if (p.id !== participantId) return p;
      const nextEssay = { ...(p.essay || {}), [qId]: { ...(p.essay?.[qId] || {}), score: newScore, confirmed: true } };
      let totalPts = 0;
      deck.questions.forEach((q) => {
        const pts = q.points || 1;
        if (q.votingType === "text") {
          totalPts += nextEssay[q.id]?.score || 0;
        } else {
          const correctIds = q.options.filter((o) => o.correct).map((o) => o.id);
          const ans = p.answers[q.id];
          const ansArr = Array.isArray(ans) ? ans : ans ? [ans] : [];
          const isCorrect = correctIds.length > 0 && correctIds.every((id) => ansArr.includes(id)) && ansArr.every((id) => correctIds.includes(id));
          if (isCorrect) totalPts += pts;
        }
      });
      const score10 = maxPts > 0 ? Math.round((totalPts / maxPts) * 100) / 10 : 0;
      return { ...p, essay: nextEssay, score10 };
    }));
  };

  const handleExportCSV = () => {
    const rows = [["Họ tên","Điểm (10)","Xếp loại","Điểm tuyệt đối","Tổng điểm"]];
    participants.forEach((p) => {
      if (p.score10 == null) return;
      const g = getGrade(p.score10);
      rows.push([p.name, p.score10, `${g.grade} - ${g.label}`, Math.round(p.score10 * maxPts / 10 * 10)/10, maxPts]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${deck.title.replace(/\s+/g,"_")}_ket_qua_thi.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    setCsvDone(true); setTimeout(() => setCsvDone(false), 2200);
  };

  // ---- SETUP ----
  if (phase === "setup") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        <TopBar title="Chuẩn bị bài thi" onBack={onBack} />
        <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.text, lineHeight: 1.3 }}>{deck.title}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted }}>
            {deck.questions.length} câu · Tổng {maxPts} điểm · Người tham gia làm bài qua QR / link
          </div>

          {/* Duration */}
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>Thời lượng làm bài</div>
            <DurationPicker value={durationMinutes} onChange={setDurationMinutes} />
          </div>

          {/* Passing score — free text input, e.g. "7,5/10" */}
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>Điểm đạt (thang 10)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number" min={0} max={10} step={0.1}
                value={passingScore}
                onChange={(e) => setPassingScore(Math.max(0, Math.min(10, parseFloat(e.target.value.replace(",", ".")) || 0)))}
                style={{ width: 84, padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.gold, fontFamily: monoFont, fontWeight: 700, fontSize: 15, textAlign: "center" }}
              />
              <span style={{ fontFamily: bodyFont, fontSize: 13, color: C.textFaint }}>/ 10 — ví dụ 7,5</span>
            </div>
          </div>

          {/* Question overview */}
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>Tổng quan câu hỏi</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {deck.questions.map((q, qi) => {
                const correct = q.options.filter((o) => o.correct);
                const typeLabel = q.votingType === "text" ? "Tự luận" : correct.length > 1 ? "Nhiều đáp án" : "1 đáp án";
                return (
                  <div key={q.id} style={{ ...cardSurface, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: bodyFont, fontSize: 13, color: C.text }}>Câu {qi+1}: {q.text.slice(0,40)}{q.text.length > 40 ? "…" : ""}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {q.votingType !== "text" && <span style={{ fontFamily: monoFont, fontSize: 11, color: C.gold, fontWeight: 700 }}>{q.points||1}đ</span>}
                      <span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.teal }}>{typeLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => setPhase("waiting")} style={{ ...primaryButton, width: "100%", padding: 15, borderRadius: 14, fontSize: 15 }}>
            Mở phòng chờ
          </button>
        </div>
      </div>
    );
  }

  // ---- WAITING ROOM ----
  if (phase === "waiting") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 13, fontWeight: 600 }}>
            <ChevronLeft size={18} /> Thoát
          </button>
          <Pill tone="live"><span style={{ width: 6, height: 6, borderRadius: 99, background: C.teal, display: "inline-block" }} /> PHÒNG CHỜ</Pill>
        </div>

        <div style={{ flex: 1, padding: "20px 18px", display: "flex", flexDirection: "column" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 4 }}>{deck.title}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted }}>{deck.questions.length} câu · {durationMinutes} phút · Tổng {maxPts} điểm</div>
          </div>

          {/* QR */}
          <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "center", marginBottom: 20, padding: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14 }}>
            <div style={{ width: 90, height: 90, background: "#fff", borderRadius: 8, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <QrCode size={68} color="#111" />
            </div>
            <div>
              <div style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>Quét để vào phòng thi</div>
              <div style={{ fontFamily: monoFont, fontSize: 12, color: C.teal, fontWeight: 700 }}>rankev.app/exam/{deck.id}</div>
            </div>
          </div>

          {/* Participant count */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 32, color: C.gold }}>{participants.length}</div>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, marginTop: 3 }}>người đã vào phòng chờ</div>
            </div>
          </div>

          {/* Name list */}
          {participants.length > 0 && (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: C.textFaint, marginBottom: 8 }}>DANH SÁCH ({participants.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                {participants.map((p) => (
                  <div key={p.id} style={{
                    padding: "5px 12px", borderRadius: 999,
                    background: C.goldSoft, border: `1px solid ${C.gold}`,
                    fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600, color: C.gold,
                    animation: "popIn 0.2s ease",
                  }}>
                    {p.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { setPhase("live"); }}
            style={{ ...primaryButton, width: "100%", padding: 15, borderRadius: 14, fontSize: 15, marginTop: 16 }}
          >
            Bắt đầu bài thi ({participants.length} người)
          </button>
          <div style={{ marginTop: 10, fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, textAlign: "center", lineHeight: 1.4 }}>
            Đồng hồ chỉ chạy sau khi bạn bấm nút này.
          </div>
        </div>
      </div>
    );
  }

  // ---- LIVE (host view — shows aggregate progress) ----
  if (phase === "live") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 13, fontWeight: 600 }}>
            <ChevronLeft size={18} /> Thoát
          </button>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Pill tone="muted"><Users size={11} /> {participants.length}</Pill>
            <CountdownBadge remainingSec={remainingSec} expired={expired} />
            <Pill tone="live"><span style={{ width: 6, height: 6, borderRadius: 99, background: C.teal, display: "inline-block" }} /> ĐANG THI</Pill>
          </div>
        </div>

        <div style={{ flex: 1, padding: "24px 18px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 6, lineHeight: 1.3 }}>{deck.title}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted, marginBottom: 32 }}>{deck.questions.length} câu · Tổng {maxPts} điểm</div>

          {/* Live counter */}
          <div style={{ display: "flex", gap: 28, justifyContent: "center", marginBottom: 36 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 42, color: C.gold, lineHeight: 1 }}>{participants.length}</div>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, marginTop: 4 }}>người tham gia</div>
            </div>
          </div>

          <div style={{ fontFamily: bodyFont, fontSize: 14, color: C.textMuted, marginBottom: 28 }}>
            🧑‍💻 Người tham gia đang làm bài trên thiết bị của họ.<br />Kết quả sẽ hiện sau khi bài thi kết thúc.
          </div>

          {/* QR reminder */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 28, width: "100%", maxWidth: 320 }}>
            <div style={{ width: 64, height: 64, background: "#fff", borderRadius: 8, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <QrCode size={48} color="#111" />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.text }}>Vào muộn? Vẫn quét được</div>
              <div style={{ fontFamily: monoFont, fontSize: 12, color: C.teal }}>rankev.app/exam/{deck.id}</div>
            </div>
          </div>
        </div>

        {/* End button */}
        <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => setSessionEnded(true)}
            style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: C.coral, color: "#fff", fontFamily: bodyFont, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <ChevronsDown size={16} /> Kết thúc bài thi &amp; Xem kết quả
          </button>
        </div>
      </div>
    );
  }

  // ---- RESULTS ----
  const gradedCount = participants.filter((p) => p.score10 != null).length;
  const avgScore = participants.length > 0 ? Math.round(participants.reduce((s, p) => s + (p.score10 || 0), 0) / participants.length * 10) / 10 : 0;
  const passCount = participants.filter((p) => (p.score10 || 0) >= passingScore).length;
  const failCount = Math.max(gradedCount - passCount, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 13, fontWeight: 600 }}>
          <ChevronLeft size={18} /> Đóng
        </button>
        <Pill tone="muted">KẾT QUẢ BÀI THI</Pill>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px" }}>
        {/* Summary row */}
        <div style={{ ...cardSurface, marginBottom: 16, display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 26, color: C.gold }}>{participants.length}</div>
            <div style={{ ...captionText, marginTop: 2 }}>người thi</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div>
            <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 26, color: C.teal }}>{avgScore}</div>
            <div style={{ ...captionText, marginTop: 2 }}>điểm TB</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div>
            <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 26, color: "#4ADE80" }}>{passCount}</div>
            <div style={{ ...captionText, marginTop: 2 }}>đạt ≥{passingScore}đ</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div>
            <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 26, color: C.coral }}>{failCount}</div>
            <div style={{ ...captionText, marginTop: 2 }}>không đạt</div>
          </div>
        </div>

        {/* Grade distribution — public filter (thí sinh chỉ thấy số lượng mỗi loại) */}
        <div style={{ ...cardSurface, marginBottom: 16 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textFaint, marginBottom: 12 }}>PHÂN LOẠI KẾT QUẢ</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <button onClick={() => setGradeFilter("all")}
              style={{ padding: "6px 14px", borderRadius: 99, border: `1px solid ${gradeFilter === "all" ? C.gold : C.border}`, background: gradeFilter === "all" ? C.goldSoft : C.surface, color: gradeFilter === "all" ? C.gold : C.textMuted, fontFamily: bodyFont, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Tất cả ({participants.filter(p => p.score10 != null).length})
            </button>
            {GRADE_SCALE.map((g) => {
              const cnt = gradeGroups[g.grade] || 0;
              if (cnt === 0) return null;
              return (
                <button key={g.grade} onClick={() => setGradeFilter(g.grade)}
                  style={{ padding: "6px 14px", borderRadius: 99, border: `1px solid ${gradeFilter === g.grade ? g.color : C.border}`, background: gradeFilter === g.grade ? g.color + "22" : C.surface, color: gradeFilter === g.grade ? g.color : C.textMuted, fontFamily: bodyFont, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  {g.grade} · {g.label} ({cnt})
                </button>
              );
            })}
          </div>
          {/* Bar chart of grade distribution */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 64 }}>
            {GRADE_SCALE.map((g) => {
              const cnt = gradeGroups[g.grade] || 0;
              const max = Math.max(...Object.values(gradeGroups), 1);
              const pct = Math.round((cnt / max) * 100);
              return (
                <div key={g.grade} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontFamily: monoFont, fontSize: 11, fontWeight: 700, color: g.color }}>{cnt}</div>
                  <div style={{ width: "100%", height: `${Math.max(pct * 0.52, 4)}px`, background: g.color, borderRadius: "4px 4px 0 0", opacity: gradeFilter === "all" || gradeFilter === g.grade ? 1 : 0.25, transition: "opacity 0.2s" }} />
                  <div style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: g.color }}>{g.grade}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sort controls */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[{id:"score",label:"Điểm cao nhất"},{id:"name",label:"Tên A→Z"},{id:"time",label:"Nộp sớm nhất"}].map((s) => (
            <button key={s.id} onClick={() => setSortBy(s.id)}
              style={{ padding: "6px 12px", borderRadius: 99, border: `1px solid ${sortBy === s.id ? C.gold : C.border}`, background: sortBy === s.id ? C.goldSoft : C.surface, color: sortBy === s.id ? C.gold : C.textMuted, fontFamily: bodyFont, fontWeight: 600, fontSize: 11.5, cursor: "pointer" }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Participant list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((p, idx) => {
            const grade = getGrade(p.score10);
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} style={{ background: C.surface, border: `1px solid ${isExpanded ? grade.color : C.border}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s" }}>
                {/* Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}
                >
                  <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 14, color: C.textFaint, width: 22, textAlign: "center" }}>
                    {sortBy === "score" ? `#${idx + 1}` : ""}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 14, color: C.text }}>{p.name}</div>
                    <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, marginTop: 1 }}>
                      {Math.round(p.score10 * maxPts / 10 * 10)/10}/{maxPts} điểm
                    </div>
                  </div>
                  {/* Score badge */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: monoFont, fontWeight: 800, fontSize: 20, color: grade.color, lineHeight: 1 }}>{p.score10}</div>
                    <div style={{ fontFamily: bodyFont, fontSize: 11, color: grade.color, fontWeight: 700, marginTop: 2 }}>{grade.grade} · {grade.label}</div>
                  </div>
                  <ChevronDown size={14} color={C.textFaint} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 14px", background: C.surfaceRaised }}>
                    <div style={{ fontFamily: bodyFont, fontSize: 11.5, fontWeight: 700, color: C.textFaint, marginBottom: 10 }}>CHI TIẾT BÀI LÀM</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {deck.questions.map((q, qi) => {
                        const ans = p.answers[q.id];
                        if (q.votingType === "text") {
                          const pts = q.points || 1;
                          const eScore = p.essay?.[q.id];
                          return (
                            <div key={q.id}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                                <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 12.5, color: C.text }}>
                                  Câu {qi+1}: {q.text.slice(0,50)}{q.text.length>50?"…":""}
                                  <span style={{ marginLeft: 6, fontFamily: bodyFont, fontSize: 10, fontWeight: 700, color: C.textFaint }}>· TỰ LUẬN</span>
                                </span>
                              </div>
                              <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textMuted, fontStyle: "italic", padding: "8px 10px", borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                                {ans || "(chưa trả lời)"}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                {eScore?.estimated && !eScore.confirmed && (
                                  <span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.teal, background: `${C.teal}18`, border: `1px solid ${C.teal}40`, borderRadius: 99, padding: "3px 9px" }}>
                                    🤖 Gợi ý AI: {eScore.score}/{pts}đ
                                  </span>
                                )}
                                {eScore?.confirmed && (
                                  <span style={{ fontFamily: bodyFont, fontSize: 10.5, color: "#4ADE80", background: "#4ADE8018", border: "1px solid #4ADE8040", borderRadius: 99, padding: "3px 9px", display: "flex", alignItems: "center", gap: 4 }}>
                                    <Check size={10} strokeWidth={3} /> Đã chốt: {eScore.score}/{pts}đ
                                  </span>
                                )}
                                {!q.answerKey && (
                                  <span style={{ ...captionText }}>Chưa có đáp án mẫu — chấm thủ công bên dưới.</span>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                                  <input
                                    type="number" min={0} max={pts} step={0.1}
                                    defaultValue={eScore?.score || 0}
                                    onBlur={(e) => setEssayScore(p.id, q.id, Math.max(0, Math.min(pts, parseFloat(e.target.value.replace(",", ".")) || 0)))}
                                    style={{ width: 52, padding: "5px 8px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.gold, fontFamily: monoFont, fontWeight: 700, fontSize: 12.5, textAlign: "center" }}
                                  />
                                  <span style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint }}>/{pts}đ</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        const correctIds = q.options.filter((o) => o.correct).map((o) => o.id);
                        const ansArr = Array.isArray(ans) ? ans : ans ? [ans] : [];
                        const isCorrect = correctIds.length > 0 && correctIds.every((id) => ansArr.includes(id)) && ansArr.every((id) => correctIds.includes(id));
                        const pts = q.points || 1;
                        const qColor = isCorrect ? C.teal : C.coral;
                        return (
                          <div key={q.id}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                              <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 12.5, color: C.text }}>
                                Câu {qi+1}: {q.text.slice(0,50)}{q.text.length>50?"…":""}
                              </span>
                              <span style={{ fontFamily: monoFont, fontSize: 11, color: qColor, fontWeight: 700, flexShrink: 0, marginLeft: 6 }}>
                                {isCorrect ? `+${pts}` : "0"}/{pts}đ
                              </span>
                            </div>
                            {/* Show chosen vs correct with clear check/cross icons — standard quiz review convention */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                              {q.options.map((o) => {
                                const chosen = ansArr.includes(o.id);
                                const correct = o.correct;
                                if (!chosen && !correct) return null;
                                const wrongPick = chosen && !correct;
                                const pillColor = wrongPick ? C.coral : C.teal;
                                return (
                                  <div key={o.id} style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    fontFamily: bodyFont, fontSize: 11.5, color: pillColor,
                                    padding: "5px 10px", borderRadius: 8,
                                    background: `${pillColor}14`, border: `1px solid ${pillColor}40`,
                                  }}>
                                    <span style={{ width: 16, height: 16, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center", background: pillColor }}>
                                      {wrongPick ? <X size={10} strokeWidth={3} color="#fff" /> : <Check size={10} strokeWidth={3} color="#fff" />}
                                    </span>
                                    <span>{o.label}{correct && !chosen ? " — đáp án đúng" : wrongPick ? " — bạn đã chọn" : ""}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action panel */}
      <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
        {!presenterSessionSaved ? (
          <>
            <input
              type="text"
              value={presenterSessionName}
              onChange={(e) => setPresenterSessionName(e.target.value)}
              placeholder="Đặt tên phiên (VD: Lớp 10A1 · buổi sáng)"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontSize: 16 }}
            />
            <button
              onClick={() => {
                onSessionEnd?.({ name: presenterSessionName.trim() || `Phiên ${new Date().toLocaleString("vi-VN")}`, endedAt: Date.now(), participants: participants.length, avgScore });
                setPresenterSessionSaved(true);
              }}
              style={{ padding: 13, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Monitor size={16} /> Lưu phiên trình chiếu
            </button>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 10, color: C.gold, fontFamily: bodyFont, fontWeight: 700, fontSize: 13 }}>
            <Check size={16} /> Đã lưu phiên "{presenterSessionName.trim() || "không tên"}"
          </div>
        )}
        <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, textAlign: "center" }}>
          Muốn công bố kết quả? Dùng icon Chia sẻ ngay trên bài thi này.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleExportCSV}
            style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${csvDone ? C.teal : C.border}`, background: C.surface, color: csvDone ? C.teal : C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}>
            {csvDone ? <Check size={14} /> : <Download size={14} />} {csvDone ? "Đã xuất!" : "Xuất CSV"}
          </button>
          <button onClick={() => setShareOpen(true)}
            style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <FbShareIcon size={14} color={C.text} /> Chia sẻ
          </button>
        </div>
      </div>

      {shareOpen && (
        <ShareModal item={{ ...deck, title: `[Kết quả thi] ${deck.title}` }} onClose={() => setShareOpen(false)} onShareToProfile={onShareToProfile || (() => {})} contacts={contacts ?? []} />
      )}
    </div>
  );
}

function DeckPresenterView({ deck, onBack, onShareToProfile, contacts, onSessionEnd }) {
  const [phase, setPhase] = useState("setup"); // setup -> waiting -> live -> results
  const [durationMinutes, setDurationMinutes] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [csvCopied, setCsvCopied] = useState(false);
  const [imgSaved, setImgSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [presenterSessionName, setPresenterSessionName] = useState("");
  const [presenterSessionSaved, setPresenterSessionSaved] = useState(false);

  // Live vote counts per question
  const [counts, setCounts] = useState(() =>
    deck.questions.map((q) => Object.fromEntries(q.options.map((o) => [o.id, o.votes])))
  );
  const { remainingSec, expired } = useCountdown(durationMinutes, phase === "live");

  const q = deck.questions[qIdx];
  const qCounts = counts[qIdx];
  const total = Object.values(qCounts).reduce((s, v) => s + v, 0) || 1;
  const sortedOpts = [...q.options].sort((a, b) => qCounts[b.id] - qCounts[a.id]);
  const COLORS = [C.teal, C.gold, C.coral, "#8B7FD1", "#6B4E43"];

  // Simulate participants joining
  useEffect(() => {
    if (phase === "setup") return;
    const iv = setInterval(() => {
      setParticipantCount((n) => n + (phase === "waiting" ? Math.ceil(Math.random() * 4) : Math.random() < 0.12 ? 1 : 0));
    }, 850);
    return () => clearInterval(iv);
  }, [phase]);

  // Simulate live responses
  useEffect(() => {
    if (phase !== "live" || expired || sessionEnded) return;
    const iv = setInterval(() => {
      setCounts((prev) => {
        const next = prev.map((c) => ({ ...c }));
        const opts = deck.questions[qIdx].options;
        const pick = opts[Math.floor(Math.random() * opts.length)];
        next[qIdx][pick.id] += Math.ceil(Math.random() * 5);
        return next;
      });
    }, 1100);
    return () => clearInterval(iv);
  }, [qIdx, deck.questions, phase, expired, sessionEnded]);

  // Auto-reveal when time runs out
  useEffect(() => { if (expired) setRevealed(true); }, [expired]);

  const totalResponses = counts.reduce((s, c) => s + Object.values(c).reduce((a, b) => a + b, 0), 0);

  // Export CSV — one section per question
  const handleExportCSV = () => {
    const rows = [["Câu hỏi", "Phương án", "Lượt chọn", "Tỷ lệ (%)"]];
    deck.questions.forEach((q, qi) => {
      const qTotal = Object.values(counts[qi]).reduce((s, v) => s + v, 0) || 1;
      q.options.forEach((o) => {
        const v = counts[qi][o.id] || 0;
        rows.push([q.text, o.label, v, Math.round((v / qTotal) * 1000) / 10]);
      });
      rows.push(["", "", "", ""]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${deck.title.replace(/[^\w\d\s]/g, "").trim().replace(/\s+/g, "_")}_ket_qua.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    setCsvCopied(true); setTimeout(() => setCsvCopied(false), 2200);
  };

  const handleSaveImage = () => {
    setImgSaved(true); setTimeout(() => setImgSaved(false), 2200);
  };

  // ----- SETUP -----
  if (phase === "setup") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        <TopBar title="Chuẩn bị trình chiếu" onBack={onBack} />
        <div style={{ padding: 24, flex: 1 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 6, lineHeight: 1.3 }}>{deck.title}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted, marginBottom: 24 }}>
            {deck.questions.length} câu hỏi · Người tham gia trả lời qua QR hoặc link.
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>Thời lượng phiên</div>
          <DurationPicker value={durationMinutes} onChange={setDurationMinutes} />
          <div style={{ marginTop: 14, fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, lineHeight: 1.5 }}>
            Sau bước này là phòng chờ — người tham gia quét mã trước, đồng hồ chỉ chạy khi bạn bấm "Bắt đầu".
          </div>
          <button onClick={() => setPhase("waiting")} style={{ ...primaryButton, width: "100%", marginTop: 24, padding: 15, borderRadius: 14, fontSize: 15 }}>
            Mở phòng chờ
          </button>
        </div>
      </div>
    );
  }

  // ----- WAITING ROOM -----
  if (phase === "waiting") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 13, fontWeight: 600 }}>
            <ChevronLeft size={18} /> Thoát
          </button>
          <Pill tone="live"><span style={{ width: 6, height: 6, borderRadius: 99, background: C.teal, display: "inline-block" }} /> PHÒNG CHỜ</Pill>
        </div>
        <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, letterSpacing: 0.5, marginBottom: 6 }}>ĐANG CHỜ NGƯỜI THAM GIA</div>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 4, lineHeight: 1.3 }}>{deck.title}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted, marginBottom: 28 }}>
            {deck.questions.length} câu hỏi{durationMinutes != null ? ` · ${durationMinutes} phút` : " · không giới hạn thời gian"}
          </div>
          <div style={{ width: 180, height: 180, background: "#fff", borderRadius: 16, display: "grid", placeItems: "center", marginBottom: 20 }}>
            <QrCode size={140} color="#111" />
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, fontWeight: 600, color: C.text, marginBottom: 4 }}>Quét mã hoặc bấm link để vào phòng chờ</div>
          <div style={{ fontFamily: monoFont, fontSize: 14, color: C.teal, fontWeight: 700, marginBottom: 28 }}>rankev.app/deck/{deck.id}</div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 28px", marginBottom: 28 }}>
            <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 34, color: C.gold, lineHeight: 1 }}>{fmt(participantCount)}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, marginTop: 4 }}>người đã vào phòng chờ</div>
          </div>
          <button onClick={() => setPhase("live")} style={{ ...primaryButton, width: "100%", maxWidth: 320, padding: 16, borderRadius: 14, fontSize: 15.5 }}>
            Bắt đầu ({fmt(participantCount)} người)
          </button>
          <div style={{ marginTop: 12, fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, lineHeight: 1.4, maxWidth: 320 }}>
            Đồng hồ đếm giờ chỉ bắt đầu chạy khi bạn bấm nút này — người vào muộn sẽ không bị mất thời gian.
          </div>
        </div>
      </div>
    );
  }

  // ----- RESULTS SCREEN (after session ended) -----
  if (phase === "live" && sessionEnded) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 13, fontWeight: 600 }}>
            <ChevronLeft size={18} /> Đóng
          </button>
          <Pill tone="muted">KẾT QUẢ KHẢO SÁT</Pill>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
          {/* Summary header */}
          <div style={{ ...cardSurface, marginBottom: 16, display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            <div>
              <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 28, color: C.gold }}>{fmt(participantCount)}</div>
              <div style={{ ...captionText, marginTop: 3 }}>người tham gia</div>
            </div>
            <div style={{ width: 1, background: C.border }} />
            <div>
              <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 28, color: C.teal }}>{fmt(totalResponses)}</div>
              <div style={{ ...captionText, marginTop: 3 }}>lượt trả lời</div>
            </div>
            <div style={{ width: 1, background: C.border }} />
            <div>
              <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 28, color: C.text }}>{deck.questions.length}</div>
              <div style={{ ...captionText, marginTop: 3 }}>câu hỏi</div>
            </div>
          </div>

          {/* Per-question results */}
          {deck.questions.map((question, qi) => {
            const qTotal = Object.values(counts[qi]).reduce((s, v) => s + v, 0) || 1;
            const sortedQ = [...question.options].sort((a, b) => (counts[qi][b.id] || 0) - (counts[qi][a.id] || 0));
            return (
              <div key={question.id} style={{ ...cardSurface, marginBottom: 12 }}>
                <div style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: C.textFaint, marginBottom: 6 }}>
                  Câu {qi + 1} · {question.votingType === "multiple" ? "Chọn nhiều" : question.votingType === "rating" ? "Đánh giá" : "Chọn một"}
                </div>
                <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 14, lineHeight: 1.3 }}>
                  {question.text}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sortedQ.map((o, i) => {
                    const v = counts[qi][o.id] || 0;
                    const pct = Math.round((v / qTotal) * 1000) / 10;
                    const isTop = i === 0;
                    return (
                      <div key={o.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontFamily: bodyFont, fontSize: 13.5 }}>
                          <span style={{ color: isTop ? C.text : C.textMuted, fontWeight: isTop ? 700 : 500 }}>
                            {isTop && "🥇 "}{o.label}
                          </span>
                          <span style={{ color: COLORS[i % 5], fontFamily: monoFont, fontWeight: 700 }}>{pct}% <span style={{ color: C.textFaint, fontWeight: 400, fontSize: 11 }}>({fmt(v)})</span></span>
                        </div>
                        <div style={{ height: 22, borderRadius: 8, background: C.surfaceRaised, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: COLORS[i % 5], borderRadius: 8, transition: "width 0.6s cubic-bezier(.22,1,.36,1)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action panel — styled like Rankie session-end */}
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
          {!presenterSessionSaved ? (
            <>
              <input
                type="text"
                value={presenterSessionName}
                onChange={(e) => setPresenterSessionName(e.target.value)}
                placeholder="Đặt tên phiên (VD: Lớp 10A1 · buổi sáng)"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontSize: 16 }}
              />
              <button
                onClick={() => {
                  onSessionEnd?.({ name: presenterSessionName.trim() || `Phiên ${new Date().toLocaleString("vi-VN")}`, endedAt: Date.now() });
                  setPresenterSessionSaved(true);
                }}
                style={{ padding: 13, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Monitor size={16} /> Lưu phiên trình chiếu
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 10, color: C.gold, fontFamily: bodyFont, fontWeight: 700, fontSize: 13 }}>
              <Check size={16} /> Đã lưu phiên "{presenterSessionName.trim() || "không tên"}"
            </div>
          )}
          <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, textAlign: "center" }}>
            Muốn công bố kết quả? Dùng icon Chia sẻ ngay trên bài khảo sát này.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleExportCSV}
              style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${csvCopied ? C.teal : C.border}`, background: C.surface, color: csvCopied ? C.teal : C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}
            >
              {csvCopied ? <Check size={14} /> : <Download size={14} />} {csvCopied ? "Đã xuất!" : "Xuất CSV"}
            </button>
            <button
              onClick={handleSaveImage}
              style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${imgSaved ? C.teal : C.border}`, background: C.surface, color: imgSaved ? C.teal : C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}
            >
              {imgSaved ? <Check size={14} /> : <ImagePlus size={14} />} {imgSaved ? "Đã lưu!" : "Lưu ảnh"}
            </button>
            <button
              onClick={() => setShareOpen(true)}
              style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <FbShareIcon size={14} color={C.text} /> Chia sẻ
            </button>
          </div>
        </div>

        {shareOpen && (
          <ShareModal
            item={{ ...deck, title: `[Kết quả] ${deck.title}` }}
            onClose={() => setShareOpen(false)}
            onShareToProfile={onShareToProfile || (() => {})}
            contacts={contacts ?? []}
          />
        )}
      </div>
    );
  }

  // ----- LIVE PRESENTER (question-by-question) -----
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 13, fontWeight: 600 }}>
          <ChevronLeft size={18} /> Thoát
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Pill tone="muted"><Users size={11} /> {fmt(participantCount)}</Pill>
          <CountdownBadge remainingSec={remainingSec} expired={expired} />
          <Pill tone="live"><span style={{ width: 6, height: 6, borderRadius: 99, background: C.teal, display: "inline-block" }} /> {expired ? "KẾT THÚC" : "LIVE"}</Pill>
        </div>
      </div>

      {/* Question area */}
      <div style={{ flex: 1, padding: "20px 18px", display: "flex", flexDirection: "column" }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {deck.questions.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < qIdx ? C.gold : i === qIdx ? C.teal : C.surfaceRaised, transition: "background 0.3s" }} />
          ))}
        </div>

        <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, marginBottom: 8 }}>
          Câu {qIdx + 1} / {deck.questions.length} · {deck.title}
        </div>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 18, lineHeight: 1.25 }}>
          {q.text}
        </div>

        {/* Live count */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 28, color: C.gold, lineHeight: 1 }}>{fmt(total)}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, marginTop: 3 }}>lượt trả lời</div>
          </div>
        </div>

        {/* Results bars */}
        <div style={{ flex: 1 }}>
          {revealed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sortedOpts.map((o, i) => {
                const pct = Math.round((qCounts[o.id] / total) * 1000) / 10;
                return (
                  <div key={o.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 15, marginBottom: 5 }}>
                      <span style={{ color: C.text, fontWeight: 700 }}>{i === 0 ? "🥇 " : `#${i + 1} `}{o.label}</span>
                      <span style={{ color: COLORS[i % 5], fontFamily: monoFont, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 26, borderRadius: 8, background: C.surfaceRaised, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: COLORS[i % 5], transition: "width 0.5s ease", borderRadius: 8 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "36px 20px", color: C.textMuted, fontFamily: bodyFont, fontSize: 14, lineHeight: 1.6 }}>
              🙈 Kết quả đang ẩn.<br />Người tham gia đang trả lời qua QR.<br />Bấm "Hiện kết quả" khi sẵn sàng.
            </div>
          )}
        </div>

        {/* QR block */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", marginTop: 18, padding: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14 }}>
          <div style={{ width: 72, height: 72, background: "#fff", borderRadius: 8, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <QrCode size={54} color="#111" />
          </div>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>Quét để trả lời</div>
            <div style={{ fontFamily: monoFont, fontSize: 12, color: C.teal, fontWeight: 700 }}>rankev.app/deck/{deck.id}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
        {expired && (
          <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.coral, fontWeight: 600, textAlign: "center" }}>
            ⏰ Đã hết thời gian — không nhận thêm phản hồi mới.
          </div>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => { if (qIdx > 0) { setQIdx((i) => i - 1); setRevealed(false); } }}
            disabled={qIdx === 0}
            style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: qIdx === 0 ? C.textFaint : C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: qIdx === 0 ? "not-allowed" : "pointer" }}
          >
            ← Câu trước
          </button>
          <button
            onClick={() => setRevealed((r) => !r)}
            style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${revealed ? C.gold : C.border}`, background: revealed ? C.goldSoft : C.surface, color: revealed ? C.gold : C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />} {revealed ? "Ẩn kết quả" : "Hiện kết quả"}
          </button>
          {qIdx < deck.questions.length - 1 ? (
            <button
              onClick={() => { setQIdx((i) => i + 1); setRevealed(false); }}
              style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: C.gold, color: "#1A1305", fontFamily: bodyFont, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Câu tiếp →
            </button>
          ) : (
            <button
              onClick={() => setSessionEnded(true)}
              style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: C.coral, color: "#fff", fontFamily: bodyFont, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <ChevronsDown size={15} /> Kết thúc &amp; Xem kết quả
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- PRESENTER MODE ----------
// Full-screen live display for events: big chart, QR, participant counter, controls
function PresenterView({ rankie, initialOptions, onBack, onSessionEnd }) {
  const [mode, setMode] = useState(null); // null = show setup screen; "keep" | "reset"
  const [paused, setPaused] = useState(false);
  const [revealed, setRevealed] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState(null); // session countdown length; null = no limit
  // Seeded from the rankie's current shared vote counts (not the original sample data),
  // so "giữ số liệu đang có" reflects whatever the viewer had already voted/seen.
  // Live votes only start ticking after a mode is chosen
  const [options, setOptions] = useLiveVotes(initialOptions || rankie.options, mode !== null && !paused, rankie.live && !rankie._api);
  const { remainingSec, expired } = useCountdown(durationMinutes, mode !== null);

  // When the countdown hits zero, auto-pause and reveal results so the session ends cleanly
  useEffect(() => {
    if (expired) {
      setPaused(true);
      setRevealed(true);
    }
  }, [expired]);

  const [startedAt] = useState(Date.now());
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionName, setSessionName] = useState("");

  // When starting a fresh session, zero out every option
  const startSession = (chosen) => {
    if (chosen === "reset") {
      setOptions((prev) => prev.map((o) => ({ ...o, votes: 0 })));
    }
    setMode(chosen);
  };

  const endSession = () => {
    setPaused(true);
    setRevealed(true);
    setSessionEnded(true);
  };

  const [presenterSessionSaved, setPresenterSessionSaved] = useState(false);
  const handleSaveSession = () => {
    const totalVotes = options.reduce((s, o) => s + o.votes, 0);
    onSessionEnd?.({
      name: sessionName.trim() || `Phiên ${new Date(startedAt).toLocaleString("vi-VN")}`,
      mode,
      startedAt,
      endedAt: Date.now(),
      options: [...options],
      totalVotes,
    });
    setPresenterSessionSaved(true);
  };

  const handleExportCSV = () => {
    exportPostToCSV({ ...rankie, options, type: "rankie" });
  };

  const handleCopyLink = () => {
    const link = `https://rankev.app/vote/${rankie.id}`;
    navigator.clipboard?.writeText(link).catch(() => {});
  };

  // Mock "save as image" — in real app would use html2canvas or similar
  const handleSaveImage = () => {
    alert("Trong bản thật: xuất kết quả dưới dạng ảnh PNG bằng html2canvas.");
  };

  // ----- SETUP SCREEN (choose keep or reset) -----
  if (mode === null) {
    const existingTotal = (initialOptions || rankie.options).reduce((s, o) => s + o.votes, 0);
    const card = (onClick, icon, title, desc, accent) => (
      <button
        onClick={onClick}
        style={{
          width: "100%",
          textAlign: "left",
          padding: 18,
          borderRadius: 16,
          background: C.surface,
          border: `1px solid ${C.border}`,
          cursor: "pointer",
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
          transition: "border-color 0.15s ease, transform 0.15s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: C.surfaceRaised, display: "grid", placeItems: "center", flexShrink: 0, color: accent }}>
          {icon}
        </div>
        <div>
          <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 3 }}>{title}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted, lineHeight: 1.4 }}>{desc}</div>
        </div>
      </button>
    );

    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        <TopBar title="Chuẩn bị trình chiếu" onBack={onBack} />
        <div style={{ padding: 24, flex: 1 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 6, lineHeight: 1.3 }}>
            {rankie.title}
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.textMuted, marginBottom: 24 }}>
            Rankie này hiện có <span style={{ color: C.gold, fontWeight: 600 }}>{fmt(existingTotal)}</span> lượt bình chọn. Bạn muốn bắt đầu buổi trình chiếu thế nào?
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {card(
              () => startSession("keep"),
              <Users size={20} />,
              "Giữ số liệu đang có",
              "Tiếp tục từ kết quả hiện tại. Phù hợp khi Rankie đã chạy công khai và bạn muốn cả phòng xem, bình chọn thêm.",
              C.teal
            )}
            {card(
              () => startSession("reset"),
              <Play size={20} />,
              "Bắt đầu phiên mới (reset về 0)",
              "Xóa kết quả cũ, chỉ tính bình chọn của khán giả trong buổi này. Phù hợp cho hội thảo, lớp học, khảo sát tại chỗ.",
              C.gold
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>
              Thời lượng phiên trình chiếu
            </div>
            <DurationPicker value={durationMinutes} onChange={setDurationMinutes} />
          </div>

          <div style={{ marginTop: 16, fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, lineHeight: 1.4 }}>
            Trong bản demo, reset chỉ ảnh hưởng phiên trình chiếu này; dữ liệu gốc của Rankie không bị xóa vĩnh viễn.
          </div>
        </div>
      </div>
    );
  }

  const total = options.reduce((s, o) => s + o.votes, 0) || 1;
  const sorted = [...options].sort((a, b) => b.votes - a.votes);

  const ctrlBtn = (onClick, active, icon, txt) => (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 16px",
        borderRadius: 10,
        border: `1px solid ${active ? C.gold : C.border}`,
        background: active ? C.goldSoft : C.surface,
        color: active ? C.gold : C.text,
        fontFamily: bodyFont,
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {icon} {txt}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 13, fontWeight: 600 }}>
          <ChevronLeft size={18} /> Thoát trình chiếu
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CountdownBadge remainingSec={remainingSec} expired={expired} />
          <Pill tone="live">
            <span style={{ width: 6, height: 6, borderRadius: 99, background: C.teal, display: "inline-block" }} /> {expired ? "ĐÃ KẾT THÚC" : paused ? "TẠM DỪNG" : "LIVE"}
          </Pill>
        </div>
      </div>

      {/* Big display area */}
      <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 26, color: C.text, textAlign: "center", lineHeight: 1.25, marginBottom: 6 }}>
          {rankie.title}
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 14, color: C.textMuted, textAlign: "center", marginBottom: 28 }}>
          {rankie.subtitle}
        </div>

        {/* Live counter */}
        <div style={{ display: "flex", justifyContent: "center", gap: 28, marginBottom: 32 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 36, color: C.gold, lineHeight: 1 }}>{fmt(total)}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint, marginTop: 4 }}>lượt bình chọn</div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ flex: 1 }}>
          {revealed ? (
            rankie.chartType === "head_to_head" ? (
              <div style={{ transform: "scale(1.05)", transformOrigin: "center top", marginTop: 16 }}>
                <HeadToHead rankie={rankie} options={options} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {sorted.map((o, i) => {
                  const pct = Math.round((o.votes / total) * 1000) / 10;
                  return (
                    <div key={o.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 17, marginBottom: 6 }}>
                        <span style={{ color: C.text, fontWeight: 700 }}>
                          {`#${i + 1} `}{o.label}
                        </span>
                        <span style={{ color: C.gold, fontFamily: monoFont, fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 26, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: o.color || C.teal, transition: "width 0.6s cubic-bezier(.22,1,.36,1)", borderRadius: 8 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div style={{ textAlign: "center", padding: "48px 20px", color: C.textMuted, fontFamily: bodyFont, fontSize: 15 }}>
              🙈 Kết quả đang được ẩn.
              <br />Bấm "Hiện kết quả" khi bạn sẵn sàng công bố.
            </div>
          )}
        </div>

        {/* QR block */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center", marginTop: 28, padding: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16 }}>
          <div style={{ width: 96, height: 96, background: "#fff", borderRadius: 10, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <QrCode size={72} color="#111" />
          </div>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Quét để bình chọn</div>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted, marginBottom: 6 }}>Không cần cài app hay đăng nhập.</div>
            <div style={{ fontFamily: monoFont, fontSize: 14, color: C.teal, fontWeight: 700 }}>rankev.app/vote/{rankie.id}</div>
          </div>
        </div>
      </div>

      {/* Presenter controls */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px", borderTop: `1px solid ${C.border}` }}>
        {(expired || sessionEnded) && (
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.coral, fontWeight: 600 }}>
            {expired ? "⏰ Đã hết thời gian trình chiếu." : "✅ Phiên trình chiếu đã kết thúc."}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {!expired && !sessionEnded && ctrlBtn(() => setPaused((p) => !p), paused, paused ? <Play size={15} /> : <Pause size={15} />, paused ? "Tiếp tục" : "Tạm dừng")}
          {!sessionEnded && ctrlBtn(() => setRevealed((r) => !r), !revealed, revealed ? <EyeOff size={15} /> : <Eye size={15} />, revealed ? "Ẩn kết quả" : "Hiện kết quả")}
          {!sessionEnded && ctrlBtn(endSession, false, <ChevronsDown size={15} />, "Kết thúc phiên")}
        </div>

        {/* Post-session action panel */}
        {sessionEnded && (
          <div style={{ width: "100%", marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 13, color: C.text, textAlign: "center", marginBottom: 4 }}>
              Phiên kết thúc · {fmt(options.reduce((s, o) => s + o.votes, 0))} lượt bình chọn
            </div>
            {!presenterSessionSaved ? (
              <>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Đặt tên phiên (VD: Lớp 10A1 · buổi sáng)"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontSize: 16 }}
                />
                <button
                  onClick={handleSaveSession}
                  style={{ ...primaryButton, width: "100%", padding: 13, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <ArchiveRestore size={16} /> Lưu vào hồ sơ cá nhân
                </button>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 10, color: C.gold, fontFamily: bodyFont, fontWeight: 700, fontSize: 13 }}>
                <Check size={16} /> Đã lưu phiên "{sessionName.trim() || "không tên"}"
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleExportCSV}
                style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Download size={14} /> Xuất CSV
              </button>
              <button
                onClick={handleCopyLink}
                style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Link2 size={14} /> Chia sẻ link
              </button>
              <button
                onClick={handleSaveImage}
                style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <ImagePlus size={14} /> Lưu ảnh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- CREATE VIEW ----------
// All categories available for Rankies — used in the feed pills, search browse,
// and the CreateView category picker. The first entry is the "show everything" tab.
const CATEGORIES = [
  { id: "trending",   label: "🔥 Thịnh hành",  feedLabel: "Đang thịnh hành" },
  { id: "sport",      label: "⚽ Thể thao" },
  { id: "music",      label: "🎵 Âm nhạc" },
  { id: "food",       label: "🍜 Ẩm thực" },
  { id: "tech",       label: "💻 Công nghệ" },
  { id: "film",       label: "🎬 Phim ảnh" },
  { id: "career",     label: "💼 Sự nghiệp" },
  { id: "game",       label: "🎮 Game" },
  { id: "travel",     label: "✈️ Du lịch" },
  { id: "fashion",    label: "👗 Thời trang" },
  { id: "health",     label: "🏃 Sức khoẻ" },
  { id: "community",  label: "🤝 Cộng đồng" },
  { id: "other",      label: "💬 Khác" },
];
// Canonical category names used as item.category values — the short names only
// (without emoji), matching what CreateView stores and what the feed filters on.
const CATEGORY_NAMES = {
  sport:     "Thể thao",
  music:     "Âm nhạc",
  food:      "Ẩm thực",
  tech:      "Công nghệ",
  film:      "Phim ảnh",
  career:    "Sự nghiệp",
  game:      "Game",
  travel:    "Du lịch",
  fashion:   "Thời trang",
  health:    "Sức khoẻ",
  community: "Cộng đồng",
  other:     "Khác",
};

// Trending score for a single post. Weights:
//   - participant count (raw signal of interest)
//   - recency: posts decay over 48 h (half-life ~12 h)
//   - live bonus: active polls get a significant boost
//   - comment bonus: engagement depth
function trendingScore(item) {
  const ageHours = (Date.now() - (item.createdAt || 0)) / (1000 * 60 * 60);
  // A post fresh off the press (first couple of minutes) always tops the feed,
  // even the "Đang thịnh hành" tab — otherwise a brand-new post with 0
  // engagement would sort below older, already-popular content.
  const freshBoost = ageHours < (2 / 60) ? 1e6 : 0;
  const decay = Math.exp(-ageHours / 12); // half-life ≈ 12 h
  const participants = item.participants || 0;
  const comments = (Array.isArray(item.comments) ? item.comments.length : item.comments) || 0;
  const liveBonus = item.live && !isRankieClosed?.(item) ? 1.4 : 1;
  return freshBoost + (participants * 0.6 + comments * 2) * decay * liveBonus;
}

// Distribute a fixed 10-point budget across exam questions. Questions the host
// hasn't manually touched (`pointsLocked: false`) auto-share whatever points
// remain after subtracting the ones the host locked in by hand — so the total
// always stays exactly 10 no matter how many questions or how they're split.
function distributeExamPoints(questions) {
  const total = 10;
  const lockedSum = questions.reduce((s, q) => s + (q.pointsLocked ? (q.points || 0) : 0), 0);
  const unlockedIdx = questions.map((q, i) => i).filter((i) => !questions[i].pointsLocked);
  const remaining = Math.max(total - lockedSum, 0);
  const share = unlockedIdx.length > 0 ? remaining / unlockedIdx.length : 0;
  let assigned = 0;
  return questions.map((q, i) => {
    if (q.pointsLocked) return { ...q, points: Math.round((q.points || 0) * 10) / 10 };
    const isLast = i === unlockedIdx[unlockedIdx.length - 1];
    const val = isLast ? Math.round((remaining - assigned) * 10) / 10 : Math.round(share * 10) / 10;
    if (!isLast) assigned += val;
    return { ...q, points: Math.max(0, val) };
  });
}

const EMOJI_CHOICES = ["🎯", "🎨", "⚙️", "💚", "🤝", "🎧", "🔥", "⭐", "🏆", "🚀", "🎬", "⚽"];

function CreateView({ onCreate, onUpdate, editItem = null, mySeries = [] }) {
  // Chế độ SỬA: nạp sẵn cấu trúc cũ (reverse-map). editItem chỉ dùng cho path/deck
  // (rankie sửa qua EditPostModal). emit() gọi onUpdate khi sửa, onCreate khi tạo.
  const editing = !!editItem;
  const pb = editing && editItem.type === "path" ? protoPathToBuilder(editItem) : null;
  const dk = editing && editItem.type === "deck" ? protoDeckToBuilder(editItem) : null;
  const emit = editing ? (item) => onUpdate?.({ ...item, id: editItem.id }) : onCreate;
  // rankie | path | deck(survey) | exam. Deck exam → "exam"; survey → "deck".
  const initContentType = editing
    ? (editItem.type === "deck" ? (dk?.deckMode === "exam" ? "exam" : "deck") : editItem.type)
    : "rankie";
  const [contentType, setContentType] = useState(initContentType);
  const [title, setTitle] = useState(editItem?.title || "");
  const [opts, setOpts] = useState([
    { label: "", emoji: "🎯", image: null },
    { label: "", emoji: "🎨", image: null },
  ]);
  const [votingType, setVotingType] = useState("single");
  const [category, setCategory] = useState(editItem?.category || Object.values(CATEGORY_NAMES)[0]); // defaults to first category
  const [audience, setAudience] = useState("public");
  const [allowGuestPresent, setAllowGuestPresent] = useState(false); // cho phép người khác trình chiếu bài này
  // Series (Chapter) — bài này thuộc bộ nào. seriesId = id của series, seriesName = tên
  // hiển thị. Nếu null thì đây là bài độc lập không thuộc series nào.
  const [seriesInput, setSeriesInput] = useState(""); // text người dùng đang gõ
  const [selectedSeriesId, setSelectedSeriesId] = useState(null); // id series đã chọn (existing) hoặc null = tạo mới
  const [closingTime, setClosingTime] = useState(null); // null = vô hạn; number = giờ tính từ lúc đăng; { custom } = mốc giờ cụ thể
  const [chartType, setChartType] = useState("bar");
  const [emojiPickerFor, setEmojiPickerFor] = useState(null);
  // Custom "voted" marker — replaces the default "VOTED" label next to whichever
  // option the viewer picked, with a sticker/image the creator chose instead.
  // null means "use the default VOTED label".
  const [voteMarker, setVoteMarker] = useState(null); // { emoji, image } | null
  const [voteMarkerPickerOpen, setVoteMarkerPickerOpen] = useState(false);

  // Shared post content across all three content types (caption + optional media placeholder)
  const [caption, setCaption] = useState(editItem?.caption || "");
  const [media, setMedia] = useState(editItem?.media || null); // { type: "image"|"video", color, emoji, url }
  const addMockMedia = (type) => {
    const colors = ["#2E5D4E", "#5A4A2E", "#4A2E3D", "#2E3D5A"];
    setMedia({ type, color: colors[Math.floor(Math.random() * colors.length)], emoji: type === "video" ? "🎬" : "🖼️" });
  };
  // Ảnh bìa bài đăng: chọn file thật → upload lên máy chủ → lưu URL vào media.url.
  const addImageMedia = () => {
    const svg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'><rect width='400' height='240' fill='%232E5D4E'/><text x='200' y='135' font-size='64' text-anchor='middle'>🖼️</text></svg>`;
    pickAndUpload((url) => setMedia({ type: "image", url, color: "#2E5D4E", emoji: "🖼️" }), "image", svg);
  };

  // ----- PATH builder state -----
  // A simple 1-question path with up to 4 illustrated outcomes (keeps the prototype approachable)
  // --- PATH builder đa tầng (recursive) ---
  // Mỗi câu hỏi có nhiều đáp án; mỗi đáp án dẫn tới 1 ENDING (kết thúc) hoặc 1 CÂU HỎI
  // khác (đi tiếp). Người tạo chỉ trả lời "sau lựa chọn này, điều gì xảy ra?" — không cần
  // hiểu sơ đồ/flowchart. Chọn "tới câu hỏi mới" sẽ tự sinh câu hỏi bên dưới.
  const pathUid = useRef(0);
  const nextPathId = (p) => `${p}${Date.now()}_${pathUid.current++}`;
  const [pathEndings, setPathEndings] = useState(pb?.endings || [
    { id: "e1", name: "", emoji: "🎯", image: null },
    { id: "e2", name: "", emoji: "🌟", image: null },
  ]);
  const [pathQuestions, setPathQuestions] = useState(pb?.questions || [
    { id: "q1", text: "", answers: [
      { id: "a1", label: "", emoji: "➡️", image: null, target: { type: "ending", id: "e1" } },
      { id: "a2", label: "", emoji: "➡️", image: null, target: { type: "ending", id: "e2" } },
    ] },
  ]);
  const [pathEmojiPickerFor, setPathEmojiPickerFor] = useState(null); // "ending:<id>" | "answer:<qid>:<aid>"
  const [showFlowMap, setShowFlowMap] = useState(false); // xem sơ đồ nhánh
  const [placingHotspot, setPlacingHotspot] = useState(null); // {qid, aid} đang chờ chạm ảnh để đặt vị trí
  const setAnswerHotspot = (qid, aid, hotspot) => updateAnswer(qid, aid, { hotspot });

  const updateQuestion = (qid, patch) => setPathQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)));
  const updateAnswer = (qid, aid, patch) => setPathQuestions((prev) => prev.map((q) => q.id !== qid ? q : { ...q, answers: q.answers.map((a) => (a.id === aid ? { ...a, ...patch } : a)) }));
  const addAnswer = (qid) => setPathQuestions((prev) => prev.map((q) => q.id !== qid || q.answers.length >= 4 ? q : { ...q, answers: [...q.answers, { id: nextPathId("a"), label: "", emoji: "➡️", image: null, target: { type: "ending", id: pathEndings[0]?.id } }] }));
  const removeAnswer = (qid, aid) => setPathQuestions((prev) => prev.map((q) => q.id !== qid ? q : { ...q, answers: q.answers.filter((a) => a.id !== aid) }));

  // Đặt đích cho đáp án. Nếu chọn "câu hỏi mới", tự sinh câu hỏi mới (2 đáp án mặc định
  // trỏ về ending đầu) và trỏ đáp án hiện tại tới câu đó — creator soạn tiếp ngay bên dưới.
  const setAnswerTarget = (qid, aid, value) => {
    if (value === "__newq__") {
      const newQ = { id: nextPathId("q"), text: "", answers: [
        { id: nextPathId("a"), label: "", emoji: "➡️", image: null, target: { type: "ending", id: pathEndings[0]?.id } },
        { id: nextPathId("a"), label: "", emoji: "➡️", image: null, target: { type: "ending", id: pathEndings[1]?.id || pathEndings[0]?.id } },
      ] };
      setPathQuestions((prev) => {
        const next = prev.map((q) => q.id !== qid ? q : { ...q, answers: q.answers.map((a) => (a.id === aid ? { ...a, target: { type: "question", id: newQ.id } } : a)) });
        return [...next, newQ];
      });
      return;
    }
    const [type, id] = value.split(":");
    updateAnswer(qid, aid, { target: { type, id } });
  };

  const removeQuestion = (qid) => {
    if (pathQuestions.length <= 1) return;
    const fallback = pathEndings[0]?.id;
    setPathQuestions((prev) => prev.filter((q) => q.id !== qid).map((q) => ({
      ...q,
      answers: q.answers.map((a) => (a.target.type === "question" && a.target.id === qid ? { ...a, target: { type: "ending", id: fallback } } : a)),
    })));
  };

  const addEnding = () => pathEndings.length < 8 && setPathEndings((prev) => [...prev, { id: nextPathId("e"), name: "", emoji: EMOJI_CHOICES[(prev.length + 3) % EMOJI_CHOICES.length], image: null }]);
  const updateEnding = (id, patch) => setPathEndings((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const removeEnding = (id) => {
    if (pathEndings.length <= 2) return;
    setPathEndings((prev) => prev.filter((e) => e.id !== id));
    // Đáp án nào đang trỏ tới ending bị xoá → trỏ lại ending đầu còn lại.
    const fallback = pathEndings.find((e) => e.id !== id)?.id;
    setPathQuestions((prev) => prev.map((q) => ({ ...q, answers: q.answers.map((a) => (a.target.type === "ending" && a.target.id === id ? { ...a, target: { type: "ending", id: fallback } } : a)) })));
  };

  // Upload ảnh THẬT (Phần 6): mở file picker → preview ngay (optimistic) → POST /uploads/image
  // → thay bằng URL thật. Lỗi/offline → dùng ảnh SVG mock làm fallback.
  const pickAndUpload = (apply, kind = "image", fallbackSvg = null) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;
      apply(URL.createObjectURL(file)); // preview tức thì (blob)
      api
        .uploadImage(file, kind)
        .then((res) => { if (res && res.url) apply(res.url); }) // URL thật từ server
        .catch(() => { if (fallbackSvg) apply(fallbackSvg); });
    };
    input.click();
  };

  const mockUploadEnding = (id, emoji) => {
    const svg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='%232E5D4E'/><text x='40' y='48' font-size='28' text-anchor='middle' fill='white'>${emoji}</text></svg>`;
    pickAndUpload((url) => updateEnding(id, { image: url }), "image", svg);
  };
  // Ảnh cảnh (scene) cho câu hỏi — Visual Scene Builder. Upload thật, fallback SVG demo.
  const mockUploadScene = (qid) => {
    const svg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%231A3328'/><stop offset='1' stop-color='%230D1A14'/></linearGradient></defs><rect width='400' height='240' fill='url(%23g)'/><text x='200' y='130' font-size='64' text-anchor='middle'>🌌</text></svg>`;
    pickAndUpload((url) => updateQuestion(qid, { sceneImage: url }), "scene", svg);
  };

  const [hidePathEndingCount, setHidePathEndingCount] = useState(false);
  const [pathRevealMode, setPathRevealMode] = useState("hidden");
  const endingName = (id) => pathEndings.find((e) => e.id === id)?.name?.trim() || "";
  const validEndings = pathEndings.filter((e) => e.name.trim());
  // Hợp lệ: có tiêu đề, ≥2 ending có tên, mọi câu hỏi có nội dung + ≥2 đáp án có nhãn,
  // và mọi đáp án trỏ tới đích hợp lệ (ending có tên, hoặc câu hỏi tồn tại).
  const canSubmitPath = title.trim() && validEndings.length >= 2 && pathQuestions.every((q) =>
    q.text.trim() && q.answers.filter((a) => a.label.trim()).length >= 2 &&
    q.answers.filter((a) => a.label.trim()).every((a) =>
      a.target.type === "question" ? pathQuestions.some((qq) => qq.id === a.target.id) : !!endingName(a.target.id))
  );

  const submitPath = () => {
    if (!canSubmitPath) return;
    // results (endings) từ danh sách ending có tên; chia % đều cho demo.
    const results = {};
    validEndings.forEach((e) => {
      results[e.name.trim()] = { emoji: e.emoji, image: e.image, pct: Math.round(100 / validEndings.length), count: 0, comment: "Hãy là người đầu tiên bình luận!" };
    });
    // Mỗi câu hỏi → answers[].next trỏ tới TÊN ending (kết thúc) hoặc ID câu hỏi (đi tiếp).
    // Câu 2 đáp án dùng yes/no cho tương thích runner cũ; nhiều hơn dùng mảng answers.
    const buildAnswer = (a) => ({
      label: a.label, emoji: a.emoji, image: a.image, hotspot: a.hotspot || null,
      next: a.target.type === "ending" ? endingName(a.target.id) : a.target.id,
    });
    const questions = pathQuestions.map((q, qi) => {
      const valid = q.answers.filter((a) => a.label.trim());
      const base = { id: q.id === "q1" && qi === 0 ? "q1" : q.id, text: q.text, sceneImage: q.sceneImage || null };
      if (valid.length === 2) {
        return { ...base, yes: buildAnswer(valid[0]), no: buildAnswer(valid[1]) };
      }
      return { ...base, answers: valid.map(buildAnswer) };
    });
    emit({
      id: "p" + Date.now(),
      type: "path",
      title,
      subtitle: `${questions.length} câu hỏi · ${validEndings.length} kết quả`,
      category,
      mine: true,
      author: currentUser,
      createdAt: Date.now(),
      allowGuestPresent,
      seriesId: seriesInput.trim() ? (selectedSeriesId || ("s_" + Date.now())) : null,
      seriesName: seriesInput.trim() || null,
      caption: caption.trim() || null,
      media,
      participants: 0,
      comments: 0,
      questions,
      results,
      revealMode: pathRevealMode,
      hideEndingCount: hidePathEndingCount,
    });
  };

  // ----- DECK builder state -----
  // A deck is a list of questions, each with its own votingType and text options.
  const [deckMode, setDeckMode] = useState(dk?.deckMode || "survey"); // survey | exam
  const [deckAnswerMode, setDeckAnswerMode] = useState("step"); // step | scroll
  const [examPassingScore, setExamPassingScore] = useState(editItem?.passingScore || 5);
  // Thời gian làm bài: "Không giới hạn" hoặc một con số + đơn vị (giây/phút/giờ/ngày).
  // Được quy đổi ra phút (examDurationMinutes) để tương thích với useCountdown hiện có.
  const [examDurationUnlimited, setExamDurationUnlimited] = useState(false);
  const [examDurationValue, setExamDurationValue] = useState(10);
  const [examDurationUnit, setExamDurationUnit] = useState("phut"); // giay | phut | gio | ngay
  const DURATION_UNIT_TO_MIN = { giay: 1 / 60, phut: 1, gio: 60, ngay: 1440 };
  const examDurationMinutes = examDurationUnlimited ? null : Math.max(1 / 60, (examDurationValue || 0) * DURATION_UNIT_TO_MIN[examDurationUnit]);
  const [deckQuestions, setDeckQuestions] = useState(dk?.questions || [
    { text: "", votingType: "single", points: 1, pointsLocked: false, options: [{ label: "", correct: false }, { label: "", correct: false }] },
  ]);
  // Điểm mỗi câu Exam luôn tự chia đều để tổng = 10; host bấm vào ô điểm để tự
  // chỉnh tay cho câu đó (khoá lại), phần còn lại tự tính lại cho đủ 10.
  const examDeckQuestions = deckMode === "exam" ? distributeExamPoints(deckQuestions) : deckQuestions;
  const setQuestionPoints = (qi, val) =>
    setDeckQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, points: val, pointsLocked: true } : q)));
  const resetQuestionPoints = (qi) =>
    setDeckQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, pointsLocked: false } : q)));

  const updateDeckQ = (qi, patch) =>
    setDeckQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  const updateDeckOpt = (qi, oi, patch) =>
    setDeckQuestions((prev) =>
      prev.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? (typeof patch === "string" ? { ...o, label: patch } : { ...o, ...patch }) : o) } : q)
    );
  const toggleCorrect = (qi, oi) =>
    setDeckQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        // For single-answer, uncheck others; for multiple, just toggle
        if (q.votingType === "single") {
          return { ...q, options: q.options.map((o, j) => ({ ...o, correct: j === oi })) };
        }
        return { ...q, options: q.options.map((o, j) => j === oi ? { ...o, correct: !o.correct } : o) };
      })
    );
  const addDeckOpt = (qi) =>
    setDeckQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, options: [...q.options, { label: "", correct: false }] } : q)));
  const removeDeckOpt = (qi, oi) =>
    setDeckQuestions((prev) => prev.map((q, i) => i === qi && q.options.length > 2 ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q));
  const addDeckQuestion = () =>
    setDeckQuestions((prev) => [...prev, { text: "", votingType: "single", points: 1, pointsLocked: false, options: [{ label: "", correct: false }, { label: "", correct: false }] }]);
  const removeDeckQuestion = (qi) =>
    setDeckQuestions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== qi) : prev));

  const canSubmitDeck =
    title.trim() &&
    deckQuestions.every((q) => q.text.trim() && (q.votingType === "text" || q.votingType === "rating" || q.options.filter((o) => (o.label||"").trim()).length >= 2)) &&
    (deckMode === "survey" || deckQuestions.every((q) => q.votingType === "text" || q.options.some((o) => o.correct)));

  // Lý do cụ thể khi nút Đăng đang bị khoá — hiển thị cho người dùng biết còn thiếu gì.
  const deckSubmitIssues = [];
  if (!title.trim()) deckSubmitIssues.push("Nhập tiêu đề");
  deckQuestions.forEach((q, qi) => {
    if (!q.text.trim()) deckSubmitIssues.push(`Câu ${qi + 1}: chưa nhập nội dung câu hỏi`);
    else if (q.votingType !== "text" && q.votingType !== "rating" && q.options.filter((o) => (o.label||"").trim()).length < 2) {
      deckSubmitIssues.push(`Câu ${qi + 1}: cần ít nhất 2 phương án có nội dung`);
    } else if (deckMode === "exam" && q.votingType !== "text" && !q.options.some((o) => o.correct)) {
      deckSubmitIssues.push(`Câu ${qi + 1}: chưa đánh dấu đáp án đúng`);
    }
  });

  const submitDeck = () => {
    if (!canSubmitDeck) return;
    emit({
      id: "d" + Date.now(),
      type: "deck",
      deckMode,
      title,
      subtitle: deckMode === "exam" ? `${deckQuestions.length} câu · Bài thi` : `${deckQuestions.length} câu hỏi`,
      category,
      mine: true,
      author: currentUser,
      createdAt: Date.now(),
      allowGuestPresent,
      seriesId: seriesInput.trim() ? (selectedSeriesId || ("s_" + Date.now())) : null,
      seriesName: seriesInput.trim() || null,
      caption: caption.trim() || null,
      media,
      participants: 0,
      comments: 0,
      answerMode: deckMode === "exam" ? "scroll" : deckAnswerMode,
      graded: deckMode === "exam",
      passingScore: deckMode === "exam" ? examPassingScore : null,
      examDurationMinutes: deckMode === "exam" ? examDurationMinutes : null,
      questions: (deckMode === "exam" ? examDeckQuestions : deckQuestions).map((q, qi) => ({
        id: "dq" + qi,
        text: q.text,
        votingType: q.votingType,
        points: deckMode === "exam" ? (q.points || 1) : 1,
        answerKey: deckMode === "exam" && q.votingType === "text" ? (q.answerKey || "") : undefined,
        options:
          q.votingType === "rating"
            ? [
                { id: "5", label: "⭐⭐⭐⭐⭐", votes: 0, correct: false },
                { id: "4", label: "⭐⭐⭐⭐", votes: 0, correct: false },
                { id: "3", label: "⭐⭐⭐", votes: 0, correct: false },
                { id: "2", label: "⭐⭐", votes: 0, correct: false },
                { id: "1", label: "⭐", votes: 0, correct: false },
              ]
            : q.votingType === "text"
            ? []
            : q.options.filter((o) => (o.label||"").trim()).map((o, oi) => ({ id: "o" + oi, label: o.label, votes: 0, correct: !!o.correct })),
      })),
    });
  };

  const updateOpt = (i, patch) => setOpts((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  const addOpt = () => setOpts((prev) => [...prev, { label: "", emoji: EMOJI_CHOICES[prev.length % EMOJI_CHOICES.length], image: null }]);

  // Upload ảnh cho một lựa chọn (Phần 6) — file picker thật, fallback SVG demo.
  const mockUpload = (i) => {
    const swatches = ["#2E5D4E", "#5A4A2E", "#4A2E3D", "#2E3D5A"];
    const svg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='${encodeURIComponent(swatches[i % 4])}'/><text x='40' y='48' font-size='28' text-anchor='middle' fill='white'>${opts[i].emoji}</text></svg>`;
    pickAndUpload((url) => updateOpt(i, { image: url }), "image", svg);
  };

  // Upload ảnh cho sticker "đã bình chọn".
  const mockUploadVoteMarker = () => {
    const svg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='${encodeURIComponent(C.gold)}'/><text x='40' y='48' font-size='28' text-anchor='middle' fill='white'>${voteMarker?.emoji || "⭐"}</text></svg>`;
    pickAndUpload((url) => setVoteMarker({ emoji: voteMarker?.emoji || "⭐", image: url }), "image", svg);
  };

  const canSubmit = title.trim() && opts.filter((o) => o.label.trim()).length >= 2;

  const submit = () => {
    if (!canSubmit) return;
    // Resolve the chosen closing-time option into an absolute timestamp (or null = vô hạn)
    let closesAt = null;
    if (typeof closingTime === "number") {
      closesAt = Date.now() + closingTime * 60 * 60 * 1000;
    } else if (closingTime && closingTime.custom) {
      const t = new Date(closingTime.custom).getTime();
      closesAt = Number.isNaN(t) ? null : t;
    }
    const finalOptions = opts.filter((o) => o.label.trim()).map((o, i) => ({
      id: "o" + i,
      label: o.label,
      emoji: o.emoji,
      image: o.image,
      votes: 0,
      voters: 0,
      color: [C.teal, C.gold, C.coral, "#8B7FD1", "#6B4E43"][i % 5],
    }));
    emit({
      id: "r" + Date.now(),
      type: "rankie",
      chartType,
      votingType,
      title,
      subtitle:
        votingType === "multiple"
          ? "Chọn nhiều phương án"
          : votingType === "unlimited"
          ? "Bình chọn không giới hạn"
          : votingType === "rating"
          ? "Đánh giá"
          : "Chọn 1 phương án",
      category,
      live: true,
      mine: true,
      author: currentUser,
      createdAt: Date.now(),
      closesAt,
      allowGuestPresent,
      seriesId: seriesInput.trim() ? (selectedSeriesId || ("s_" + Date.now())) : null,
      seriesName: seriesInput.trim() || null,
      caption: caption.trim() || null,
      media,
      participants: 0,
      options: finalOptions,
      // Custom sticker/image shown next to whichever option the viewer picked, in
      // place of the default "VOTED" label — null falls back to that default.
      voteMarker,
      // Only ever used by the "Đối đầu" (head-to-head) chart, which needs exactly two
      // options — filled in here so it renders correctly even if the viewer later
      // switches to that chart type for a rankie that has exactly two options.
      ...(finalOptions.length === 2
        ? { colorA: finalOptions[0].color, colorB: finalOptions[1].color }
        : {}),
      comments: [],
    });
  };

  const field = { marginBottom: 20 };
  const label = { fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 8, display: "block", letterSpacing: 0.3 };
  const input = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    fontFamily: bodyFont,
    fontSize: 14,
    outline: "none",
  };

  const OptionRow = ({ opt, on }) => (
    <label
      onClick={on}
      style={{
        flex: 1,
        padding: "10px 12px",
        borderRadius: 10,
        border: `1px solid ${opt.active ? C.gold : C.border}`,
        background: opt.active ? C.goldSoft : C.surface,
        color: opt.active ? C.gold : C.textMuted,
        fontFamily: bodyFont,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        textAlign: "center",
      }}
    >
      {opt.text}
    </label>
  );

  return (
    <div style={{ padding: 16 }}>
      <TopBar title={editing ? "Chỉnh sửa bài đăng" : "Tạo bài đăng mới"} />
      <div style={{ paddingTop: 16 }}>
        {/* Content type toggle: Rankie / Path / Survey / Exam */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, flexWrap: "wrap" }}>
          {[
            { id: "rankie", label: "📊 Rankie", desc: "Bình chọn" },
            { id: "path", label: "🌿 Path", desc: "Cây quyết định" },
            { id: "deck", label: "📋 Survey", desc: "Khảo sát" },
            { id: "exam", label: "📝 Exam", desc: "Bài thi" },
          ].map((t) => (
            <button
              key={t.id}
              disabled={editing}
              onClick={editing ? undefined : () => { setContentType(t.id); if (t.id === "exam") { setDeckMode("exam"); setDeckAnswerMode("scroll"); } else if (t.id === "deck") { setDeckMode("survey"); } }}
              style={{
                flex: "1 1 21%",
                minWidth: 70,
                padding: "10px 6px",
                borderRadius: 9,
                border: "none",
                background: contentType === t.id ? C.gold : "transparent",
                color: contentType === t.id ? "#1A1305" : C.textMuted,
                fontFamily: bodyFont,
                fontWeight: 700,
                fontSize: 12.5,
                cursor: editing ? "default" : "pointer",
                opacity: editing && contentType !== t.id ? 0.4 : 1,
                lineHeight: 1.3,
              }}
            >
              {t.label}
              <div style={{ fontSize: 9.5, fontWeight: 500, opacity: 0.8 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        <div style={field}>
          <span style={label}>
            {contentType === "path" ? "Tiêu đề Path" : contentType === "deck" ? "Tiêu đề Survey" : contentType === "exam" ? "Tiêu đề Exam" : "Câu hỏi"}
          </span>
          <input
            style={input}
            placeholder={
              contentType === "path"
                ? "VD: Con đường sự nghiệp nào hợp với bạn?"
                : contentType === "deck"
                ? "VD: Khảo sát mức độ hài lòng / Ý kiến về sự kiện"
                : contentType === "exam"
                ? "VD: Bài thi Kiến thức Công nghệ"
                : "VD: Bộ phim hay nhất 2026?"
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Shared post content: caption + media (all content types) */}
        <div style={field}>
          <span style={label}>Nội dung bài đăng (tùy chọn)</span>
          <textarea
            style={{ ...input, minHeight: 70, resize: "vertical", fontFamily: bodyFont }}
            placeholder="Viết mô tả, bối cảnh, hoặc lời kêu gọi... (hiển thị trên bảng tin)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          {media ? (
            <div style={{ marginTop: 10, position: "relative" }}>
              <PostMedia media={media} height={150} />
              <button
                onClick={() => setMedia(null)}
                style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 99, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}
                title="Xóa media"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={addImageMedia}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <ImagePlus size={15} /> Thêm ảnh
              </button>
              <button
                onClick={() => addMockMedia("video")}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Play size={15} /> Thêm video
              </button>
            </div>
          )}
          <div style={{ marginTop: 6, fontFamily: bodyFont, fontSize: 11, color: C.textFaint, lineHeight: 1.4 }}>
            Ảnh được tải lên máy chủ. Video hiện chưa hỗ trợ (sắp có).
          </div>
        </div>

        <div style={field}>
          <span style={label}>Trình chiếu</span>
          <button
            onClick={() => setAllowGuestPresent((v) => !v)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", padding: "12px 14px", borderRadius: 12, background: C.surfaceRaised, border: `1px solid ${allowGuestPresent ? C.gold : C.border}`, cursor: "pointer", fontFamily: bodyFont }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, color: C.text, fontSize: 13, fontWeight: 600 }}>
              <Monitor size={15} color={allowGuestPresent ? C.gold : C.textMuted} /> Cho phép người khác trình chiếu
            </span>
            <span style={{ width: 40, height: 22, borderRadius: 999, background: allowGuestPresent ? C.gold : C.border, position: "relative", flexShrink: 0, transition: "background .2s" }}>
              <span style={{ position: "absolute", top: 2, left: allowGuestPresent ? 20 : 2, width: 18, height: 18, borderRadius: 999, background: "#fff", transition: "left .2s" }} />
            </span>
          </button>
          <div style={{ marginTop: 6, fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, lineHeight: 1.4 }}>
            Khi bật, người xem cũng thấy nút trình chiếu và tự chạy phiên của riêng họ. Mỗi người tự quản lý phiên của mình.
          </div>
        </div>

        <div style={field}>
          <span style={label}>Series (Chapter)</span>
          <input
            value={seriesInput}
            onChange={(e) => { setSeriesInput(e.target.value); setSelectedSeriesId(null); }}
            placeholder="Tên series mới (để trống nếu bài đứng độc lập)"
            style={{ ...input, fontSize: 16 }}
          />
          {mySeries.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              <span style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, alignSelf: "center" }}>Thêm vào series có sẵn:</span>
              {mySeries.map((s) => {
                const active = selectedSeriesId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => { if (active) { setSelectedSeriesId(null); setSeriesInput(""); } else { setSelectedSeriesId(s.id); setSeriesInput(s.name); } }}
                    style={{ padding: "5px 11px", borderRadius: 999, border: `1px solid ${active ? C.gold : C.border}`, background: active ? C.goldSoft : "transparent", color: active ? C.gold : C.textMuted, fontFamily: bodyFont, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    {s.name} · {s.postCount}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 6, fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, lineHeight: 1.4 }}>
            Gom bài vào một bộ (series). Người đọc sẽ vuốt trái/phải giữa các chapter. Chọn series có sẵn để thêm chapter mới, hoặc gõ tên mới.
          </div>
        </div>

        {contentType === "rankie" && (
        <>
        <div style={field}>
          <span style={label}>Phương án bình chọn (kèm hình minh họa)</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {opts.map((o, i) => (
              <div key={i}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {/* Illustration tile — tap to pick emoji */}
                  <button
                    onClick={() => setEmojiPickerFor(emojiPickerFor === i ? null : i)}
                    style={{ padding: 0, border: "none", background: "none", cursor: "pointer", position: "relative" }}
                  >
                    <Illustration emoji={o.emoji} image={o.image} size={44} radius={10} />
                  </button>
                  <input
                    style={{ ...input, flex: 1 }}
                    placeholder={`Phương án ${i + 1}`}
                    value={o.label}
                    onChange={(e) => updateOpt(i, { label: e.target.value })}
                  />
                  {/* Upload button */}
                  <button
                    onClick={() => (o.image ? updateOpt(i, { image: null }) : mockUpload(i))}
                    title={o.image ? "Xóa ảnh" : "Tải ảnh lên"}
                    style={{ padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: o.image ? C.coral : C.textMuted, cursor: "pointer", display: "grid", placeItems: "center" }}
                  >
                    {o.image ? <X size={16} /> : <ImagePlus size={16} />}
                  </button>
                </div>
                {/* Emoji picker row */}
                {emojiPickerFor === i && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, padding: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                    {EMOJI_CHOICES.map((em) => (
                      <button
                        key={em}
                        onClick={() => { updateOpt(i, { emoji: em, image: null }); setEmojiPickerFor(null); }}
                        style={{ fontSize: 20, width: 36, height: 36, borderRadius: 8, border: `1px solid ${o.emoji === em ? C.gold : C.border}`, background: o.emoji === em ? C.goldSoft : C.surfaceRaised, cursor: "pointer" }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addOpt}
            style={{ marginTop: 10, background: "none", border: "none", color: C.teal, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
          >
            <PlusCircle size={14} /> Thêm phương án
          </button>
        </div>

        <div style={field}>
          <span style={label}>Danh mục</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATEGORIES.filter((c) => c.id !== "trending").map((cat) => {
              const val = CATEGORY_NAMES[cat.id];
              const active = category === val;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(val)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: `1px solid ${active ? C.gold : C.border}`,
                    background: active ? C.goldSoft : C.surface,
                    color: active ? C.gold : C.textMuted,
                    fontFamily: bodyFont,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={field}>
          <span style={label}>Kiểu bình chọn</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <OptionRow opt={{ text: "1 phương án", active: votingType === "single" }} on={() => setVotingType("single")} />
            <OptionRow opt={{ text: "Nhiều phương án", active: votingType === "multiple" }} on={() => setVotingType("multiple")} />
            <OptionRow opt={{ text: "Thang điểm", active: votingType === "rating" }} on={() => setVotingType("rating")} />
            <OptionRow opt={{ text: "🔥 Không giới hạn", active: votingType === "unlimited" }} on={() => setVotingType("unlimited")} />
          </div>
          {votingType === "unlimited" && (
            <div style={{ marginTop: 8, fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, lineHeight: 1.4 }}>
              Người bình chọn có thể bấm liên tục nhiều lần cho cùng một phương án — hợp cho fanclub live, bình chọn thần tượng. Kết quả sẽ tách riêng "tổng số vote" và "số người vote".
            </div>
          )}
        </div>

        <div style={field}>
          <span style={label}>Biểu tượng đánh dấu "đã bình chọn"</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setVoteMarkerPickerOpen((v) => !v)}
              style={{ padding: 0, border: "none", background: "none", cursor: "pointer" }}
            >
              {voteMarker ? (
                <Illustration emoji={voteMarker.emoji} image={voteMarker.image} size={44} radius={10} />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    border: `1px dashed ${C.border}`,
                    background: C.surfaceRaised,
                    display: "grid",
                    placeItems: "center",
                    color: C.textFaint,
                    fontFamily: bodyFont,
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                  }}
                >
                  VOTED
                </div>
              )}
            </button>
            <div style={{ flex: 1, fontFamily: bodyFont, fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>
              {voteMarker
                ? "Sticker này sẽ hiện cạnh phương án mà mỗi người đã bình chọn."
                : 'Mặc định hiện nhãn "VOTED". Bấm để chọn sticker hoặc ảnh riêng.'}
            </div>
            {voteMarker && (
              <button
                onClick={() => setVoteMarker(null)}
                title="Dùng lại nhãn mặc định"
                style={{ padding: 8, borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, cursor: "pointer", display: "grid", placeItems: "center" }}
              >
                <X size={15} />
              </button>
            )}
          </div>
          {voteMarkerPickerOpen && (
            <div style={{ marginTop: 8, padding: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {EMOJI_CHOICES.map((em) => (
                  <button
                    key={em}
                    onClick={() => {
                      setVoteMarker({ emoji: em, image: null });
                      setVoteMarkerPickerOpen(false);
                    }}
                    style={{
                      fontSize: 20,
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: `1px solid ${voteMarker?.emoji === em && !voteMarker?.image ? C.gold : C.border}`,
                      background: voteMarker?.emoji === em && !voteMarker?.image ? C.goldSoft : C.surfaceRaised,
                      cursor: "pointer",
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  mockUploadVoteMarker();
                  setVoteMarkerPickerOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 9,
                  border: `1px solid ${C.border}`,
                  background: C.surfaceRaised,
                  color: C.textMuted,
                  fontFamily: bodyFont,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <ImagePlus size={14} /> Tải ảnh riêng lên
              </button>
            </div>
          )}
        </div>

        <div style={field}>
          <span style={label}>Biểu đồ hiển thị</span>
          <div style={{ display: "flex", gap: 8 }}>
            <OptionRow opt={{ text: "Cột ngang", active: chartType === "bar" }} on={() => setChartType("bar")} />
            <OptionRow opt={{ text: "Hình tròn", active: chartType === "pie" }} on={() => setChartType("pie")} />
          </div>
        </div>

        <div style={field}>
          <span style={label}>Đối tượng tham gia</span>
          <div style={{ display: "flex", gap: 8 }}>
            <OptionRow opt={{ text: "🌍 Công khai", active: audience === "public" }} on={() => setAudience("public")} />
            <OptionRow opt={{ text: "🔒 Nhóm riêng", active: audience === "private" }} on={() => setAudience("private")} />
            <OptionRow opt={{ text: "🔗 Link riêng", active: audience === "unlisted" }} on={() => setAudience("unlisted")} />
          </div>
        </div>

        <div style={field}>
          <span style={label}>Thời gian kết thúc bình chọn</span>
          <ClosingTimePicker value={closingTime} onChange={setClosingTime} />
          <div style={{ marginTop: 8, fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, lineHeight: 1.4 }}>
            Sau mốc này, Rankie tự động khóa — không nhận thêm bình chọn nhưng vẫn xem được kết quả. Chọn "Vô hạn" nếu muốn Rankie chạy mãi.
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: 15,
            borderRadius: 12,
            border: "none",
            background: canSubmit ? C.gold : C.surfaceRaised,
            color: canSubmit ? "#1A1305" : C.textFaint,
            fontFamily: bodyFont,
            fontWeight: 700,
            fontSize: 15,
            cursor: canSubmit ? "pointer" : "not-allowed",
            marginTop: 8,
          }}
        >
          {editing ? "Lưu thay đổi" : "Đăng Rankie"}
        </button>
        </>
        )}

        {contentType === "path" && (
        <>
        <div style={field}>
          <span style={label}>Các câu hỏi</span>
          <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, marginBottom: 12, lineHeight: 1.4 }}>
            Với mỗi lựa chọn, chọn <b style={{ color: C.textMuted }}>Kết thúc</b> (dẫn tới một kết quả) hoặc <b style={{ color: C.textMuted }}>Đi tiếp</b> (tới câu hỏi khác). Không cần vẽ sơ đồ — cứ trả lời "sau lựa chọn này, điều gì xảy ra?".
          </div>
          {pathQuestions.map((q, qi) => (
            <div key={q.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: monoFont, fontWeight: 800, fontSize: 12, color: C.gold }}>CÂU {qi + 1}</span>
                {pathQuestions.length > 1 && (
                  <button onClick={() => removeQuestion(q.id)} style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", display: "grid", placeItems: "center", padding: 2 }} title="Xoá câu hỏi">
                    <X size={16} />
                  </button>
                )}
              </div>
              <input style={input} placeholder={`Nội dung câu hỏi ${qi + 1}`} value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })} />
              {/* Ảnh cảnh (Visual Scene) — thủ công, tuỳ chọn. Có thể đặt nút lựa chọn
                  ngay trên ảnh bằng cách chạm (Choice Areas / Hotspot). */}
              {q.sceneImage ? (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{ position: "relative", borderRadius: 10, overflow: "hidden", cursor: placingHotspot && placingHotspot.qid === q.id ? "crosshair" : "default" }}
                    onClick={(e) => {
                      if (!placingHotspot || placingHotspot.qid !== q.id) return;
                      const r = e.currentTarget.getBoundingClientRect();
                      const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10;
                      const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
                      setAnswerHotspot(q.id, placingHotspot.aid, { x: Math.max(8, Math.min(92, x)), y: Math.max(10, Math.min(90, y)) });
                      setPlacingHotspot(null);
                    }}
                  >
                    <img src={q.sceneImage} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
                    {/* Marker các nút đã đặt vị trí */}
                    {q.answers.filter((a) => a.hotspot).map((a) => (
                      <div key={a.id} style={{ position: "absolute", left: `${a.hotspot.x}%`, top: `${a.hotspot.y}%`, transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 999, background: "rgba(18,14,7,0.85)", border: `1.5px solid ${C.gold}`, color: "#fff", fontFamily: bodyFont, fontWeight: 700, fontSize: 11.5, whiteSpace: "nowrap", pointerEvents: "none" }}>
                        {a.emoji} {a.label.trim() || "(lựa chọn)"}
                      </div>
                    ))}
                    {placingHotspot && placingHotspot.qid === q.id && (
                      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.4)", fontFamily: bodyFont, fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "center", padding: 16 }}>
                        👆 Chạm vào vị trí muốn đặt nút
                      </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); updateQuestion(q.id, { sceneImage: null }); setPlacingHotspot(null); }} style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 999, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", zIndex: 2 }} title="Xoá ảnh cảnh">
                      <X size={14} />
                    </button>
                  </div>
                  {/* Chip chọn nút để đặt vị trí trên ảnh */}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, marginBottom: 6 }}>Đặt nút lựa chọn lên ảnh (tuỳ chọn):</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {q.answers.map((a) => {
                        const active = placingHotspot && placingHotspot.qid === q.id && placingHotspot.aid === a.id;
                        const placed = !!a.hotspot;
                        return (
                          <div key={a.id} style={{ display: "flex", alignItems: "center" }}>
                            <button
                              onClick={() => setPlacingHotspot(active ? null : { qid: q.id, aid: a.id })}
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: placed ? "999px 0 0 999px" : 999, border: `1px solid ${active ? C.gold : placed ? C.teal : C.border}`, background: active ? C.goldSoft : placed ? `${C.teal}15` : "transparent", color: active ? C.gold : placed ? C.teal : C.textMuted, fontFamily: bodyFont, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                            >
                              {placed && <Check size={11} />}{a.emoji} {a.label.trim() || "(lựa chọn)"}
                              {active && " · chạm ảnh"}
                            </button>
                            {placed && (
                              <button onClick={() => setAnswerHotspot(q.id, a.id, null)} style={{ padding: "6px 7px", borderRadius: "0 999px 999px 0", border: `1px solid ${C.teal}`, borderLeft: "none", background: `${C.teal}15`, color: C.textFaint, cursor: "pointer", display: "grid", placeItems: "center" }} title="Gỡ vị trí">
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={() => mockUploadScene(q.id)} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 9, border: `1px dashed ${C.border}`, background: "transparent", color: C.textMuted, fontFamily: bodyFont, fontSize: 12, cursor: "pointer" }}>
                  <ImagePlus size={14} /> Thêm ảnh cảnh (tuỳ chọn)
                </button>
              )}
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {q.answers.map((a, ai) => (
                  <div key={a.id}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => setPathEmojiPickerFor(pathEmojiPickerFor === `a:${q.id}:${a.id}` ? null : `a:${q.id}:${a.id}`)} style={{ padding: 0, border: "none", background: "none", cursor: "pointer", flexShrink: 0 }}>
                        <Illustration emoji={a.emoji} image={a.image} size={38} radius={9} />
                      </button>
                      <input style={{ ...input, flex: 1 }} placeholder={`Lựa chọn ${ai + 1}`} value={a.label} onChange={(e) => updateAnswer(q.id, a.id, { label: e.target.value })} />
                      {q.answers.length > 2 && (
                        <button onClick={() => removeAnswer(q.id, a.id)} style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", padding: 4 }} title="Xoá lựa chọn">
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, marginLeft: 46 }}>
                      <span style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, flexShrink: 0 }}>Sau đó →</span>
                      <select
                        value={`${a.target.type}:${a.target.id}`}
                        onChange={(e) => setAnswerTarget(q.id, a.id, e.target.value)}
                        style={{ flex: 1, padding: "7px 9px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.surfaceRaised, color: C.text, fontFamily: bodyFont, fontSize: 12.5, cursor: "pointer" }}
                      >
                        <optgroup label="🏁 Kết thúc tại kết quả">
                          {pathEndings.map((e, ei) => (
                            <option key={e.id} value={`ending:${e.id}`}>{e.emoji} {e.name.trim() || `Kết quả ${ei + 1}`}</option>
                          ))}
                        </optgroup>
                        <optgroup label="➡️ Đi tiếp tới câu hỏi">
                          {pathQuestions.filter((qq) => qq.id !== q.id).map((qq) => {
                            const idx = pathQuestions.findIndex((x) => x.id === qq.id);
                            return <option key={qq.id} value={`question:${qq.id}`}>Câu {idx + 1}{qq.text.trim() ? `: ${qq.text.trim().slice(0, 20)}` : ""}</option>;
                          })}
                          <option value="__newq__">➕ Tạo câu hỏi mới…</option>
                        </optgroup>
                      </select>
                    </div>
                    {pathEmojiPickerFor === `a:${q.id}:${a.id}` && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, padding: 10, background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                        {EMOJI_CHOICES.map((em) => (
                          <button key={em} onClick={() => { updateAnswer(q.id, a.id, { emoji: em, image: null }); setPathEmojiPickerFor(null); }} style={{ fontSize: 20, width: 36, height: 36, borderRadius: 8, border: `1px solid ${a.emoji === em ? C.gold : C.border}`, background: a.emoji === em ? C.goldSoft : C.surface, cursor: "pointer" }}>{em}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {q.answers.length < 4 && (
                <button onClick={() => addAnswer(q.id)} style={{ marginTop: 10, background: "none", border: "none", color: C.teal, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <PlusCircle size={14} /> Thêm lựa chọn
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={field}>
          <span style={label}>Các kết quả · {validEndings.length} kết quả</span>
          <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: validEndings.length >= 2 && validEndings.length <= 5 ? C.textFaint : C.gold, marginBottom: 10, lineHeight: 1.4 }}>
            {validEndings.length > 5
              ? "Trên 5 kết quả: bình luận & cộng đồng sẽ chuyển sang dạng chung cho cả Path."
              : "Khuyến nghị 2–5 kết quả. Nhiều lựa chọn có thể dẫn về cùng một kết quả."}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pathEndings.map((e, ei) => (
              <div key={e.id}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => setPathEmojiPickerFor(pathEmojiPickerFor === `e:${e.id}` ? null : `e:${e.id}`)} style={{ padding: 0, border: "none", background: "none", cursor: "pointer", flexShrink: 0 }}>
                    <Illustration emoji={e.emoji} image={e.image} size={44} radius={10} />
                  </button>
                  <input style={{ ...input, flex: 1 }} placeholder={`Kết quả ${ei + 1} (VD: Nhà quản lý)`} value={e.name} onChange={(ev) => updateEnding(e.id, { name: ev.target.value })} />
                  <button onClick={() => (e.image ? updateEnding(e.id, { image: null }) : mockUploadEnding(e.id, e.emoji))} title={e.image ? "Xoá ảnh" : "Tải ảnh lên"} style={{ padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: e.image ? C.coral : C.textMuted, cursor: "pointer", display: "grid", placeItems: "center" }}>
                    {e.image ? <X size={16} /> : <ImagePlus size={16} />}
                  </button>
                  {pathEndings.length > 2 && (
                    <button onClick={() => removeEnding(e.id)} style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", padding: 4 }} title="Xoá kết quả">
                      <X size={15} />
                    </button>
                  )}
                </div>
                {pathEmojiPickerFor === `e:${e.id}` && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, padding: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                    {EMOJI_CHOICES.map((em) => (
                      <button key={em} onClick={() => { updateEnding(e.id, { emoji: em, image: null }); setPathEmojiPickerFor(null); }} style={{ fontSize: 20, width: 36, height: 36, borderRadius: 8, border: `1px solid ${e.emoji === em ? C.gold : C.border}`, background: e.emoji === em ? C.goldSoft : C.surfaceRaised, cursor: "pointer" }}>{em}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {pathEndings.length < 8 && (
            <button onClick={addEnding} style={{ marginTop: 10, background: "none", border: "none", color: C.teal, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <PlusCircle size={14} /> Thêm kết quả
            </button>
          )}
        </div>

        {/* Sơ đồ nhánh — xem tổng quan luồng đi (tài liệu Builder: branch map). Dạng cây
            văn bản gọn cho mobile, không cần kéo-thả. */}
        <div style={field}>
          <button onClick={() => setShowFlowMap((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderRadius: 12, background: C.surfaceRaised, border: `1px solid ${C.border}`, cursor: "pointer" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: C.text }}>
              <GitBranch size={15} color={C.teal} /> Sơ đồ nhánh Path
            </span>
            <ChevronDown size={16} color={C.textFaint} style={{ transform: showFlowMap ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>
          {showFlowMap && (
            <div style={{ marginTop: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              {pathQuestions.map((q, qi) => (
                <div key={q.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                    <span style={{ fontFamily: monoFont, fontWeight: 800, fontSize: 11, color: "#1A1305", background: C.gold, padding: "2px 7px", borderRadius: 6 }}>CÂU {qi + 1}</span>
                    <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.text.trim() || "(chưa có nội dung)"}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: 12, borderLeft: `2px solid ${C.border}`, marginLeft: 6 }}>
                    {q.answers.filter((a) => a.label.trim() || a.target).map((a) => {
                      const toQ = a.target.type === "question";
                      const qIdx = toQ ? pathQuestions.findIndex((x) => x.id === a.target.id) : -1;
                      const endName = !toQ ? endingName(a.target.id) : "";
                      return (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 12 }}>
                          <span style={{ color: C.textMuted }}>{a.label.trim() || "(lựa chọn)"}</span>
                          <ChevronRight size={13} color={C.textFaint} />
                          {toQ ? (
                            <span style={{ color: C.teal, fontWeight: 600 }}>Câu {qIdx + 1}</span>
                          ) : (
                            <span style={{ color: C.gold, fontWeight: 600 }}>🏁 {endName || "(kết quả)"}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {validEndings.map((e) => (
                  <span key={e.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: bodyFont, fontSize: 11.5, color: C.gold, background: C.goldSoft, padding: "3px 9px", borderRadius: 999 }}>{e.emoji} {e.name.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={field}>

          {/* Chế độ tiết lộ kết quả cho người chơi (tài liệu PATH: 4 mức) */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 3 }}>Tiết lộ kết quả chưa khám phá</div>
            <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, marginBottom: 8 }}>Kiểm soát người chơi thấy gì về các kết quả họ chưa mở</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "hidden", label: "Ẩn hết", desc: "Giữ bí ẩn tối đa, khuyến khích chơi lại" },
                { id: "names", label: "Chỉ hiện tên", desc: "Thấy tên kết quả nhưng không thấy số liệu" },
                { id: "stats", label: "Chỉ hiện thống kê", desc: "Thấy % phân bố nhưng không biết là gì" },
                { id: "all", label: "Hiện tất cả", desc: "Lộ toàn bộ tên và số liệu" },
              ].map((m) => {
                const active = pathRevealMode === m.id;
                return (
                  <button key={m.id} onClick={() => setPathRevealMode(m.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: active ? C.goldSoft : C.surfaceRaised, border: `1px solid ${active ? C.gold : C.border}`, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? C.gold : C.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      {active && <div style={{ width: 9, height: 9, borderRadius: "50%", background: C.gold }} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: C.text }}>{m.label}</div>
                      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, marginTop: 1 }}>{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ẩn số kết quả — chỉ áp dụng khi ẩn hết: người chơi không biết còn bao nhiêu
              ending, khuyến khích chơi lại để khám phá. */}
          {pathRevealMode === "hidden" && (
            <button
              onClick={() => setHidePathEndingCount((v) => !v)}
              style={{ marginTop: 10, width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 12, background: hidePathEndingCount ? C.goldSoft : C.surfaceRaised, border: `1px solid ${hidePathEndingCount ? C.gold : C.border}`, cursor: "pointer", textAlign: "left" }}
            >
              <div style={{ width: 34, height: 20, borderRadius: 999, background: hidePathEndingCount ? C.gold : C.border, position: "relative", flexShrink: 0, transition: "background 0.15s" }}>
                <div style={{ position: "absolute", top: 2, left: hidePathEndingCount ? 16 : 2, width: 16, height: 16, borderRadius: 999, background: "#fff", transition: "left 0.15s" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: C.text }}>Ẩn số lượng kết quả</div>
                <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, marginTop: 1 }}>Người chơi không biết còn bao nhiêu kết quả — tăng tò mò</div>
              </div>
            </button>
          )}

          <div style={{ marginTop: 8, fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, lineHeight: 1.4 }}>
            Path nhiều tầng: mỗi lựa chọn có thể dẫn tới câu hỏi khác hoặc một kết quả. Nhiều lựa chọn có thể về chung một kết quả. Sau khi đăng, Path xuất hiện trên bảng tin và tường cá nhân.
          </div>
        </div>

        <button
          onClick={submitPath}
          disabled={!canSubmitPath}
          style={{
            width: "100%",
            padding: 15,
            borderRadius: 12,
            border: "none",
            background: canSubmitPath ? C.gold : C.surfaceRaised,
            color: canSubmitPath ? "#1A1305" : C.textFaint,
            fontFamily: bodyFont,
            fontWeight: 700,
            fontSize: 15,
            cursor: canSubmitPath ? "pointer" : "not-allowed",
            marginTop: 8,
          }}
        >
          {editing ? "Lưu thay đổi" : "Đăng Path"}
        </button>
        </>
        )}

        {(contentType === "deck" || contentType === "exam") && (
        <>
        {deckMode === "survey" && (
          <div style={field}>
            <span style={label}>Kiểu trả lời</span>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "step", label: "Từng câu một", desc: "Xong mới qua câu sau" },
                { id: "scroll", label: "Một trang", desc: "Cuộn trả lời tất cả" },
              ].map((m) => (
                <button key={m.id} onClick={() => setDeckAnswerMode(m.id)}
                  style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: `1px solid ${deckAnswerMode === m.id ? C.gold : C.border}`, background: deckAnswerMode === m.id ? C.goldSoft : C.surface, color: deckAnswerMode === m.id ? C.gold : C.textMuted, fontFamily: bodyFont, fontWeight: 700, fontSize: 12.5, cursor: "pointer", lineHeight: 1.3, textAlign: "center" }}>
                  {m.label}
                  <div style={{ fontSize: 9.5, fontWeight: 500, opacity: 0.85, marginTop: 2 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {deckMode === "exam" && (
          <div style={field}>
            <span style={label}>Thời gian làm bài</span>
            <div style={{ display: "flex", gap: 8, marginBottom: examDurationUnlimited ? 0 : 10 }}>
              {[
                { id: true, text: "Không giới hạn" },
                { id: false, text: "Có giới hạn" },
              ].map((o) => (
                <button key={String(o.id)} onClick={() => setExamDurationUnlimited(o.id)}
                  style={{ flex: 1, padding: "9px 8px", borderRadius: 10, border: `1px solid ${examDurationUnlimited === o.id ? C.gold : C.border}`, background: examDurationUnlimited === o.id ? C.goldSoft : C.surface, color: examDurationUnlimited === o.id ? C.gold : C.textMuted, fontFamily: bodyFont, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                  {o.text}
                </button>
              ))}
            </div>
            {!examDurationUnlimited && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number" min={1} step={1}
                  value={examDurationValue}
                  onChange={(e) => setExamDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: 76, padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.gold, fontFamily: monoFont, fontWeight: 700, fontSize: 15, textAlign: "center" }}
                />
                <select
                  value={examDurationUnit}
                  onChange={(e) => setExamDurationUnit(e.target.value)}
                  style={{ padding: "9px 10px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  <option value="giay">Giây</option>
                  <option value="phut">Phút</option>
                  <option value="gio">Giờ</option>
                  <option value="ngay">Ngày</option>
                </select>
              </div>
            )}
          </div>
        )}

        {deckMode === "exam" && (
          <div style={field}>
            <span style={label}>Điểm đạt (thang 10)</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number" min={0} max={10} step={0.1}
                value={examPassingScore}
                onChange={(e) => setExamPassingScore(Math.max(0, Math.min(10, parseFloat(e.target.value.replace(",", ".")) || 0)))}
                style={{ width: 84, padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.gold, fontFamily: monoFont, fontWeight: 700, fontSize: 15, textAlign: "center" }}
              />
              <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textFaint }}>/ 10 — ví dụ 7,5</span>
            </div>
          </div>
        )}

        <div style={field}>
          <span style={label}>Danh sách câu hỏi</span>
          {deckMode === "exam" && (
            <div style={{ ...captionText, marginBottom: 10, lineHeight: 1.4 }}>
              Điểm mỗi câu tự chia đều, tổng luôn bằng 10. Bấm vào ô điểm để tự chỉnh — phần còn lại tự tính lại cho đủ 10.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {deckQuestions.map((q, qi) => (
              <div key={qi} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: C.gold }}>
                    Câu {qi + 1}
                    {deckMode === "exam" && (
                      <span style={{ marginLeft: 6, color: C.textFaint, fontWeight: 500 }}>·</span>
                    )}
                    {deckMode === "exam" && (
                      <span style={{ marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <input type="number" min={0} max={10} step={0.1}
                          value={examDeckQuestions[qi]?.points ?? 1}
                          onChange={(e) => setQuestionPoints(qi, Math.max(0, Math.min(10, parseFloat(e.target.value.replace(",", ".")) || 0)))}
                          title="Bấm để tự chỉnh điểm câu này — phần còn lại sẽ tự chia lại cho đủ 10 điểm"
                          style={{ width: 40, background: C.surfaceRaised, border: `1px solid ${q.pointsLocked ? C.gold : C.border}`, borderRadius: 6, color: C.teal, fontFamily: monoFont, fontWeight: 700, fontSize: 12, textAlign: "center", padding: "2px 4px" }}
                        /> <span style={{ color: C.textFaint, fontSize: 11, fontWeight: 500 }}>điểm</span>
                        {q.pointsLocked && (
                          <button onClick={() => resetQuestionPoints(qi)} title="Chia đều lại"
                            style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", padding: 0, display: "flex" }}>
                            <ArchiveRestore size={12} />
                          </button>
                        )}
                      </span>
                    )}
                  </span>
                  {deckQuestions.length > 1 && (
                    <button onClick={() => removeDeckQuestion(qi)} style={{ background: "none", border: "none", color: C.coral, cursor: "pointer", padding: 2 }}>
                      <X size={15} />
                    </button>
                  )}
                </div>

                <input style={{ ...input, marginBottom: 8 }} placeholder="Nội dung câu hỏi"
                  value={q.text} onChange={(e) => updateDeckQ(qi, { text: e.target.value })} />

                {/* voting type — dropdown, same options family for both Survey and Exam */}
                <select
                  value={q.votingType}
                  onChange={(e) => updateDeckQ(qi, { votingType: e.target.value })}
                  style={{ ...input, marginBottom: 10, padding: "8px 10px", fontSize: 12.5, cursor: "pointer" }}
                >
                  <option value="single">{deckMode === "exam" ? "Chọn 1 đáp án" : "1 phương án"}</option>
                  <option value="multiple">{deckMode === "exam" ? "Chọn nhiều đáp án" : "Nhiều phương án"}</option>
                  {deckMode === "survey" && <option value="rating">Thang sao</option>}
                  <option value="text">Dạng text (tự luận)</option>
                </select>

                {/* options */}
                {q.votingType === "rating" ? (
                  <div style={captionText}>Thang 1–5 sao, không cần nhập phương án.</div>
                ) : q.votingType === "text" ? (
                  deckMode === "exam" ? (
                    <div>
                      <textarea
                        placeholder="Đáp án mẫu / từ khoá chấm điểm (tuỳ chọn) — VD: quang hợp, diệp lục, ánh sáng"
                        value={q.answerKey || ""}
                        onChange={(e) => updateDeckQ(qi, { answerKey: e.target.value })}
                        rows={2}
                        style={{ ...input, width: "100%", resize: "vertical", fontFamily: bodyFont, fontSize: 12.5, padding: "8px 10px" }}
                      />
                      <div style={{ ...captionText, marginTop: 6, lineHeight: 1.4 }}>
                        Có đáp án mẫu → hệ thống tự gợi ý điểm dựa trên từ khoá trùng khớp khi có kết quả; bạn xem lại và chốt điểm trước khi công bố. Không nhập thì chấm hoàn toàn thủ công.
                      </div>
                    </div>
                  ) : (
                    <div style={{ ...captionText, fontStyle: "italic" }}>
                      Người tham gia tự nhập câu trả lời dạng văn bản tự do.
                    </div>
                  )
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {q.options.map((o, oi) => (
                      <div key={oi} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {deckMode === "exam" && (
                          <button
                            onClick={() => toggleCorrect(qi, oi)}
                            title={o.correct ? "Bỏ đáp án đúng" : "Đánh dấu đáp án đúng"}
                            style={{
                              width: 26, height: 26, borderRadius: q.votingType === "multiple" ? 6 : 99,
                              border: `2px solid ${o.correct ? "#4ADE80" : C.border}`,
                              background: o.correct ? "#4ADE8022" : "transparent",
                              display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer",
                            }}
                          >
                            {o.correct && <Check size={13} color="#4ADE80" />}
                          </button>
                        )}
                        <input
                          style={{ ...input, flex: 1, padding: "8px 10px", fontSize: 13,
                            borderColor: deckMode === "exam" && o.correct ? "#4ADE8055" : undefined,
                            background: deckMode === "exam" && o.correct ? "#4ADE8011" : C.surface,
                          }}
                          placeholder={`Phương án ${oi + 1}`}
                          value={o.label}
                          onChange={(e) => updateDeckOpt(qi, oi, e.target.value)}
                        />
                        {q.options.length > 2 && (
                          <button onClick={() => removeDeckOpt(qi, oi)} style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", padding: 4, flexShrink: 0 }}>
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {deckMode === "exam" && !q.options.some((o) => o.correct) && (
                      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.coral, marginTop: 2 }}>
                        ⚠️ Chọn ít nhất 1 đáp án đúng (bấm vào ô tròn/vuông bên trái)
                      </div>
                    )}
                    <button onClick={() => addDeckOpt(qi)}
                      style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.teal, fontFamily: bodyFont, fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <PlusCircle size={13} /> Thêm phương án
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={addDeckQuestion}
            style={{ marginTop: 12, width: "100%", padding: 11, borderRadius: 10, border: `1px dashed ${C.border}`, background: "transparent", color: C.teal, fontFamily: bodyFont, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <PlusCircle size={15} /> Thêm câu hỏi
          </button>
          <div style={{ marginTop: 10, fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, lineHeight: 1.4 }}>
            {deckMode === "exam" ? "Bài thi chấm điểm tự động · Kết quả hiện sau khi host kết thúc" : "Survey khảo sát · Bấm Trình chiếu để thu thập phản hồi tại chỗ."}
          </div>
        </div>

        <button onClick={submitDeck} disabled={!canSubmitDeck}
          style={{ width: "100%", padding: 15, borderRadius: 12, border: "none", background: canSubmitDeck ? C.gold : C.surfaceRaised, color: canSubmitDeck ? "#1A1305" : C.textFaint, fontFamily: bodyFont, fontWeight: 700, fontSize: 15, cursor: canSubmitDeck ? "pointer" : "not-allowed", marginTop: 8 }}>
          {editing ? "Lưu thay đổi" : (deckMode === "exam" ? "📝 Đăng Bài thi" : "📋 Đăng Survey")}
        </button>
        {!canSubmitDeck && deckSubmitIssues.length > 0 && (
          <div style={{ marginTop: 8, fontFamily: bodyFont, fontSize: 11.5, color: C.coral, lineHeight: 1.5 }}>
            Còn thiếu: {deckSubmitIssues.join(" · ")}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

// ---------- NAV ----------
// ---------- CHAT ----------
function chatTimeAgo(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "vừa xong";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  return `${Math.floor(h / 24)} ngày`;
}

function Avatar({ author, size = 42 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: author.avatarColor || C.goldSoft,
      display: "grid", placeItems: "center",
      fontSize: size * 0.45, flexShrink: 0,
      border: `2px solid ${C.border}`,
    }}>
      {author.avatarEmoji}
    </div>
  );
}

function OnlineDot({ online, size = 42 }) {
  if (!online) return null;
  return (
    <div style={{
      position: "absolute", bottom: 1, right: 1,
      width: 11, height: 11, borderRadius: 999,
      background: "#4ADE80", border: `2px solid ${C.bg}`,
    }} />
  );
}

// Quick-reaction emojis (TikTok DM style)
const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👏", "🔥"];

function ChatListView({ contacts, messages, onOpen, onBack }) {
  const [search, setSearch] = useState("");
  const filtered = contacts.filter((c) =>
    c.author.name.toLowerCase().includes(search.toLowerCase()) ||
    c.author.handle.toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "18px 16px 10px",
        borderBottom: `1px solid ${C.border}`,
        position: "sticky", top: 0, background: C.bg, zIndex: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: displayFont, fontStyle: "italic", fontSize: 22, color: C.text }}>
            Tin nhắn
            {totalUnread > 0 && (
              <span style={{
                marginLeft: 8, fontSize: 12, fontStyle: "normal", fontFamily: bodyFont,
                background: C.coral, color: "#fff", borderRadius: 999,
                padding: "2px 7px", verticalAlign: "middle", fontWeight: 700,
              }}>{totalUnread}</span>
            )}
          </div>
          <button style={{ ...iconButton, color: C.gold }}>
            <Edit3 size={19} />
          </button>
        </div>
        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: C.surfaceRaised, borderRadius: 12,
          border: `1px solid ${C.border}`, padding: "9px 12px",
        }}>
          <Search size={15} color={C.textFaint} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            style={{
              background: "none", border: "none", outline: "none",
              color: C.text, fontFamily: bodyFont, fontSize: 14, flex: 1,
            }}
          />
        </div>
      </div>

      {/* Online avatars strip */}
      <div style={{
        display: "flex", gap: 14, padding: "12px 16px",
        overflowX: "auto", scrollbarWidth: "none",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {contacts.filter((c) => c.author.online !== false).map((c) => (
          <div
            key={c.id}
            onClick={() => onOpen(c)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", flexShrink: 0 }}
          >
            <div style={{ position: "relative" }}>
              <Avatar author={c.author} size={48} />
              <div style={{
                position: "absolute", bottom: 1, right: 1,
                width: 12, height: 12, borderRadius: 999,
                background: "#4ADE80", border: `2px solid ${C.bg}`,
              }} />
            </div>
            <span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.textMuted, maxWidth: 52, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.author.name.split(" ").slice(-1)[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.textFaint, fontFamily: bodyFont, fontSize: 13 }}>
            Không tìm thấy cuộc trò chuyện
          </div>
        )}
        {filtered.map((c) => {
          const lastMsgs = messages[c.id] || [];
          const last = lastMsgs[lastMsgs.length - 1];
          return (
            <div
              key={c.id}
              onClick={() => onOpen(c)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", cursor: "pointer",
                borderBottom: `1px solid ${C.border}`,
                background: c.unread > 0 ? "rgba(212,169,74,0.04)" : "transparent",
                transition: "background 0.15s",
              }}
            >
              <div style={{ position: "relative" }}>
                <Avatar author={c.author} size={50} />
                {c.author.online && (
                  <div style={{
                    position: "absolute", bottom: 1, right: 1,
                    width: 12, height: 12, borderRadius: 999,
                    background: "#4ADE80", border: `2px solid ${C.bg}`,
                  }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: bodyFont, fontWeight: c.unread > 0 ? 700 : 600, fontSize: 14.5, color: C.text }}>
                    {c.author.name}
                    {SHOW_VERIFIED && c.author.verified && <span style={{ marginLeft: 4, fontSize: 11, color: C.teal }}>✓</span>}
                  </span>
                  <span style={{ fontFamily: bodyFont, fontSize: 11, color: C.textFaint, flexShrink: 0, marginLeft: 8 }}>
                    {chatTimeAgo(last?.time || c.lastTime)}
                  </span>
                </div>
                <div style={{
                  fontFamily: bodyFont, fontSize: 13, marginTop: 2,
                  color: c.unread > 0 ? C.text : C.textFaint,
                  fontWeight: c.unread > 0 ? 600 : 400,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {last?.from === "me" ? "Bạn: " : ""}{last?.text || c.lastMsg}
                </div>
              </div>
              {c.unread > 0 && (
                <div style={{
                  width: 20, height: 20, borderRadius: 999,
                  background: C.coral, color: "#fff",
                  display: "grid", placeItems: "center",
                  fontFamily: bodyFont, fontWeight: 700, fontSize: 11, flexShrink: 0,
                }}>
                  {c.unread}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatDetailView({ contact, messages, onSend, onBack }) {
  const [text, setText] = useState("");
  const [reacting, setReacting] = useState(null); // message id being reacted to
  const [reactions, setReactions] = useState({}); // { msgId: emoji }
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Simulate "họ đang nhập..." after user sends
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
    // Simulate reply after ~1.5s
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const replies = [
        "Haha đúng vậy! 😄",
        "Bạn vote đội nào rồi?",
        "Mình cũng nghĩ thế 🔥",
        "Thú vị quá nhỉ!",
        "Oke mình sẽ thử ngay!",
        "👍",
        "Rankev hay thật sự luôn",
      ];
      onSend(replies[Math.floor(Math.random() * replies.length)], "them");
    }, 1400 + Math.random() * 800);
  };

  const addReaction = (msgId, emoji) => {
    setReactions((prev) => ({ ...prev, [msgId]: emoji }));
    setReacting(null);
  };

  const author = contact.author;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.bg }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px", borderBottom: `1px solid ${C.border}`,
        background: C.bg, position: "sticky", top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{ ...iconButton, color: C.text }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ position: "relative" }}>
          <Avatar author={author} size={38} />
          {author.online && (
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 10, height: 10, borderRadius: 999,
              background: "#4ADE80", border: `2px solid ${C.bg}`,
            }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 15, color: C.text, lineHeight: 1.1 }}>
            {author.name}
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: author.online ? "#4ADE80" : C.textFaint }}>
            {author.online ? "Đang hoạt động" : "Không hoạt động"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ ...iconButton, color: C.textMuted }}>
            <Phone size={18} />
          </button>
          <button style={{ ...iconButton, color: C.textMuted }}>
            <Video size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        onClick={() => setReacting(null)}
        style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}
      >
        {/* Date separator */}
        <div style={{ textAlign: "center", margin: "8px 0" }}>
          <span style={{ ...captionText, background: C.surfaceRaised, padding: "3px 10px", borderRadius: 999 }}>
            Hôm nay
          </span>
        </div>

        {messages.map((msg, idx) => {
          const isMe = msg.from === "me";
          const prevMsg = messages[idx - 1];
          const showAvatar = !isMe && (prevMsg?.from !== "them");
          const reaction = reactions[msg.id];

          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, maxWidth: "80%", flexDirection: isMe ? "row-reverse" : "row" }}>
                {/* Avatar placeholder for alignment */}
                <div style={{ width: 28, flexShrink: 0 }}>
                  {showAvatar && <Avatar author={author} size={28} />}
                </div>

                <div style={{ position: "relative" }}>
                  {/* Message bubble */}
                  <div
                    onDoubleClick={() => setReacting(msg.id)}
                    style={{
                      padding: "9px 13px",
                      borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isMe ? C.gold : C.surfaceRaised,
                      color: isMe ? "#1A1305" : C.text,
                      fontFamily: bodyFont, fontSize: 14, lineHeight: 1.45,
                      cursor: "default",
                      border: isMe ? "none" : `1px solid ${C.border}`,
                      wordBreak: "break-word",
                      transition: "transform 0.1s",
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* Reaction bubble */}
                  {reaction && (
                    <div style={{
                      position: "absolute", bottom: -10,
                      [isMe ? "left" : "right"]: 4,
                      background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: 999, padding: "1px 5px", fontSize: 13,
                    }}>
                      {reaction}
                    </div>
                  )}

                  {/* Quick reaction picker */}
                  {reacting === msg.id && (
                    <div style={{
                      position: "absolute", bottom: "110%",
                      [isMe ? "right" : "left"]: 0,
                      display: "flex", gap: 4,
                      background: C.surfaceRaised, border: `1px solid ${C.border}`,
                      borderRadius: 999, padding: "6px 10px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                      zIndex: 20, animation: "popIn 0.15s ease",
                    }}>
                      {QUICK_REACTIONS.map((e) => (
                        <button
                          key={e}
                          onClick={(ev) => { ev.stopPropagation(); addReaction(msg.id, e); }}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: "2px 3px", lineHeight: 1 }}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamp (show on last message or when sender changes) */}
              {(idx === messages.length - 1 || messages[idx + 1]?.from !== msg.from) && (
                <div style={{
                  ...captionText, marginTop: 3, marginBottom: 4,
                  marginLeft: isMe ? 0 : 34, marginRight: isMe ? 0 : 0,
                }}>
                  {chatTimeAgo(msg.time)}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {typing && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <Avatar author={author} size={28} />
            <div style={{
              padding: "10px 14px", borderRadius: "18px 18px 18px 4px",
              background: C.surfaceRaised, border: `1px solid ${C.border}`,
              display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: 999, background: C.textFaint,
                  animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 12px",
        borderTop: `1px solid ${C.border}`,
        background: C.bg,
        paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))",
      }}>
        <button style={{ ...iconButton, color: C.textMuted }}>
          <ImageIcon size={21} />
        </button>
        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          background: C.surfaceRaised, borderRadius: 999,
          border: `1px solid ${C.border}`, padding: "8px 14px", gap: 8,
        }}>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Nhắn tin..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: C.text, fontFamily: bodyFont, fontSize: 14,
            }}
          />
          <button style={{ ...iconButton, color: C.textMuted, padding: 0 }}>
            <Smile size={18} />
          </button>
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            width: 38, height: 38, borderRadius: 999,
            background: text.trim() ? C.gold : C.surfaceRaised,
            border: `1px solid ${text.trim() ? C.gold : C.border}`,
            display: "grid", placeItems: "center", cursor: text.trim() ? "pointer" : "default",
            transition: "all 0.15s", flexShrink: 0,
          }}
        >
          <Send size={16} color={text.trim() ? "#1A1305" : C.textFaint} />
        </button>
      </div>
    </div>
  );
}

function BottomNav({ active, setView, chatUnread = 0 }) {
  const items = [
    { id: "feed", icon: Home, label: "Bảng tin" },
    { id: "create", icon: PlusCircle, label: "Tạo mới" },
    { id: "chat", icon: MessageCircle, label: "Tin nhắn", badge: chatUnread },
    { id: "profile", icon: User, label: "Hồ sơ" },
  ];
  return (
    <div
      style={{
        display: "flex",
        borderTop: `1px solid ${C.border}`,
        background: C.bg,
        padding: "8px 4px",
        position: "sticky",
        bottom: 0,
      }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setView(it.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              background: "none",
              border: "none",
              color: isActive ? C.gold : C.textFaint,
              padding: "6px 0",
              cursor: "pointer",
              fontFamily: bodyFont,
            }}
          >
            <div style={{ position: "relative" }}>
              <Icon size={20} fill={isActive && it.id === "create" ? C.gold : "none"} />
              {it.badge > 0 && (
                <div style={{
                  position: "absolute", top: -4, right: -6,
                  minWidth: 16, height: 16, borderRadius: 999,
                  background: C.coral, color: "#fff",
                  display: "grid", placeItems: "center",
                  fontFamily: bodyFont, fontWeight: 700, fontSize: 9,
                  border: `1.5px solid ${C.bg}`, padding: "0 3px",
                }}>
                  {it.badge}
                </div>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Shows the profile / wall for one author. When authorId is omitted (or "me"),
// this renders the current user's own profile with edit controls; otherwise it
// renders a read-only wall for whichever author was tapped from a card,
// showing every Rankie/Path/Deck that person has posted.
function ProfileView({
  posts,
  authorId,
  onLogout,
  onChangeAvatar,
  onEditStructure,
  votedMap,
  participatedKeys,
  participationByKey,
  pathUnlocks,
  sessionCounts,
  deckSessionCounts,
  pathSessionCounts,
  onBumpShares,
  bookmarks,
  onToggleBookmark,
  participationHistory,
  onRemoveHistory,
  onClearHistory,
  presentationHistory,
  onOpenRankie,
  onOpenPath,
  onOpenDeck,
  onOpenAuthor,
  onOpenHistory,
  onOpenPresentationHistory,
  onOpenSession,
  rankTier = 0,
  onSetRank,
  fanCount = 0,
  onOpenBookmarks,
  onShareToProfile,
  onBack,
  onPin,
  onHide,
  onEdit,
  onDuplicate,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
  onCycleVisibility,
  contacts,
}) {
  const [tab, setTab] = useState("posts"); // posts | rankies | paths | decks | trash (bộ lọc con trong tab Bài viết)
  const [mainTab, setMainTab] = useState("posts"); // posts | participation | presentation | bookmarks — tab lớn kiểu Instagram
  const [query, setQuery] = useState(""); // in-profile search text
  const [showSearch, setShowSearch] = useState(false);
  const [showStatsDetail, setShowStatsDetail] = useState(false);
  const [shareTarget, setShareTarget] = useState(null); // rankie currently open in the share sheet
  const [editingPost, setEditingPost] = useState(null); // post currently open in the edit modal
  const [statsPost, setStatsPost] = useState(null); // post currently open in the stats modal
  const [confirmDelete, setConfirmDelete] = useState(null); // post pending permanent-delete confirmation

  const targetId = authorId || "me";
  const isMe = targetId === "me";
  const canManage = isMe && !!onPin; // management actions are only wired up for "my profile"
  const author = AUTHORS[targetId] || currentUser;

  const theirPostsAll = posts
    .filter((p) => (p.author ? p.author.id === targetId : isMe && p.mine))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // Trashed (soft-deleted) posts only ever show up in their own tab — everywhere
  // else they're treated as gone. Visitors to someone else's wall never see
  // hidden, private, or trashed posts at all, since those states are owner-only concepts.
  const trashedPosts = canManage ? theirPostsAll.filter((p) => p.deletedAt) : [];
  const theirPosts = theirPostsAll
    .filter((p) => !p.deletedAt)
    .filter((p) => canManage || !p.hidden) // owner can still see their own hidden posts in the normal tabs
    .filter((p) => canManage || p.visibility !== "private") // ditto for private-visibility posts
    .filter((p) => !query.trim() || p.title.toLowerCase().includes(query.trim().toLowerCase()))
    // Pinned posts float to the top, newest-first within each group.
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.createdAt || 0) - (a.createdAt || 0));

  const theirRankies = theirPosts.filter((p) => p.type === "rankie");
  const theirPaths = theirPosts.filter((p) => p.type === "path");
  const theirDecks = theirPosts.filter((p) => p.type === "deck" && p.deckMode !== "exam");
  const theirExams = theirPosts.filter((p) => p.type === "deck" && p.deckMode === "exam");
  const totalReach = theirPostsAll.reduce((s, p) => s + (p.participants || 0), 0);

  const visible =
    tab === "trash" ? trashedPosts : tab === "rankies" ? theirRankies : tab === "paths" ? theirPaths : tab === "decks" ? theirDecks : tab === "exams" ? theirExams : theirPosts;

  const stat = (n, l) => (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 18, color: C.text }}>{n}</div>
      <div style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.textFaint, marginTop: 1 }}>{l}</div>
    </div>
  );

  const [filterOpen, setFilterOpen] = useState(false);
  const filterOptions = [
    { id: "posts",   label: "Tất cả" },
    { id: "rankies", label: "Rankie" },
    { id: "paths",   label: "Path" },
    { id: "decks",   label: "Survey" },
    { id: "exams",   label: "Exam" },
    ...(canManage ? [{ id: "trash", label: `Thùng rác${trashedPosts.length ? ` (${trashedPosts.length})` : ""}` }] : []),
  ];
  const currentFilterLabel = filterOptions.find((o) => o.id === tab)?.label || "Tất cả";

  // Every card type gets the same options menu, so build it once here rather than
  // repeating the same nine handlers at each of the three call sites below.
  const optionsMenuFor = (item) =>
    canManage ? (
      <PostOptionsMenu
        post={item}
        onPin={() => onPin(item)}
        onHide={() => onHide(item)}
        onEdit={() => (item.type === "path" || item.type === "deck" ? onEditStructure?.(item) : setEditingPost(item))}
        onDuplicate={() => onDuplicate(item)}
        onDelete={() => onSoftDelete(item)}
        onVisibility={() => onCycleVisibility(item)}
        onStats={() => setStatsPost(item)}
        onExport={() => exportPostToCSV(item)}
      />
    ) : null;

  return (
    <div>
      {/* Back button — shown whenever the caller gave us somewhere to return to
          (someone else's wall always has one; "my profile" gets one too once
          the root app wires a back target for its bottom-nav tab). */}
      {onBack && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
          <button onClick={onBack} style={{ ...iconButton, color: C.text, flexShrink: 0 }}>
            <ChevronLeft size={20} />
          </button>
          {!isMe && <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 15, color: C.text }}>{author.name}</div>}
        </div>
      )}

      {/* Avatar + tên/theo dõi gọn bên phải, giống bố cục Instagram — không còn ảnh bìa */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
            <div
              onClick={isMe && onChangeAvatar ? onChangeAvatar : undefined}
              title={isMe && onChangeAvatar ? "Đổi ảnh đại diện" : undefined}
              style={{
                width: 64,
                height: 64,
                borderRadius: 99,
                background: author.avatarColor || C.surfaceRaised,
                border: `1px solid ${C.border}`,
                display: "grid",
                placeItems: "center",
                fontSize: 26,
                flexShrink: 0,
                overflow: "hidden",
                position: "relative",
                cursor: isMe && onChangeAvatar ? "pointer" : "default",
              }}
            >
              {author.avatarUrl ? (
                <img src={author.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                author.avatarEmoji || <User size={26} color={C.gold} />
              )}
              {isMe && onChangeAvatar && (
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", padding: "3px 0", display: "grid", placeItems: "center" }}>
                  <ImagePlus size={12} color="#fff" />
                </div>
              )}
            </div>
            <div style={{ minWidth: 0, paddingTop: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 17, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isMe ? currentUser.name : author.name}
                </div>
                {SHOW_VERIFIED && author.verified && (
                  <span style={{ width: 16, height: 16, borderRadius: 99, background: C.teal, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Check size={9} color={C.bg} strokeWidth={3} />
                  </span>
                )}
                {!isMe && onSetRank && (
                  <RankUpControl variant="pill" align="left" tier={rankTier} onSetTier={(lv) => onSetRank(author.id, lv)} fanCount={fanCount} />
                )}
              </div>
              <div style={{ fontFamily: monoFont, fontSize: 12, color: C.textFaint, marginTop: 2 }}>{author.handle}</div>
              <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.textMuted, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={12} color={C.gold} fill={C.gold} /> {fmtCompact(author.followers)} RP
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {canManage && (
              <button
                onClick={() => setShowSearch((v) => !v)}
                aria-label="Tìm trong hồ sơ"
                style={{
                  width: 34, height: 34, borderRadius: 99,
                  display: "grid", placeItems: "center", flexShrink: 0,
                  background: showSearch ? C.goldSoft : C.surfaceRaised,
                  border: `1px solid ${showSearch ? C.gold : C.border}`,
                  color: showSearch ? C.gold : C.textMuted,
                  cursor: "pointer",
                }}
              >
                <Search size={15} />
              </button>
            )}
            {isMe ? (
              <button
                aria-label="Đăng xuất"
                onClick={() => { if (onLogout && window.confirm("Đăng xuất khỏi tài khoản?")) onLogout(); }}
                style={{
                  width: 34, height: 34, borderRadius: 99,
                  display: "grid", placeItems: "center", flexShrink: 0,
                  background: C.surfaceRaised, border: `1px solid ${C.border}`,
                  color: C.text, cursor: "pointer",
                }}
              >
                <LogOut size={16} />
              </button>
            ) : null}
          </div>
        </div>

        {author.bio && (
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.textMuted, marginTop: 10, lineHeight: 1.4 }}>
            {author.bio}
          </div>
        )}


        {/* Thống kê rút gọn: icon + số, chạm để xem chi tiết */}
        <div style={{ marginTop: 14, position: "relative" }}>
          <button
            onClick={() => setShowStatsDetail((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 18,
              padding: "10px 14px", width: "100%",
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
              cursor: "pointer",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={16} color={C.gold} />
              <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 14, color: C.text }}>{fmt(theirPostsAll.length)}</span>
              <span style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint }}>bài đăng</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Eye size={16} color={C.gold} />
              <span style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 14, color: C.text }}>{fmtCompact(totalReach)}</span>
              <span style={{ fontFamily: bodyFont, fontSize: 12, color: C.textFaint }}>lượt</span>
            </span>
            <ChevronDown size={14} color={C.textFaint} style={{ marginLeft: "auto", transform: showStatsDetail ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>
          {showStatsDetail && (
            <div style={{ display: "flex", marginTop: 6, padding: "12px 0", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14 }}>
              {stat(theirRankies.length, "Rankie")}
              <div style={{ width: 1, background: C.border }} />
              {stat(theirPaths.length, "Path")}
              <div style={{ width: 1, background: C.border }} />
              {stat(theirDecks.length + theirExams.length, "Survey/Exam")}
              <div style={{ width: 1, background: C.border }} />
              {stat(fmt(totalReach), "Lượt")}
            </div>
          )}
        </div>

      </div>

      {/* Ô tìm kiếm — chỉ hiện khi bấm icon kính lúp ở trên */}
      {canManage && showSearch && (
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 10px" }}>
            <Search size={15} color={C.textFaint} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm trong bài đăng của bạn..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontFamily: bodyFont, fontSize: 13.5 }}
            />
            <button
              onClick={() => { setQuery(""); setShowSearch(false); }}
              style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", padding: 2 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Tab lớn kiểu Instagram — chỉ icon, gạch dưới cho tab đang chọn. Ba tab riêng
          tư (tham gia/trình chiếu/đánh dấu) chỉ hiện trên hồ sơ của chính mình. */}
      {canManage && (
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
          {[
            { id: "posts", icon: Grid3x3, label: "Bài viết" },
            { id: "participation", icon: Clock, label: "Lịch sử tham gia" },
            { id: "presentation", icon: Monitor, label: "Lịch sử trình chiếu" },
            { id: "bookmarks", icon: null, label: "Đánh dấu" },
          ].map((t) => {
            const active = mainTab === t.id;
            const IconEl = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setMainTab(t.id)}
                title={t.label}
                aria-label={t.label}
                style={{
                  flex: 1, padding: "11px 0", display: "flex", justifyContent: "center",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: `2px solid ${active ? C.text : "transparent"}`,
                }}
              >
                {IconEl ? <IconEl size={21} color={active ? C.text : C.textFaint} /> : <IconBookmark filled={active} size={21} />}
              </button>
            );
          })}
        </div>
      )}

      {/* Content filter — compact dropdown replacing the previous tab row */}
      {mainTab === "posts" && (
      <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, border: `1px solid ${tab !== "posts" ? C.gold : C.border}`, background: tab !== "posts" ? C.goldSoft : C.surface, color: tab !== "posts" ? C.gold : C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            {currentFilterLabel}
            <ChevronDown size={14} />
          </button>
          {filterOpen && (
            <>
              <div onClick={() => setFilterOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, minWidth: 150, background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, zIndex: 21, boxShadow: "0 8px 24px rgba(0,0,0,0.35)", animation: "popIn 0.15s ease" }}>
                {filterOptions.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { setTab(o.id); setFilterOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 10px", borderRadius: 8, border: "none", background: tab === o.id ? C.goldSoft : "transparent", color: tab === o.id ? C.gold : C.text, fontFamily: bodyFont, fontSize: 13.5, fontWeight: tab === o.id ? 700 : 500, cursor: "pointer", textAlign: "left" }}
                  >
                    {o.label}
                    {tab === o.id && <Check size={13} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sessions tab content removed — sessions now live inside each Rankie's detail view */}

      {/* Timeline of this author's posts (pinned first, then newest) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
        {visible.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.textFaint, fontFamily: bodyFont, fontSize: 13.5 }}>
            {tab === "trash" ? (
              "Thùng rác trống."
            ) : query.trim() ? (
              "Không tìm thấy bài đăng nào khớp."
            ) : isMe ? (
              <>
                Chưa có bài đăng nào ở đây.
                <br />
                Hãy tạo Rankie, Path hoặc Deck đầu tiên của bạn!
              </>
            ) : (
              "Chưa có bài đăng nào ở đây."
            )}
          </div>
        )}
        {visible.map((item) =>
          tab === "trash" ? (
            // Trash rows are intentionally plain (no chart preview, no tap-to-open)
            // to make clear these posts are no longer live — only Khôi phục / Xóa apply.
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 14,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                opacity: 0.75,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.title}
                </div>
                <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.textFaint, marginTop: 2 }}>
                  Đã xóa {timeAgo(item.deletedAt)} trước
                </div>
              </div>
              <button
                onClick={() => onRestore(item)}
                title="Khôi phục"
                style={{ display: "flex", alignItems: "center", gap: 5, background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 10px", color: C.text, fontFamily: bodyFont, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                <ArchiveRestore size={13} /> Khôi phục
              </button>
              <button
                onClick={() => setConfirmDelete(item)}
                title="Xóa vĩnh viễn"
                style={{ display: "flex", alignItems: "center", background: "none", border: "none", color: "#E4634A", cursor: "pointer", padding: 7 }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <div key={item.id} style={{ opacity: item.hidden ? 0.6 : 1 }}>
              {item.hidden && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, fontFamily: bodyFont, fontSize: 11, color: C.textFaint }}>
                  <EyeOff size={11} /> Đã ẩn — chỉ bạn thấy
                </div>
              )}
              {item.pinned && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, fontFamily: bodyFont, fontSize: 11, color: C.gold, fontWeight: 600 }}>
                  <Pin size={11} /> Đã ghim
                </div>
              )}
              {item.type === "path" ? (
                <PathCard path={item} onOpen={() => onOpenPath(item.id)} onOpenAuthor={onOpenAuthor} menuSlot={optionsMenuFor(item)} onShare={setShareTarget} joined={participatedKeys?.has(`path:${item.id}`) || false} bookmarked={!!bookmarks?.[`path:${item.id}`]} onToggleBookmark={onToggleBookmark} myResult={participationByKey?.[`path:${item.id}`]} unlockedEndings={pathUnlocks?.[item.id] || []} sessionCount={pathSessionCounts?.[item.id] || 0} sessionList={presentationHistory?.filter(h => h.type === "path" && h.itemId === item.id) || []} onSeeAllSessions={onOpenPresentationHistory} onOpenSession={onOpenSession} />
              ) : item.type === "deck" ? (
                <DeckCard deck={item} onOpen={() => onOpenDeck(item.id)} onOpenAuthor={onOpenAuthor} menuSlot={optionsMenuFor(item)} onShare={setShareTarget} joined={participatedKeys?.has(`deck:${item.id}`) || false} sessionCount={deckSessionCounts?.[item.id] || 0} bookmarked={!!bookmarks?.[`deck:${item.id}`]} onToggleBookmark={onToggleBookmark} myResult={participationByKey?.[`deck:${item.id}`]} sessionList={presentationHistory?.filter(h => h.type === "deck" && h.itemId === item.id) || []} onSeeAllSessions={onOpenPresentationHistory} onOpenSession={onOpenSession} />
              ) : item.type === "share" ? (
                <SharedPostCard
                  post={item}
                  onOpen={() => {
                    if (item.sharedType === "path") onOpenPath(item.sharedId);
                    else if (item.sharedType === "deck") onOpenDeck(item.sharedId);
                    else onOpenRankie(item.sharedId);
                  }}
                  onOpenAuthor={onOpenAuthor}
                  menuSlot={optionsMenuFor(item)}
                />
              ) : (
                <RankieCard
                  rankie={item}
                  onOpen={onOpenRankie}
                  onOpenAuthor={onOpenAuthor}
                  myVoteIds={votedIdsFor(votedMap?.[item.id])}
                  sessionCount={sessionCounts?.[item.id] || 0}
                  sessionList={presentationHistory?.filter(h => h.type === "rankie" && h.itemId === item.id) || []}
                  onSeeAllSessions={onOpenPresentationHistory}
                  menuSlot={optionsMenuFor(item)}
                  onShare={setShareTarget}
                  bookmarked={!!bookmarks?.[`rankie:${item.id}`]}
                  onToggleBookmark={onToggleBookmark}
                />
              )}
            </div>
          )
        )}
      </div>
      </>
      )}

      {/* Tab: Lịch sử tham gia — inline, không điều hướng sang màn khác nữa */}
      {mainTab === "participation" && (
        <div style={{ padding: 16 }}>
          {(!participationHistory || participationHistory.length === 0) ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: C.textFaint, fontFamily: bodyFont, fontSize: 13.5 }}>
              Chưa có hoạt động nào. Khi bạn bình chọn một Rankie, làm một Path, trả lời một Survey, hoặc làm một Exam, nó sẽ xuất hiện ở đây.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {participationHistory.map((entry) => {
                const Icon = entry.type === "rankie" ? FlagTypeIcon : entry.type === "path" ? GitBranch : entry.deckMode === "exam" ? Edit3 : Layers;
                const label = entry.type === "rankie" ? "Rankie" : entry.type === "path" ? "Path" : entry.deckMode === "exam" ? "Exam" : "Survey";
                const openEntry = () => onOpenSession(entry);
                return (
                  <div key={entry.key} style={{ ...cardSurface, padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={openEntry}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: C.surfaceRaised, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon size={17} color={C.gold} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <Pill tone="muted">{label}</Pill>
                        <span style={captionText}>{timeAgo(entry.timestamp)} trước</span>
                      </div>
                      <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entry.title}
                      </div>
                      {entry.detail && (
                        <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textMuted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          Kết quả của bạn: {entry.detail}
                        </div>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onRemoveHistory?.(entry.key); }} style={{ ...iconButton, color: C.textFaint, flexShrink: 0 }}>
                      <X size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Lịch sử trình chiếu — inline */}
      {mainTab === "presentation" && (
        <div style={{ padding: 16 }}>
          {(!presentationHistory || presentationHistory.length === 0) ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: C.textFaint, fontFamily: bodyFont, fontSize: 13.5 }}>
              Chưa có phiên trình chiếu nào được lưu. Sau khi trình chiếu một Rankie, Survey, hoặc Exam, bấm "Lưu phiên trình chiếu" để nó xuất hiện ở đây.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {presentationHistory.map((entry) => {
                const Icon = entry.type === "rankie" ? FlagTypeIcon : entry.type === "path" ? GitBranch : entry.deckMode === "exam" ? Edit3 : Layers;
                const label = entry.type === "rankie" ? "Rankie" : entry.type === "path" ? "Path" : entry.deckMode === "exam" ? "Exam" : "Survey";
                const openEntry = () => onOpenSession(entry);
                return (
                  <div key={entry.id} style={{ ...cardSurface, padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={openEntry}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: C.goldSoft, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon size={17} color={C.gold} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <Pill tone="muted">{label}</Pill>
                        <span style={captionText}>{timeAgo(entry.endedAt)} trước</span>
                      </div>
                      <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 13.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entry.name}
                      </div>
                      <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.textMuted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entry.itemTitle} · {entry.meta}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Đánh dấu — inline */}
      {mainTab === "bookmarks" && (
        <div style={{ padding: 16 }}>
          {(() => {
            const list = Object.values(bookmarks || {}).sort((a, b) => (b.bookmarkedAt || 0) - (a.bookmarkedAt || 0));
            if (list.length === 0) {
              return (
                <div style={{ textAlign: "center", padding: "40px 20px", color: C.textFaint, fontFamily: bodyFont, fontSize: 13.5 }}>
                  Chưa đánh dấu bài nào. Bấm icon 🔖 trên một bài để lưu lại xem/làm sau.
                </div>
              );
            }
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {list.map((item) => {
                  const Icon = item.type === "rankie" ? FlagTypeIcon : item.type === "path" ? GitBranch : item.deckMode === "exam" ? Edit3 : Layers;
                  const label = item.type === "rankie" ? "Rankie" : item.type === "path" ? "Path" : item.deckMode === "exam" ? "Exam" : "Survey";
                  const openItem = () => {
                    if (item.type === "rankie") onOpenRankie(item.id);
                    else if (item.type === "path") onOpenPath(item.id);
                    else onOpenDeck(item.id);
                  };
                  return (
                    <div key={`${item.type}:${item.id}`} style={{ ...cardSurface, padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={openItem}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: C.surfaceRaised, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <Icon size={17} color={C.gold} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <Pill tone="muted">{label}</Pill>
                        </div>
                        <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.title}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onToggleBookmark?.(item); }} style={{ ...iconButton, color: C.textFaint, flexShrink: 0 }}>
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {shareTarget && (
        <ShareModal item={shareTarget} onClose={() => setShareTarget(null)} onShareToProfile={onShareToProfile} contacts={contacts ?? []} onShared={() => onBumpShares?.(shareTarget)} />
      )}
      {editingPost && (
        <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onSave={(patch) => onEdit(editingPost, patch)} />
      )}
      {statsPost && (
        <PostStatsModal post={statsPost} onClose={() => setStatsPost(null)} onExport={exportPostToCSV} />
      )}
      {confirmDelete && (
        <ModalShell title="Xóa vĩnh viễn?" onClose={() => setConfirmDelete(null)}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
            <AlertTriangle size={18} color="#E4634A" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.textMuted, lineHeight: 1.5 }}>
              "{confirmDelete.title}" sẽ bị xóa vĩnh viễn cùng toàn bộ số liệu bình chọn. Hành động này không thể hoàn tác.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setConfirmDelete(null)}
              style={{ flex: 1, padding: 13, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surfaceRaised, color: C.text, fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
            >
              Hủy
            </button>
            <button
              onClick={() => {
                onPermanentDelete(confirmDelete);
                setConfirmDelete(null);
              }}
              style={{ flex: 1, padding: 13, borderRadius: 12, border: "none", background: "#E4634A", color: "#fff", fontFamily: bodyFont, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
            >
              Xóa vĩnh viễn
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ---------- MAP API → SHAPE PROTOTYPE (Phần 2) ----------
const OPT_FALLBACK = [C.teal, C.gold, C.coral, "#8B7FD1", "#6FB1C7", "#8FBF6A"];

function apiAuthorToProto(a) {
  if (!a) return { id: "u_unknown", name: "Ẩn danh", handle: "@unknown", avatarEmoji: "🙂", avatarColor: C.surfaceRaised, followers: 0, verified: false };
  return {
    id: a.id,
    name: a.name,
    handle: (a.handle || "").startsWith("@") ? a.handle : "@" + (a.handle || "user"),
    avatarEmoji: a.avatarEmoji || "🙂",
    avatarColor: a.avatarColor || C.surfaceRaised,
    avatarUrl: a.avatarUrl || null,
    followers: a.rankPoints || 0,
    verified: !!a.verified,
  };
}

// Feed summary (GET /feed) → shape đủ cho CARD trong feed. Options chưa có id thật
// (chỉ để hiển thị); khi mở chi tiết sẽ fetch full /posts/:id để có id thật + vote được.
// UUID thật (bài/comment API) vs id mock. Dùng ở cả component con (không có isApiId của RankevApp).
function isUuid(id) {
  return typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// CommentView (API) → shape comment prototype.
function apiCommentToProto(c) {
  return {
    id: c.id,
    user: (c.author && (c.author.name || c.author.handle)) || "Người dùng",
    text: c.text || "",
    image: c.imageUrl || null,
    rankUp: c.rankUp || 0,
    rankDown: c.rankDown || 0,
    supports: c.supports || [],
    createdAt: Date.parse(c.createdAt) || Date.now(),
    myReaction: c.myRank === 1 ? "up" : c.myRank === -1 ? "down" : null,
    replies: [],
    _api: true,
  };
}

function apiSummaryToProto(s) {
  const base = {
    id: s.id,
    title: s.title,
    subtitle: s.subtitle || "",
    category: s.category || "Khác",
    author: apiAuthorToProto(s.author),
    createdAt: Date.parse(s.createdAt) || Date.now(),
    media: s.media || null,
    mine: false,
    caption: "",
    participants: s.engagement || 0,
    _api: true,
  };
  if (s.type === "rankie") {
    const opts = (s.options || []).map((o, i) => ({
      id: "opt" + i, label: o.label || "", emoji: o.emoji || undefined,
      votes: o.votes || 0, color: o.color || OPT_FALLBACK[i % OPT_FALLBACK.length],
    }));
    return { ...base, type: "rankie", votingType: s.votingType || "single", chartType: opts.length === 2 ? "head_to_head" : "bar", live: !!s.live, closesAt: s.closesAt ? Date.parse(s.closesAt) : null, voteMarker: s.voteMarker || null, options: opts, comments: [] };
  }
  if (s.type === "path") {
    return { ...base, type: "path", subtitle: `${s.size} kết quả`, questions: [], results: {}, comments: s.commentsCount || 0 };
  }
  return { ...base, type: "deck", deckMode: s.deckMode, subtitle: `${s.size} câu hỏi`, questions: [], comments: s.commentsCount || 0, answerMode: "step", graded: s.deckMode === "exam" };
}

// Full RankieView (GET /posts/:id) → shape rankie prototype ĐẦY ĐỦ (option id thật → vote được).
function apiRankieToProto(r) {
  const opts = (r.options || []).map((o, i) => ({
    id: o.id, label: o.label || "", emoji: o.emoji || undefined, flag: o.flag || undefined,
    image: o.imageUrl || undefined, votes: o.votes || 0, voters: o.voters || 0,
    color: o.color || OPT_FALLBACK[i % OPT_FALLBACK.length],
  }));
  return {
    id: r.id, type: "rankie", chartType: r.chartType || (opts.length === 2 ? "head_to_head" : "bar"),
    votingType: r.votingType || "single", title: r.title, subtitle: r.subtitle || "",
    category: r.category || "Khác", live: !!r.live, mine: false, author: apiAuthorToProto(r.author),
    createdAt: Date.parse(r.createdAt) || Date.now(), closesAt: r.closesAt ? Date.parse(r.closesAt) : null,
    caption: r.caption || "", media: r.media || null, participants: r.totalVotes || 0,
    voteMarker: r.voteMarker || null,
    options: opts, comments: [], _api: true,
  };
}

// Full PathView (GET /posts/:id) → shape path prototype (cây yes/no).
// LƯU Ý: prototype nhị phân → chỉ dùng 2 đáp án đầu mỗi câu (câu >2 đáp án bị lossy).
function apiPathToProto(p) {
  const qs = (p.questions || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));
  const entry = qs.find((q) => q.isEntry) || qs[0];
  const ordered = entry ? [entry, ...qs.filter((q) => q !== entry)] : qs;
  const branch = (a, fallbackLabel) =>
    a
      ? {
          next: a.targetId,
          emoji: a.emoji || undefined,
          image: a.imageUrl || null,
          label: a.label || fallbackLabel,
          // Giữ toạ độ hotspot để play view đặt điểm lên ảnh cảnh (Visual Scene Builder).
          hotspot: a.hotspotX != null && a.hotspotY != null ? { x: a.hotspotX, y: a.hotspotY } : null,
        }
      : { next: null, emoji: undefined, image: null, label: fallbackLabel, hotspot: null };
  const questions = ordered.map((q) => ({
    id: q.id,
    text: q.text || "",
    sceneImage: q.sceneImageUrl || null,
    yes: branch(q.answers && q.answers[0], "Có"),
    no: branch(q.answers && q.answers[1], "Không"),
  }));
  const total = (p.endings || []).reduce((s, e) => s + (e.count || 0), 0) || 1;
  const results = {};
  (p.endings || []).forEach((e) => {
    results[e.name] = { emoji: e.emoji || "🏁", image: e.imageUrl || null, pct: Math.round(((e.count || 0) / total) * 100), count: e.count || 0, comment: e.comment || "" };
  });
  return {
    id: p.id, type: "path", title: p.title,
    subtitle: `${(p.questions || []).length} câu hỏi · ${(p.endings || []).length} kết quả`,
    category: p.category || "Khác", mine: false, author: apiAuthorToProto(p.author),
    createdAt: Date.parse(p.createdAt) || Date.now(), caption: p.caption || "", media: p.media || null,
    participants: 0, comments: 0, questions, results, _api: true,
  };
}

// Full DeckView (GET /posts/:id) → shape deck prototype.
function apiDeckToProto(d) {
  return {
    id: d.id, type: "deck", deckMode: d.deckMode, title: d.title, subtitle: d.subtitle || "",
    category: d.category || "Khác", mine: false, author: apiAuthorToProto(d.author),
    createdAt: Date.parse(d.createdAt) || Date.now(), caption: d.caption || "", media: d.media || null,
    participants: 0, comments: 0, answerMode: "step", graded: d.deckMode === "exam",
    passingScore: d.passingScore, examDurationMinutes: d.examDurationMinutes,
    questions: (d.questions || []).map((q) => ({
      id: q.id, text: q.text || "", votingType: q.votingType || "single", points: q.points || 0,
      options: (q.options || []).map((o) => ({ id: o.id, label: o.label || "", emoji: o.emoji || undefined, image: o.imageUrl || null, votes: 0, correct: o.correct })),
    })),
    _api: true,
  };
}

// Proto path (mở để SỬA) → state builder của CreateView (endings + questions với target/hotspot).
function protoPathToBuilder(item) {
  const endings = Object.entries(item.results || {}).map(([name, e], i) => ({ id: "e" + (i + 1), name, emoji: e.emoji || "🎯", image: e.image || null }));
  const nameToEndingId = new Map(endings.map((e) => [e.name, e.id]));
  const questions = (item.questions || []).map((q) => {
    const branches = q.answers ? q.answers : [q.yes, q.no].filter(Boolean);
    return {
      id: q.id,
      text: q.text || "",
      sceneImage: q.sceneImage || null,
      answers: branches.map((a, j) => {
        const eid = nameToEndingId.get(a.next);
        const target = eid ? { type: "ending", id: eid } : { type: "question", id: a.next };
        return { id: q.id + "_a" + j, label: a.label || "", emoji: a.emoji || "➡️", image: a.image || null, hotspot: a.hotspot || null, target };
      }),
    };
  });
  return { endings: endings.length ? endings : null, questions: questions.length ? questions : null };
}

// Proto deck (mở để SỬA) → state builder deckQuestions của CreateView.
function protoDeckToBuilder(item) {
  const questions = (item.questions || []).map((q) => ({
    text: q.text || "",
    votingType: q.votingType || "single",
    points: q.points || 1,
    pointsLocked: false,
    options: (q.options || []).map((o) => ({ label: o.label || "", correct: !!o.correct, emoji: o.emoji, image: o.image || null })),
  }));
  return { deckMode: item.deckMode || "survey", questions: questions.length ? questions : null };
}

// Proto item (do CreateView dựng) → payload cho POST /posts. Chỉ nhận URL http(s)/data
// cho các trường ảnh (backend validate .url()); bỏ qua blob/null.
function protoToCreatePayload(item) {
  const urlOK = (v) => (typeof v === "string" && /^(https?:|data:)/.test(v) ? v : undefined);
  const media =
    item.media && (item.media.url || item.media.emoji || item.media.color || item.media.type)
      ? { type: item.media.type, color: item.media.color, emoji: item.media.emoji, url: urlOK(item.media.url) }
      : undefined;
  const base = {
    title: item.title,
    subtitle: item.subtitle || undefined,
    caption: item.caption || undefined,
    category: item.category || undefined,
    media,
  };

  if (item.type === "path") {
    const endingNames = new Set(Object.keys(item.results || {}));
    const questionIds = new Set((item.questions || []).map((q) => q.id));
    const mapAnswer = (a) => {
      const next = a.next;
      const isEnding = endingNames.has(next) && !questionIds.has(next);
      return {
        label: a.label || undefined,
        emoji: a.emoji || undefined,
        imageUrl: urlOK(a.image),
        hotspotX: a.hotspot ? a.hotspot.x : undefined,
        hotspotY: a.hotspot ? a.hotspot.y : undefined,
        targetType: isEnding ? "ending" : "question",
        targetKey: next,
      };
    };
    const questions = (item.questions || []).map((q, i) => ({
      key: q.id,
      text: q.text || undefined,
      sceneImageUrl: urlOK(q.sceneImage),
      isEntry: i === 0,
      answers: (q.answers ? q.answers : [q.yes, q.no].filter(Boolean)).map(mapAnswer),
    }));
    const endings = Object.entries(item.results || {}).map(([name, e]) => ({
      name,
      emoji: e.emoji || undefined,
      imageUrl: urlOK(e.image),
      comment: e.comment || undefined,
    }));
    return { type: "path", ...base, revealMode: item.revealMode || "hidden", hideEndingCount: !!item.hideEndingCount, questions, endings };
  }

  if (item.type === "deck") {
    const questions = (item.questions || []).map((q) => ({
      text: q.text || undefined,
      votingType: q.votingType || "single",
      points: item.deckMode === "exam" ? q.points || 0 : 0,
      options: (q.options || []).map((o) => ({ label: o.label || undefined, imageUrl: urlOK(o.image), correct: !!o.correct })),
    }));
    const payload = { type: "deck", deckMode: item.deckMode, ...base, questions };
    if (item.deckMode === "exam") {
      if (item.passingScore != null) payload.passingScore = item.passingScore;
      if (item.examDurationMinutes != null) payload.examDurationMinutes = Math.max(1, Math.round(item.examDurationMinutes));
    }
    return payload;
  }

  // rankie
  const voteMarker = item.voteMarker && (item.voteMarker.emoji || item.voteMarker.image)
    ? { emoji: item.voteMarker.emoji || undefined, image: urlOK(item.voteMarker.image) }
    : undefined;
  return {
    type: "rankie",
    ...base,
    votingType: item.votingType || "single",
    chartType: item.chartType || "bar",
    voteMarker,
    live: !!item.live,
    closesAt: item.closesAt ? new Date(item.closesAt).toISOString() : undefined,
    options: (item.options || []).map((o) => ({
      label: o.label || undefined,
      emoji: o.emoji || undefined,
      imageUrl: urlOK(o.image),
      color: o.color || undefined,
    })),
  };
}

// ---------- AUTH GATE (Phần 1) ----------
// Màn Đăng nhập / Đăng ký, dùng lại style có sẵn (cardSurface, primaryButton, C, fonts).
// Chỉ hiển thị khi chưa đăng nhập; không đụng vào các component UI khác.
function AuthGate({ onAuthed }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      if (tab === "login") {
        await auth.login(email.trim(), password);
      } else {
        await auth.register(handle.trim().replace(/^@/, ""), name.trim(), email.trim(), password);
      }
      await onAuthed();
    } catch (e) {
      setErr(e?.message || "Có lỗi xảy ra, thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", marginBottom: 10, borderRadius: 12,
    border: `1px solid ${C.border}`, background: C.surfaceRaised, color: C.text,
    fontFamily: bodyFont, fontSize: 16, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", background: "#050A07", minHeight: "100vh", fontFamily: bodyFont }}>
      {FONT_IMPORT}
      <div style={{ width: "100%", maxWidth: 420, minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 44, color: C.gold, lineHeight: 1 }}>Rankev</div>
          <div style={{ fontFamily: bodyFont, fontSize: 14, color: C.textMuted, marginTop: 6 }}>Bình chọn · Xếp hạng · Cùng cộng đồng</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["login", "Đăng nhập"], ["register", "Đăng ký"]].map(([t, label]) => (
            <button
              key={t}
              onClick={() => { setTab(t); setErr(null); }}
              style={{ flex: 1, padding: 11, borderRadius: 12, border: "none", cursor: "pointer", fontFamily: bodyFont, fontWeight: 700, fontSize: 14, background: tab === t ? C.gold : C.surfaceRaised, color: tab === t ? "#1A1305" : C.textMuted }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ ...cardSurface }}>
          {tab === "register" && (
            <>
              <input style={inputStyle} placeholder="Tên hiển thị" value={name} onChange={(e) => setName(e.target.value)} />
              <input style={inputStyle} placeholder="Handle (vd: rankev_user)" value={handle} autoCapitalize="none" onChange={(e) => setHandle(e.target.value)} />
            </>
          )}
          <input style={inputStyle} type="email" placeholder="Email" value={email} autoCapitalize="none" onChange={(e) => setEmail(e.target.value)} />
          <input style={inputStyle} type="password" placeholder="Mật khẩu (tối thiểu 8 ký tự)" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
          {err && <div style={{ color: C.coral, fontFamily: bodyFont, fontSize: 13, marginBottom: 10 }}>{err}</div>}
          <button onClick={submit} disabled={busy} style={{ ...primaryButton, width: "100%", opacity: busy ? 0.6 : 1 }}>
            {busy ? "Đang xử lý…" : tab === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontFamily: bodyFont, fontSize: 12, color: C.textFaint }}>
          Kết nối tài khoản thật từ backend Rankev
        </div>
      </div>
    </div>
  );
}

// ---------- ROOT APP ----------
export default function RankevApp() {
  const [rankies, setRankies] = useState(initialRankies);
  // --- Feed thật từ API (Phần 2) — merge cùng mock, mock giữ làm nội dung nền/fallback ---
  const [apiPosts, setApiPosts] = useState([]);
  const [apiCursor, setApiCursor] = useState(null);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  // Kết quả Deck thật từ API (Phần 5): { [deckId]: { answers, submitted, result } }
  const [apiDeckResults, setApiDeckResults] = useState({});
  const [apiDeckStats, setApiDeckStats] = useState({}); // { [deckId]: { participants, avgScore } }
  const [userPaths, setUserPaths] = useState([]); // paths created by the user
  const [userDecks, setUserDecks] = useState([]); // decks created by the user
  const [view, setView] = useState("feed");
  // Giữ vị trí cuộn của Feed khi rời đi rồi quay lại (giống Instagram/Facebook).
  // Layout ở đây cuộn theo TRANG (window), không phải một div nội bộ riêng — nên
  // theo dõi window.scrollY là cách đúng thực tế, dù vẫn giữ thêm bản ghi trên
  // container nội bộ để phòng khi CSS thay đổi khiến nó trở thành vùng cuộn riêng.
  const scrollContainerRef = useRef(null);
  const feedScrollTopRef = useRef(0);
  const handleScrollContainer = () => {
    if (view === "feed" && scrollContainerRef.current) {
      feedScrollTopRef.current = scrollContainerRef.current.scrollTop;
    }
  };
  useEffect(() => {
    const onWindowScroll = () => {
      if (view === "feed") feedScrollTopRef.current = window.scrollY || window.pageYOffset || 0;
    };
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
  }, [view]);
  useEffect(() => {
    if (view === "feed") {
      // Khôi phục cả hai khả năng: cuộn window (trường hợp thực tế) và cuộn div nội bộ.
      window.scrollTo(0, feedScrollTopRef.current);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = feedScrollTopRef.current;
    }
  }, [view]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPath, setSelectedPath] = useState(samplePath);
  const [selectedDeck, setSelectedDeck] = useState(sampleDeck);
  const [prevAfterPath, setPrevAfterPath] = useState("feed"); // where "back" returns to from path detail
  const [prevAfterDetail, setPrevAfterDetail] = useState("feed"); // where "back" returns to from rankie detail
  const [prevAfterDeck, setPrevAfterDeck] = useState("feed"); // where "back" returns to from deck detail
  const [activeCategory, setActiveCategory] = useState("Đang thịnh hành"); // feed category filter
  const [typeFilter, setTypeFilter] = useState("all"); // feed content-type dropdown filter: all | rankie | path | deck
  const [searchHistory, setSearchHistory] = useState([]); // up to 5 recent searches, newest-first
  const addToSearchHistory = (term) => {
    const t = term.trim();
    if (!t) return;
    setSearchHistory((prev) => [t, ...prev.filter((s) => s !== t)].slice(0, 5));
  };
  const removeFromSearchHistory = (term) =>
    setSearchHistory((prev) => prev.filter((s) => s !== term));

  const [viewedAuthorId, setViewedAuthorId] = useState("me"); // whose wall "authorProfile" currently shows
  // Quan hệ RankUp của người dùng với từng kênh (authorId → tier 0-3). Điều khiển feed
  // cá nhân, không tính điểm công khai.
  const [rankTiers, setRankTiers] = useState(() => ({ ...INITIAL_RANKS }));
  // Ghi quan hệ RankUp lên backend cho author thật (UUID); author mock bỏ qua.
  const syncRankApi = (authorId, tier) => {
    if (isApiId(authorId)) api.social.rankUp(authorId, tier).catch(() => {});
  };
  const rankUp = (authorId) => {
    if (!authorId || authorId === "me") return;
    const cur = rankTiers[authorId] || 0;
    if (cur >= 3) return;
    // Tầng 3 "Fan cuồng" chỉ mở khi đang ở tầng 2 VÀ đã tham gia > 10 bài của kênh này.
    if (cur === 2 && (participationCountByAuthor[authorId] || 0) <= FAN_REQUIRED) return;
    const t = Math.min(3, cur + 1);
    setRankTiers((prev) => ({ ...prev, [authorId]: t }));
    syncRankApi(authorId, t);
  };
  const rankDown = (authorId) => {
    if (!authorId || authorId === "me") return;
    const t = Math.max(0, (rankTiers[authorId] || 0) - 1);
    setRankTiers((prev) => ({ ...prev, [authorId]: t }));
    syncRankApi(authorId, t);
  };
  // Đặt thẳng tầng (dùng cho popover chọn tầng). Chặn lên tầng 3 nếu chưa tham gia >10 bài.
  const setRank = (authorId, tier) => {
    if (!authorId || authorId === "me") return;
    let t = Math.max(0, Math.min(3, tier));
    if (t === 3 && (participationCountByAuthor[authorId] || 0) <= FAN_REQUIRED) t = 2;
    setRankTiers((prev) => ({ ...prev, [authorId]: t }));
    syncRankApi(authorId, t);
  };
  const [prevAfterAuthor, setPrevAfterAuthor] = useState("feed"); // where "back" returns to from an author's wall

  // Live vote state lifted out of RankieDetailView so it persists across
  // navigation: leaving a Rankie and coming back keeps both the vote counts
  // and the "you already voted" status instead of resetting them.
  const [liveOptions, setLiveOptions] = useState({}); // { [rankieId]: options[] }
  const [votedMap, setVotedMap] = useState({}); // { [rankieId]: null | optionId | optionId[] }
  const [presenterInitialOptions, setPresenterInitialOptions] = useState(null);
  // Each saved presenter session: { id, rankieId, rankieTitle, mode, startedAt, endedAt, options, totalVotes }
  const [sessions, setSessions] = useState([]);
  const saveSession = (session) =>
    setSessions((prev) => [{ ...session, id: "s" + Date.now() }, ...prev]);
  // How many presenter sessions have been saved for each rankie — { [rankieId]: count }.
  // Passed down to feed/search/profile cards so they can show a "🎬 3 phiên" badge
  // without every card needing the full sessions list.
  const sessionCounts = sessions.reduce((acc, s) => {
    acc[s.rankieId] = (acc[s.rankieId] || 0) + 1;
    return acc;
  }, {});

  // Same idea for Survey/Exam trình chiếu sessions (DeckPresenterView / ExamPresenterView).
  const [deckSessions, setDeckSessions] = useState([]); // { id, deckId, deckTitle, deckMode, name, endedAt, ... }
  const saveDeckSession = (session) =>
    setDeckSessions((prev) => [{ id: "ds" + Date.now(), ...session }, ...prev]);
  const deckSessionCounts = deckSessions.reduce((acc, s) => {
    acc[s.deckId] = (acc[s.deckId] || 0) + 1;
    return acc;
  }, {});

  // Same again for Path trình chiếu sessions (PathPresenterView) — cùng cơ chế với
  // Rankie/Survey/Exam: chỉ đếm khi host bấm "Lưu phiên trình chiếu" kèm tên.
  const [pathSessions, setPathSessions] = useState([]); // { id, pathId, pathTitle, name, endedAt, participants }
  const savePathSession = (session) =>
    setPathSessions((prev) => [{ id: "ps" + Date.now(), ...session }, ...prev]);
  const pathSessionCounts = pathSessions.reduce((acc, s) => {
    acc[s.pathId] = (acc[s.pathId] || 0) + 1;
    return acc;
  }, {});

  // Gộp "Lịch sử trình chiếu" từ cả Rankie, Path và Survey/Exam thành một danh sách chung,
  // hiển thị trong PresentationHistoryView.
  const presentationHistory = useMemo(() => {
    const fromRankie = sessions.map((s) => ({
      id: s.id,
      type: "rankie",
      itemId: s.rankieId,
      itemTitle: s.rankieTitle,
      name: s.name,
      endedAt: s.endedAt,
      meta: `${fmt(s.totalVotes || 0)} lượt bình chọn`,
    }));
    const fromPath = pathSessions.map((s) => ({
      id: s.id,
      type: "path",
      itemId: s.pathId,
      itemTitle: s.pathTitle,
      name: s.name,
      endedAt: s.endedAt,
      meta: `${fmt(s.participants || 0)} người tham gia`,
    }));
    const fromDeck = deckSessions.map((s) => ({
      id: s.id,
      type: "deck",
      itemId: s.deckId,
      itemTitle: s.deckTitle,
      deckMode: s.deckMode,
      name: s.name,
      endedAt: s.endedAt,
      meta: s.deckMode === "exam"
        ? `${fmt(s.participants || 0)} người thi${s.avgScore != null ? ` · ĐTB ${s.avgScore}` : ""}`
        : `${fmt(s.participants || 0)} người tham gia`,
    }));
    return [...fromRankie, ...fromPath, ...fromDeck].sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0));
  }, [sessions, pathSessions, deckSessions]);

  // "Shares" are lightweight posts of their own: a caption + a reference back to the
  // original Rankie/Path/Deck, posted to the sharer's own wall (and into the public
  // feed when public). This is distinct from "Nhân bản", which copies the content
  // itself into a brand-new independent post the user owns.
  const [sharedPosts, setSharedPosts] = useState([]);
  const shareToProfile = ({ item, caption, visibility }) => {
    setSharedPosts((prev) => [
      {
        id: "share" + Date.now(),
        type: "share",
        sharedType: item.type || "rankie",
        sharedId: item.id,
        sharedTitle: item.title,
        sharedCategory: item.category,
        caption: caption?.trim() || null,
        visibility: visibility || "public",
        category: item.category,
        author: currentUser,
        mine: true,
        createdAt: Date.now(),
        participants: 0,
        comments: [],
      },
      ...prev,
    ]);
  };

  // Tracks every Rankie/Path/Deck the user has voted on or completed, so they can
  // find things they've participated in again later. Keyed by "type:itemId" and
  // upserted — participating again just bumps it back to the top with a fresh
  // timestamp, rather than creating duplicate entries.
  const [participationHistory, setParticipationHistory] = useState([]);
  // Tập các "ending" (kết quả) người dùng đã KHÁM PHÁ ở mỗi Path — khác participation
  // history (chỉ giữ kết quả GẦN NHẤT). Ở đây tích luỹ mọi ending đã mở qua các lần
  // chơi lại, để hiện tiến độ "2/5 kết quả" và ẩn ending chưa khám phá (tránh spoiler).
  const [pathUnlocks, setPathUnlocks] = useState({}); // { [pathId]: [endingName...] }
  const unlockPathEnding = (pathId, ending) => {
    if (!pathId || !ending) return;
    setPathUnlocks((prev) => {
      const cur = prev[pathId] || [];
      if (cur.includes(ending)) return prev;
      return { ...prev, [pathId]: [...cur, ending] };
    });
  };
  // Set các "type:itemId" đã tham gia thật (vote/làm bài) — dùng để tô màu icon
  // tham gia trên PathCard/DeckCard trong EngagementBar. Rankie tự tính từ
  // myVoteIds nên không cần tra ở đây.
  const participatedKeys = useMemo(
    () => new Set(participationHistory.map((h) => h.key)),
    [participationHistory]
  );

  // "Đánh dấu" (bookmark) — đánh dấu bài để xem/làm lại sau, tách biệt hoàn toàn với
  // Lịch sử tham gia. Lưu thật (không mất khi chuyển màn hình), khoá theo "type:id".
  const [bookmarks, setBookmarks] = useState({}); // { [`${type}:${id}`]: true }
  const bookmarkKeyFor = (post) => `${post.type}:${post.id}`;
  const toggleBookmark = (post) => {
    const key = bookmarkKeyFor(post);
    const wasBookmarked = !!bookmarks[key];
    setBookmarks((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = { ...post, bookmarkedAt: Date.now() };
      return next;
    });
    // Đồng bộ backend cho post thật; post mock giữ nguyên hành vi cục bộ.
    if (isApiId(post.id)) {
      (wasBookmarked ? api.bookmarks.remove(post.id) : api.bookmarks.add(post.id)).catch(() => {});
    }
  };
  // Cộng +1 lượt tham gia cho một bài (mọi nơi bài đó xuất hiện + màn chi tiết đang mở).
  const bumpParticipants = (id) => {
    const inc = (p) => (p && p.id === id ? { ...p, participants: (p.participants || 0) + 1 } : p);
    setRankies((prev) => prev.map(inc));
    setUserPaths((prev) => prev.map(inc));
    setUserDecks((prev) => prev.map(inc));
    setApiPosts((prev) => prev.map(inc));
    setSelectedPath((prev) => inc(prev));
    setSelectedDeck((prev) => inc(prev));
  };
  const addToHistory = (entry) => {
    const key = `${entry.type}:${entry.itemId}`;
    // Lần tham gia ĐẦU TIÊN với bài này → cộng lượt (thử lại không cộng thêm).
    const isFirst = !participationHistory.some((h) => h.key === key);
    setParticipationHistory((prev) => [
      { ...entry, key, timestamp: Date.now() },
      ...prev.filter((h) => h.key !== key),
    ]);
    if (isFirst && (entry.type === "path" || entry.type === "deck")) bumpParticipants(entry.itemId);
  };
  const clearHistory = () => setParticipationHistory([]);
  const removeFromHistory = (key) =>
    setParticipationHistory((prev) => prev.filter((h) => h.key !== key));

  // addToHistory dedupes to one entry per item (the latest), so this is already
  // "kết quả tham gia gần nhất" ready to look up by key — used by PathCard/DeckCard
  // to show the viewer's own last result inline, same treatment as Rankie's "your pick".
  const participationByKey = useMemo(() => {
    const map = {};
    participationHistory.forEach((h) => { map[h.key] = h; });
    return map;
  }, [participationHistory]);

  // Gói lại 3 nguồn dữ liệu kết quả thật (Rankie dùng liveOptions+votedMap, Path/Deck
  // dùng participationByKey) — truyền xuống ChapterSwitcher để hiện KẾT QUẢ thay vì
  // màn bình chọn cho chapter người dùng đã tham gia, y hệt cách feed vẫn làm.
  const chapterResultData = useMemo(
    () => ({ liveOptions, votedMap, participationByKey }),
    [liveOptions, votedMap, participationByKey]
  );

  const getOptions = (rankie) => liveOptions[rankie.id] || rankie.options;
  const setOptionsFor = (rankie) => (updater) =>
    setLiveOptions((prev) => {
      const current = prev[rankie.id] || rankie.options;
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [rankie.id]: next };
    });

  // --- Toast lỗi API nhỏ ở cuối màn (Phần 3+) ---
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Bài thật từ API có id dạng UUID; bài mock có id ngắn ("r1"…). Chỉ gọi API cho bài thật.
  const isApiId = (id) => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const toOptionIds = (val) => (Array.isArray(val) ? val : val != null ? [val] : []);
  // Đồng bộ số phiếu chuẩn từ server vào options local (giữ nguyên field khác: ảnh/màu/label).
  const syncServerVotes = (rankieId, serverOpts) =>
    setLiveOptions((prev) => {
      const base = prev[rankieId] || rankies.find((r) => r.id === rankieId)?.options || [];
      const byId = new Map(serverOpts.map((o) => [o.id, o]));
      return { ...prev, [rankieId]: base.map((o) => (byId.has(o.id) ? { ...o, votes: byId.get(o.id).votes, voters: byId.get(o.id).voters } : o)) };
    });

  const setVotedFor = (rankieId) => (val) => {
    // Optimistic local (giữ nguyên hành vi mock/demo).
    setVotedMap((prev) => ({ ...prev, [rankieId]: val }));
    // Bài thật: gửi vote lên backend; lỗi → toast; thành công → đồng bộ số phiếu.
    if (isApiId(rankieId)) {
      const optionIds = toOptionIds(val);
      if (optionIds.length > 0) {
        api.rankies
          .vote(rankieId, optionIds)
          .then((res) => { if (res && res.options) syncServerVotes(rankieId, res.options); })
          .catch((e) => showToast(e?.message || "Bình chọn thất bại"));
      }
    }
  };

  // Vote trực tiếp trên feed (Rankie 1-lựa-chọn): cập nhật liveOptions + votedMap tại chỗ,
  // dùng chung kho vote với màn chi tiết nên hai nơi luôn đồng bộ.
  const voteOnFeed = (rankie, optId) => {
    if (isRankieClosed(rankie)) return;
    const cur = singleVotedId(votedMap[rankie.id] ?? null) ?? null;
    if (cur === optId) {
      setVotedMap((prev) => ({ ...prev, [rankie.id]: null }));
      setOptionsFor(rankie)((prev) => prev.map((o) => (o.id === optId ? { ...o, votes: Math.max(0, o.votes - 1) } : o)));
      return;
    }
    setVotedMap((prev) => ({ ...prev, [rankie.id]: optId }));
    setOptionsFor(rankie)((prev) =>
      prev.map((o) => {
        if (o.id === optId) return { ...o, votes: o.votes + 1 };
        if (o.id === cur) return { ...o, votes: Math.max(0, o.votes - 1) };
        return o;
      })
    );
    const opt = getOptions(rankie).find((o) => o.id === optId);
    addToHistory({ type: "rankie", itemId: rankie.id, title: rankie.title, category: rankie.category, detail: opt?.label });
  };

  const apiRankies = apiPosts.filter((p) => p.type === "rankie");
  const allPaths = [samplePath, otherPath, demoPathAdventure, ...userPaths, ...apiPosts.filter((p) => p.type === "path")];
  const allDecks = [sampleDeck, sampleExamDeck, otherSurvey, otherExam, ...userDecks, ...apiPosts.filter((p) => p.type === "deck")];

  // Per-post management metadata (pin/hide/visibility/soft-delete), keyed by post id.
  // Kept separate from the post objects themselves so we don't have to touch the
  // shape of initialRankies/samplePath/sampleDeck or every place that builds a new
  // post — it's merged in at read time via withMeta() below.
  const [postMeta, setPostMeta] = useState({}); // { [postId]: { pinned, hidden, visibility, deletedAt } }
  const metaFor = (id) => postMeta[id] || {};
  const withMeta = (post) => ({ ...post, ...metaFor(post.id) });
  const updateMeta = (id, patch) =>
    setPostMeta((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  // ----- Profile management actions (pin, hide, delete/restore, duplicate, visibility) -----
  const togglePin = (post) => updateMeta(post.id, { pinned: !metaFor(post.id).pinned });
  const toggleHide = (post) => updateMeta(post.id, { hidden: !metaFor(post.id).hidden });
  const setVisibilityFor = (post, visibility) => updateMeta(post.id, { visibility });
  // Cycles Công khai -> Theo link -> Chỉ mình tôi -> Công khai, so the menu's single
  // "Quyền riêng tư" item can just be tapped repeatedly instead of opening a submenu.
  const cycleVisibility = (post) => {
    const current = metaFor(post.id).visibility || post.visibility || "public";
    const next = current === "public" ? "unlisted" : current === "unlisted" ? "private" : "public";
    setVisibilityFor(post, next);
  };
  // Soft-delete: marks deletedAt so the post moves to Thùng rác instead of vanishing
  // immediately. Permanently removed only when emptied from the trash (or after 30 days).
  const softDelete = (post) => updateMeta(post.id, { deletedAt: Date.now() });
  const restoreFromTrash = (post) => updateMeta(post.id, { deletedAt: null });
  const permanentlyDelete = (post) => {
    if (post.type === "rankie") setRankies((prev) => prev.filter((r) => r.id !== post.id));
    else if (post.type === "path") setUserPaths((prev) => prev.filter((p) => p.id !== post.id));
    else if (post.type === "deck") setUserDecks((prev) => prev.filter((d) => d.id !== post.id));
    else if (post.type === "share") setSharedPosts((prev) => prev.filter((s) => s.id !== post.id));
    setPostMeta((prev) => {
      const next = { ...prev };
      delete next[post.id];
      return next;
    });
  };
  const duplicatePost = (post) => {
    // Re-sharing a "share" doesn't make sense to duplicate the same way as content —
    // there's nothing to copy but the caption, so this is a no-op for shares.
    if (post.type === "share") return;
    const newId = `${post.type[0]}${Date.now()}`;
    const copy = {
      ...post,
      id: newId,
      title: `${post.title} (bản sao)`,
      createdAt: Date.now(),
      participants: 0,
      comments: post.type === "rankie" ? post.comments : 0,
      ...(post.type === "rankie"
        ? { options: post.options.map((o) => ({ ...o, votes: 0, voters: 0 })), live: true, closesAt: null }
        : post.type === "path"
        ? { results: post.results }
        : {}),
    };
    if (post.type === "rankie") setRankies((prev) => [copy, ...prev]);
    else if (post.type === "path") setUserPaths((prev) => [copy, ...prev]);
    else if (post.type === "deck") setUserDecks((prev) => [copy, ...prev]);
  };
  // Simple inline edit: title, subtitle/caption for now (options are left alone once
  // a post has live votes, to avoid silently invalidating collected data).
  const editPost = (post, patch) => {
    // Optimistic: chỉ áp METADATA (title/caption/media) — options để bản refresh từ API lo
    // (tránh trạng thái trung gian vỡ vì options edit-format thiếu votes).
    const meta = {};
    ["title", "subtitle", "caption", "category", "media"].forEach((k) => { if (patch[k] !== undefined) meta[k] = patch[k]; });
    const applyMeta = (prev) => prev.map((x) => (x.id === post.id ? { ...x, ...meta } : x));
    if (post.type === "rankie") setRankies(applyMeta);
    else if (post.type === "path") setUserPaths(applyMeta);
    else if (post.type === "deck") setUserDecks(applyMeta);
    else if (post.type === "share") setSharedPosts(applyMeta);

    // Bài THẬT: gửi đầy đủ (kể cả options) → swap bản refresh (options mới + phiếu giữ theo id).
    if (isApiId(post.id)) {
      const body = {};
      ["title", "subtitle", "caption", "category", "media", "options"].forEach((k) => { if (patch[k] !== undefined) body[k] = patch[k]; });
      if (Object.keys(body).length) {
        api.posts
          .update(post.id, body)
          .then((full) => {
            if (!full || !full.type) return;
            const real = full.type === "rankie" ? apiRankieToProto(full) : full.type === "path" ? apiPathToProto(full) : apiDeckToProto(full);
            const merged = { ...real, mine: true, author: currentUser };
            const swap = (prev) => prev.map((x) => (x.id === full.id ? merged : x));
            setRankies(swap); setUserPaths(swap); setUserDecks(swap); setApiPosts(swap);
            if (full.type === "rankie") setLiveOptions((prev) => ({ ...prev, [full.id]: merged.options }));
          })
          .catch((err) => showToast(err?.message || "Lưu chỉnh sửa thất bại"));
      }
    }
  };

  // Tăng số lượt chia sẻ thật của bài gốc — gọi khi ShareModal báo chia sẻ thành công
  // (đăng vào hồ sơ hoặc gửi tin nhắn), để icon Chia sẻ trong EngagementBar hiện đúng số.
  const bumpShares = (post) => { if (post) editPost(post, { shares: (post.shares || 0) + 1 }); };

  // Mixed feed: rankies + all paths + all decks.
  // "Đang thịnh hành" sorts by a composite trending score (participants × recency × live bonus);
  // any other category just uses newest-first so fresh content surfaces immediately.
  // Nhận diện bài của mình (bản author="me" từ state cục bộ, hoặc bản UUID từ /feed).
  const isMinePost = (p) => p.author?.id === "me" || (currentUser.apiId && p.author?.id === currentUser.apiId);
  // Gộp mọi nguồn, LOẠI TRÙNG theo id — ưu tiên bản author="me" (để nổi đầu + khớp Hồ sơ).
  const feedDedup = new Map();
  for (const item of [...apiRankies, ...rankies, ...allPaths, ...allDecks].map(withMeta)) {
    const existing = feedDedup.get(item.id);
    if (!existing || (item.author?.id === "me" && existing.author?.id !== "me")) feedDedup.set(item.id, item);
  }
  const feedItemsAll = [...feedDedup.values()]
    .filter((item) => !item.hidden && !item.deletedAt && item.visibility !== "private")
    .sort((a, b) => {
      // Kiểu Facebook: bài của mình nổi lên ĐẦU feed (mới nhất trước), rồi tới nội dung người khác.
      const am = isMinePost(a), bm = isMinePost(b);
      if (am !== bm) return am ? -1 : 1;
      if (am && bm) return (b.createdAt || 0) - (a.createdAt || 0);
      return activeCategory === "Đang thịnh hành"
        ? trendingScore(b) - trendingScore(a)
        : (b.createdAt || 0) - (a.createdAt || 0);
    });

  // Apply the category filter and the content-type filter.
  // "Đang thịnh hành" (trending tab) shows everything — the sort already handles ranking.
  const feedItems = feedItemsAll
    .filter((item) => activeCategory === "Đang thịnh hành" || item.category === activeCategory)
    .filter((item) => {
      if (typeFilter === "all") return true;
      if (typeFilter === "deck") return item.type === "deck" && item.deckMode !== "exam";
      if (typeFilter === "exam") return item.type === "deck" && item.deckMode === "exam";
      return item.type === typeFilter;
    });

  // All posts (rankies + paths + decks + shares) for the personal wall and lookups —
  // includes hidden/private/trashed posts too; ProfileView itself decides what to show
  // per tab, since the owner needs to see their own hidden/trashed content, unlike the
  // public feed. Shares only ever show up on the sharer's own profile (there's no
  // following/friend graph yet to justify surfacing them in the main feed too).
  const allPosts = [...apiRankies, ...rankies, ...allPaths, ...allDecks, ...sharedPosts].map(withMeta);

  // Đếm số bài của mỗi tác giả mà người dùng ĐÃ tham gia (vote/làm bài). Dùng cho điều
  // kiện mở tầng 3 "Fan cuồng": phải tham gia > 10 bài của kênh đó (và đang ở tầng 2).
  const participationCountByAuthor = useMemo(() => {
    const byId = {};
    allPosts.forEach((p) => { byId[p.id] = p.author?.id; });
    const counts = {};
    participationHistory.forEach((h) => {
      const aid = byId[h.itemId];
      if (aid && aid !== "me") counts[aid] = (counts[aid] || 0) + 1;
    });
    return counts;
  }, [participationHistory, allPosts]);
  const FAN_REQUIRED = 10; // số bài tối thiểu phải tham gia để mở Fan cuồng

  const openRankie = (id) => {
    setSelectedId(id);
    setPrevAfterDetail(view); // "feed" | "profile" | "search" — wherever the user opened this from
    setView("detail");
    // Bài thật: nạp đầy đủ (options có id thật, caption, số phiếu chuẩn) để vote được.
    if (isApiId(id)) {
      api.posts
        .get(id)
        .then((full) => {
          if (full && full.type === "rankie") {
            const proto = apiRankieToProto(full);
            // Áp dữ liệu thật vào post dù nó nằm ở apiPosts (feed) hay rankies (bài của mình).
            // Giữ mine/author của bản cũ để bài của mình không bị đẩy khỏi Hồ sơ.
            const patch = (p) => (p.id === id ? { ...proto, mine: p.mine, author: p.mine ? currentUser : proto.author } : p);
            setApiPosts((prev) => prev.map(patch));
            setRankies((prev) => prev.map(patch));
            setLiveOptions((prev) => ({ ...prev, [id]: proto.options }));
          }
        })
        .catch(() => {});
    }
  };

  const openPathFromFeed = (id) => {
    setSelectedPath(allPaths.find((p) => p.id === id) || samplePath);
    setPrevAfterPath("feed");
    setView("pathDetail");
  };

  const openPathFromProfile = (id) => {
    setSelectedPath(allPaths.find((p) => p.id === id) || samplePath);
    setPrevAfterPath("profile");
    setView("pathDetail");
  };

  const openPathFromSearch = (id) => {
    setSelectedPath(allPaths.find((p) => p.id === id) || samplePath);
    setPrevAfterPath("search");
    setView("pathDetail");
  };

  const openPathFromHistory = (id) => {
    setSelectedPath(allPaths.find((p) => p.id === id) || samplePath);
    setPrevAfterPath("history");
    setView("pathDetail");
  };

  const openDeckFromFeed = (id) => {
    setSelectedDeck(allDecks.find((d) => d.id === id) || sampleDeck);
    setPrevAfterDeck("feed");
    setView("deckDetail");
  };

  const openDeckFromProfile = (id) => {
    setSelectedDeck(allDecks.find((d) => d.id === id) || sampleDeck);
    setPrevAfterDeck("profile");
    setView("deckDetail");
  };

  const openDeckFromSearch = (id) => {
    setSelectedDeck(allDecks.find((d) => d.id === id) || sampleDeck);
    setPrevAfterDeck("search");
    setView("deckDetail");
  };

  const openDeckFromHistory = (id) => {
    setSelectedDeck(allDecks.find((d) => d.id === id) || sampleDeck);
    setPrevAfterDeck("history");
    setView("deckDetail");
  };

  const openDeckFromPresentationHistory = (id) => {
    setSelectedDeck(allDecks.find((d) => d.id === id) || sampleDeck);
    setPrevAfterDeck("presentationHistory");
    setView("deckDetail");
  };

  // Series: tập hợp các bài đăng theo chủ đề. Mỗi bài có seriesId + seriesName khi tạo;
  // allSeries tổng hợp danh sách chapter theo thứ tự createdAt, cho phép chỉnh sửa tên/thứ tự.
  const [seriesOverrides, setSeriesOverrides] = useState({}); // { seriesId: { name, order: [postId...] } }
  const allSeries = useMemo(() => {
    const map = {};
    [...rankies, ...allPaths, ...allDecks].forEach((p) => {
      if (!p.seriesId) return;
      if (!map[p.seriesId]) map[p.seriesId] = { id: p.seriesId, name: seriesOverrides[p.seriesId]?.name || p.seriesName || "Series", posts: [] };
      map[p.seriesId].posts.push(p);
    });
    Object.values(map).forEach((s) => {
      const order = seriesOverrides[s.id]?.order;
      if (order) s.posts.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      else s.posts.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    });
    return map;
  }, [rankies, allPaths, allDecks, seriesOverrides]);
  const [selectedSeriesId2, setSelectedSeriesId2] = useState(null);

  const openPathFromPresentationHistory = (id) => {
    setSelectedPath(allPaths.find((p) => p.id === id) || samplePath);
    setPrevAfterPath("presentationHistory");
    setView("pathDetail");
  };

  // Series management handlers
  const renameSeries = (seriesId, name) => setSeriesOverrides((prev) => ({ ...prev, [seriesId]: { ...prev[seriesId], name } }));
  const removeFromSeries = (seriesId, postId) => {
    // Đánh dấu bài bị loại khỏi series bằng cách xoá seriesId của nó
    editPost(rankies.find((r) => r.id === postId) || allPaths.find((p) => p.id === postId) || allDecks.find((d) => d.id === postId), { seriesId: null, seriesName: null });
  };
  const openSeriesDetail = (seriesId) => {
    setSelectedSeriesId2(seriesId);
    setView("seriesDetail");
  };
  // Điều hướng chapter từ swipe
  const navigateChapter = (post) => {
    if (post.type === "rankie") { setSelectedId(post.id); setView("detail"); }
    else if (post.type === "path") { setSelectedPath(post); setView("pathDetail"); }
    else { setSelectedDeck(post); setView("deckDetail"); }
  };
  const [selectedSession, setSelectedSession] = useState(null);
  const [prevAfterSession, setPrevAfterSession] = useState("profile");
  const openSessionDetail = (entry) => {
    setSelectedSession(entry);
    setPrevAfterSession(view);
    setView("sessionDetail");
  };
  const openPostForSession = (entry) => {
    if (!entry) return;
    if (entry.type === "rankie") { setSelectedId(entry.itemId); setPrevAfterDetail("sessionDetail"); setView("detail"); }
    else if (entry.type === "path") { setSelectedPath(allPaths.find((p) => p.id === entry.itemId) || samplePath); setPrevAfterPath("sessionDetail"); setView("pathDetail"); }
    else { setSelectedDeck(allDecks.find((d) => d.id === entry.itemId) || sampleDeck); setPrevAfterDeck("sessionDetail"); setView("deckDetail"); }
  };

  const openPathFromBookmarks = (id) => {
    setSelectedPath(allPaths.find((p) => p.id === id) || samplePath);
    setPrevAfterPath("bookmarks");
    setView("pathDetail");
  };

  const openDeckFromBookmarks = (id) => {
    setSelectedDeck(allDecks.find((d) => d.id === id) || sampleDeck);
    setPrevAfterDeck("bookmarks");
    setView("deckDetail");
  };

  // Opens the wall for whichever author was tapped on a Rankie/Path/Deck card,
  // remembering where to return to ("feed" | "search" | "detail" | "authorProfile"...).
  const openAuthorWall = (authorId) => {
    setViewedAuthorId(authorId || "me");
    setPrevAfterAuthor(view);
    setView("authorProfile");
  };

  const handleCreate = (item) => {
    // Optimistic: hiện ngay bằng item mock (giữ làm fallback nếu API lỗi/offline).
    if (item.type === "path") {
      setUserPaths((prev) => [item, ...prev]);
    } else if (item.type === "deck") {
      setUserDecks((prev) => [item, ...prev]);
    } else {
      setRankies((prev) => [item, ...prev]);
    }
    setView("feed");

    // Đăng thật lên backend; thành công thì thay item tạm bằng bản có UUID (_api)
    // để mọi thao tác sau (vote/mở chi tiết/sửa) chạy đúng luồng API.
    const tempId = item.id;
    api.posts
      .create(protoToCreatePayload(item))
      .then((full) => {
        const real =
          full.type === "path" ? apiPathToProto(full) : full.type === "deck" ? apiDeckToProto(full) : apiRankieToProto(full);
        // Giữ author = currentUser (id="me") để: (1) Hồ sơ hiện bài (lọc theo author.id==="me"),
        // (2) feed vẫn ẩn bài của mình. Nếu để author.id = UUID thì bài "rơi vào khe" — không hiện đâu cả.
        const merged = { ...real, mine: true, author: currentUser };
        const swap = (prev) => prev.map((x) => (x.id === tempId ? merged : x));
        if (item.type === "path") setUserPaths(swap);
        else if (item.type === "deck") setUserDecks(swap);
        else setRankies(swap);
        // Gom bài vào series (chapter) — persist lên backend.
        if (item.seriesName) persistSeries(full.id, item.seriesName, item.seriesId);
      })
      .catch((err) => showToast(err?.message || "Đăng bài thất bại — đang lưu tạm ngoại tuyến"));
  };

  // ---- SERIES / CHAPTER (persist) ----
  const [mySeries, setMySeries] = useState([]); // [{ id, name, postCount }]
  const loadMySeries = useCallback(() => {
    api.series.mine().then((r) => setMySeries(r.items || [])).catch(() => {});
  }, []);
  // seriesId: UUID thật (series có sẵn) → thêm bài vào; ngược lại (id local "s_..") → tạo series mới.
  const persistSeries = (postId, seriesName, seriesId) => {
    const addTo = (sid) => api.series.addPost(sid, postId).then(loadMySeries).catch(() => {});
    if (isApiId(seriesId)) addTo(seriesId);
    else api.series.create(seriesName).then((s) => addTo(s.id)).catch((err) => showToast(err?.message || "Lưu series thất bại"));
  };

  // Sửa cấu trúc path/deck qua CreateView (chế độ sửa). rankie sửa qua EditPostModal.
  const [editStructPost, setEditStructPost] = useState(null);
  const startStructEdit = (post) => {
    // Bài API: nạp FULL (questions/endings/options thật) trước khi mở editor — bản ở
    // Hồ sơ là summary (rỗng), reverse-map cần cấu trúc đầy đủ.
    if (isApiId(post.id)) {
      api.posts
        .get(post.id)
        .then((full) => {
          const proto = full.type === "path" ? apiPathToProto(full) : full.type === "deck" ? apiDeckToProto(full) : apiRankieToProto(full);
          setEditStructPost({ ...proto, mine: true, author: currentUser });
          setView("create");
        })
        .catch(() => { setEditStructPost(post); setView("create"); });
    } else {
      setEditStructPost(post);
      setView("create");
    }
  };
  const openCreateNew = () => { setEditStructPost(null); setView("create"); };
  const handleUpdate = (item) => {
    api.posts
      .update(item.id, protoToCreatePayload(item))
      .then((full) => {
        if (!full || !full.type) return;
        const real = full.type === "path" ? apiPathToProto(full) : full.type === "deck" ? apiDeckToProto(full) : apiRankieToProto(full);
        const merged = { ...real, mine: true, author: currentUser };
        const swap = (prev) => prev.map((x) => (x.id === full.id ? merged : x));
        setUserPaths(swap); setUserDecks(swap); setRankies(swap); setApiPosts(swap);
        if (full.type === "path") setSelectedPath((p) => (p && p.id === full.id ? merged : p));
        if (full.type === "deck") setSelectedDeck((d) => (d && d.id === full.id ? merged : d));
      })
      .catch((err) => showToast(err?.message || "Lưu chỉnh sửa thất bại"));
    setEditStructPost(null);
    setView("feed");
  };

  // ---- CHAT STATE ----
  const [contacts, setContacts] = useState(CHAT_CONTACTS);
  const [chatMessages, setChatMessages] = useState(INITIAL_MESSAGES);
  const [openContact, setOpenContact] = useState(null); // contact being viewed in ChatDetailView

  const openChat = (contact) => {
    // Mark as read
    setContacts((prev) => prev.map((c) => c.id === contact.id ? { ...c, unread: 0 } : c));
    setOpenContact(contact);
  };

  const sendChatMessage = (text, from = "me") => {
    if (!openContact) return;
    const newMsg = { id: "m" + Date.now(), from, text, time: Date.now() };
    setChatMessages((prev) => ({
      ...prev,
      [openContact.id]: [...(prev[openContact.id] || []), newMsg],
    }));
  };

  const chatUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);

  // ---------- AUTH (Phần 1) ----------
  // Hydrate hồ sơ thật vào `currentUser` (giữ id="me" để không vỡ mọi logic isMe),
  // giữ nguyên giá trị mock làm fallback khi API lỗi.
  const [authReady, setAuthReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const hydrateFromApi = useCallback((me) => {
    const u = me?.user;
    if (u) {
      Object.assign(currentUser, {
        // giữ id="me" — KHÔNG ghi đè bằng UUID để không phá logic author.id === "me"
        name: u.name || currentUser.name,
        handle: (u.handle || "").startsWith("@") ? u.handle : "@" + (u.handle || currentUser.handle.replace(/^@/, "")),
        avatarEmoji: u.avatarEmoji || currentUser.avatarEmoji,
        avatarColor: u.avatarColor || currentUser.avatarColor,
        avatarUrl: u.avatarUrl != null ? u.avatarUrl : currentUser.avatarUrl,
        verified: !!u.verified,
        bio: u.bio != null ? u.bio : currentUser.bio,
        followers: u.rankPoints != null ? u.rankPoints : currentUser.followers,
        apiId: u.id, // UUID thật, dùng cho các API cần id user
      });
    }
    if (me?.rankUps) setRankTiers((prev) => ({ ...prev, ...me.rankUps }));
  }, []);
  useEffect(() => {
    // Khi refresh token cũng hết hạn → quay về màn đăng nhập.
    setAuthLostHandler(() => setAuthed(false));
    (async () => {
      if (!api.isLoggedIn()) { setAuthReady(true); return; }
      try {
        const me = await auth.me();
        hydrateFromApi(me);
        setAuthed(true);
      } catch {
        setAuthed(false); // token hỏng → hiện login (mock vẫn là fallback hiển thị)
      } finally {
        setAuthReady(true);
      }
    })();
  }, [hydrateFromApi]);
  const handleAuthed = useCallback(async () => {
    try { hydrateFromApi(await auth.me()); } catch { /* vẫn cho vào, dùng mock */ }
    setAuthed(true);
  }, [hydrateFromApi]);

  const handleLogout = useCallback(() => {
    auth.logout().finally(() => {
      // Dọn dữ liệu thật khỏi state → về màn đăng nhập, mock lại làm nền.
      setApiPosts([]);
      setApiCursor(null);
      setBookmarks({});
      setAuthed(false);
      setView("feed");
    });
  }, []);

  // Ảnh đại diện: chọn file → preview ngay → upload → PATCH /users/me {avatarUrl}.
  const [avatarV, setAvatarV] = useState(0); // bump để re-render sau khi đổi currentUser (object mutable)
  const handleChangeAvatar = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;
      currentUser.avatarUrl = URL.createObjectURL(file); // preview blob tức thì
      setAvatarV((v) => v + 1);
      api
        .uploadImage(file, "image")
        .then((res) => {
          if (res && res.url) {
            currentUser.avatarUrl = res.url;
            setAvatarV((v) => v + 1);
            return auth.updateProfile({ avatarUrl: res.url });
          }
        })
        .catch(() => showToast("Đổi ảnh đại diện thất bại"));
    };
    input.click();
  }, []);

  // --- Nạp feed thật khi đã đăng nhập (Phần 2). Lỗi → giữ mock (fallback). ---
  useEffect(() => {
    if (!authed) return;
    let alive = true;
    (async () => {
      try {
        const res = await api.posts.feed();
        if (!alive) return;
        setApiPosts((res.items || []).map(apiSummaryToProto));
        setApiCursor(res.nextCursor || null);
      } catch { /* giữ mock */ }
    })();
    loadMySeries(); // nạp series của mình để chọn khi thêm chapter
    // Nạp danh sách đã lưu (bookmark) thật để đồng bộ trạng thái nút lưu.
    (async () => {
      try {
        const res = await api.bookmarks.list();
        if (!alive) return;
        setBookmarks((prev) => {
          const next = { ...prev };
          (res.items || []).forEach((s) => {
            const p = apiSummaryToProto(s);
            next[`${p.type}:${p.id}`] = { ...p, bookmarkedAt: Date.now() };
          });
          return next;
        });
      } catch { /* bỏ qua */ }
    })();
    // Nạp BÀI CỦA MÌNH thật (để không mất sau reload). author=currentUser (id="me")
    // → hiện ở Hồ sơ, ẩn ở feed. Gộp không trùng vào rankies/userPaths/userDecks.
    (async () => {
      try {
        const res = await api.posts.mine();
        if (!alive) return;
        const list = (res && res.items) || res || [];
        const mine = list.map((s) => ({ ...apiSummaryToProto(s), mine: true, author: currentUser }));
        const mergeUnique = (prev, add) => {
          const ids = new Set(prev.map((p) => p.id));
          return [...add.filter((p) => !ids.has(p.id)), ...prev];
        };
        setRankies((prev) => mergeUnique(prev, mine.filter((p) => p.type === "rankie")));
        setUserPaths((prev) => mergeUnique(prev, mine.filter((p) => p.type === "path")));
        setUserDecks((prev) => mergeUnique(prev, mine.filter((p) => p.type === "deck")));
      } catch { /* bỏ qua */ }
    })();
    return () => { alive = false; };
  }, [authed]);

  const loadMoreFeed = useCallback(async () => {
    if (feedLoadingMore || !apiCursor) return;
    setFeedLoadingMore(true);
    try {
      const res = await api.posts.feed(apiCursor);
      setApiPosts((prev) => [...prev, ...(res.items || []).map(apiSummaryToProto)]);
      setApiCursor(res.nextCursor || null);
    } catch { /* bỏ qua */ } finally {
      setFeedLoadingMore(false);
    }
  }, [apiCursor, feedLoadingMore]);

  // --- Rankie realtime (Phần 3): khi mở chi tiết một Rankie THẬT ---
  // Nạp phiếu của mình (GET /rankies/:id/votes/me) + subscribe WebSocket để nhận
  // vote_update realtime. Tự huỷ subscribe khi rời màn.
  useEffect(() => {
    if (view !== "detail" || !selectedId || !isApiId(selectedId)) return;
    let unsub = null;
    api.rankies
      .myVote(selectedId)
      .then((r) => {
        if (r && r.myVote) {
          const ids = r.myVote.optionIds || [];
          setVotedMap((prev) => ({ ...prev, [selectedId]: ids.length === 1 ? ids[0] : ids }));
        }
      })
      .catch(() => {});
    unsub = api.subscribeRankie(selectedId, (serverOpts) => syncServerVotes(selectedId, serverOpts));
    return () => { if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedId, authed]);

  // --- Nạp full DECK khi mở chi tiết một Deck THẬT (mọi opener dùng chung). ---
  useEffect(() => {
    if (view !== "deckDetail" || !selectedDeck || !selectedDeck._api) return;
    if (selectedDeck.questions && selectedDeck.questions.length > 0) return; // đã có full
    let alive = true;
    api.posts
      .get(selectedDeck.id)
      .then((full) => {
        if (!alive || !full || full.type !== "deck") return;
        // Giữ số lượt tham gia thật (từ summary) — apiDeckToProto để 0.
        const proto = { ...apiDeckToProto(full), participants: selectedDeck.participants || 0 };
        setSelectedDeck(proto);
        setApiPosts((prev) => prev.map((p) => (p.id === proto.id ? proto : p)));
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedDeck]);

  // --- Nạp kết quả của mình + thống kê cho Deck THẬT (Phần 5). ---
  useEffect(() => {
    const d = selectedDeck;
    if (view !== "deckDetail" || !d || !d._api) return;
    const id = d.id;
    if (apiDeckResults[id] === undefined) {
      api.decks
        .myResult(id)
        .then((r) => {
          if (r && r.result) setApiDeckResults((prev) => ({ ...prev, [id]: { answers: r.result.answers, submitted: true, result: r.result } }));
          else setApiDeckResults((prev) => ({ ...prev, [id]: { answers: null, submitted: false } }));
        })
        .catch(() => {});
    }
    if (d.deckMode === "exam" && apiDeckStats[id] === undefined) {
      api.decks.stats(id).then((s) => setApiDeckStats((prev) => ({ ...prev, [id]: s }))).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedDeck]);

  // --- Nạp full PATH + ending đã mở khoá khi mở chi tiết một Path THẬT (Phần 4). ---
  useEffect(() => {
    const p = selectedPath;
    if (view !== "pathDetail" || !p || !p._api) return;
    let alive = true;
    if (!p.questions || p.questions.length === 0) {
      api.posts
        .get(p.id)
        .then((full) => {
          if (!alive || !full || full.type !== "path") return;
          // Giữ số lượt tham gia thật (từ summary) — apiPathToProto để 0.
          const proto = { ...apiPathToProto(full), participants: p.participants || 0 };
          setSelectedPath(proto);
          setApiPosts((prev) => prev.map((x) => (x.id === proto.id ? proto : x)));
        })
        .catch(() => {});
    }
    if (pathUnlocks[p.id] === undefined) {
      api.paths
        .unlocks(p.id)
        .then((r) => { if (alive && r && r.endings) setPathUnlocks((prev) => ({ ...prev, [p.id]: r.endings })); })
        .catch(() => {});
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedPath]);

  const selected = [...rankies, ...apiRankies].find((r) => r.id === selectedId);
  const isOverlay =
    view === "detail" ||
    view === "pathDetail" ||
    view === "deckDetail" ||
    view === "present" ||
    view === "deckPresent" ||
    view === "pathPresent" ||
    view === "search" ||
    view === "authorProfile" ||
    view === "history" ||
    view === "presentationHistory" ||
    view === "sessionDetail" ||
    view === "seriesDetail" ||
    view === "bookmarks" ||
    view === "chat";

  // Cổng đăng nhập (Phần 1): chờ kiểm tra phiên → nếu chưa đăng nhập thì hiện AuthGate.
  if (!authReady) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", background: C.bg, minHeight: "100vh", fontFamily: bodyFont, color: C.textMuted }}>
        {FONT_IMPORT}
        <div style={{ fontFamily: displayFont, fontSize: 28, color: C.gold }}>Rankev…</div>
      </div>
    );
  }
  if (!authed) {
    return <AuthGate onAuthed={handleAuthed} />;
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", background: "#050A07", minHeight: "100vh", fontFamily: bodyFont }}>
      {FONT_IMPORT}
      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 84, transform: "translateX(-50%)", zIndex: 9999, background: "rgba(18,14,7,0.95)", color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 16px", fontFamily: bodyFont, fontSize: 13, maxWidth: "90%", textAlign: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          minHeight: "100vh",
          background: C.bg,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div ref={scrollContainerRef} onScroll={handleScrollContainer} style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          {view === "feed" && (
            <FeedView
              pathUnlocks={pathUnlocks}
              feedItems={feedItems}
              votedMap={votedMap}
              participatedKeys={participatedKeys}
              participationByKey={participationByKey}
              sessionCounts={sessionCounts}
              deckSessionCounts={deckSessionCounts}
              pathSessionCounts={pathSessionCounts}
              onBumpShares={bumpShares}
              presentationHistory={presentationHistory}
              onOpenPresentationHistory={() => setView("presentationHistory")}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
              onOpenRankie={openRankie}
              onOpenPath={openPathFromFeed}
              onOpenDeck={openDeckFromFeed}
              onOpenAuthor={openAuthorWall}
              onOpenSearch={() => setView("search")}
              onShareToProfile={shareToProfile}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              contacts={contacts}
              rankTiers={rankTiers}
              onSetRank={setRank}
              liveOptions={liveOptions}
              onVoteInline={voteOnFeed}
              fanCounts={participationCountByAuthor}
              onOpenSession={openSessionDetail}
            />
          )}
          {view === "search" && (
            <SearchView
              pathUnlocks={pathUnlocks}
              allPosts={allPosts}
              votedMap={votedMap}
              participatedKeys={participatedKeys}
              participationByKey={participationByKey}
              sessionCounts={sessionCounts}
              deckSessionCounts={deckSessionCounts}
              pathSessionCounts={pathSessionCounts}
              onBumpShares={bumpShares}
              presentationHistory={presentationHistory}
              onOpenPresentationHistory={() => setView("presentationHistory")}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
              searchHistory={searchHistory}
              onAddHistory={addToSearchHistory}
              onRemoveHistory={removeFromSearchHistory}
              onOpenRankie={openRankie}
              onOpenPath={openPathFromSearch}
              onOpenDeck={openDeckFromSearch}
              onOpenAuthor={openAuthorWall}
              onShareToProfile={shareToProfile}
              contacts={contacts}
              onBack={() => setView("feed")}
            />
          )}
          {view === "detail" && selected && (
            <RankieDetailWithSwipe selected={selected} allSeries={allSeries} navigateChapter={navigateChapter} participatedKeys={participatedKeys} resultData={chapterResultData} onOpenSeries={openSeriesDetail}>
            <RankieDetailView
              rankie={selected}
              options={getOptions(selected)}
              setOptions={setOptionsFor(selected)}
              voted={votedMap[selected.id] ?? null}
              setVoted={setVotedFor(selected.id)}
              sessions={presentationHistory.filter((h) => h.type === "rankie" && h.itemId === selected.id)}
              onOpenSession={openSessionDetail}
              onParticipate={addToHistory}
              onShareToProfile={shareToProfile}
              onBack={() => setView(prevAfterDetail)}
              onPresent={() => {
                setPresenterInitialOptions(getOptions(selected));
                setView("present");
              }}
              contacts={contacts}
            />
            </RankieDetailWithSwipe>
          )}
          {view === "present" && selected && (
            <PresenterView
              rankie={selected}
              initialOptions={presenterInitialOptions}
              onBack={() => setView("feed")}
              onSessionEnd={(session) => {
                saveSession({ ...session, rankieId: selected.id, rankieTitle: selected.title });
              }}
            />
          )}
          {view === "pathDetail" && (
            <PathDetailWithSwipe selectedPath={selectedPath} allSeries={allSeries} navigateChapter={navigateChapter} participatedKeys={participatedKeys} resultData={chapterResultData} onOpenSeries={openSeriesDetail}>
              <TopBar
                onBack={() => setView(prevAfterPath)}
                right={
                  <DetailHeaderActions
                    item={selectedPath}
                    onPresent={() => setView("pathPresent")}
                    isOwner={selectedPath.mine || selectedPath.author?.id === "me"}
                    participated={participatedKeys.has(`path:${selectedPath.id}`)}
                    allowGuestPresent={!!selectedPath.allowGuestPresent}
                    onShareToProfile={shareToProfile}
                    contacts={contacts}
                    onShared={() => bumpShares(selectedPath)}
                  />
                }
              />
              <PathView
                key={selectedPath?.id}
                path={selectedPath}
                startAtIntro
                onComplete={(e) => {
                  addToHistory(e);
                  if (e.type === "path") {
                    unlockPathEnding(e.itemId, e.detail);
                    // Path thật: ghi kết quả lên backend (mở khoá ending + cộng lượt).
                    // Chỉ gọi khi e.detail là một KẾT THÚC thật — PathView cũng phát onComplete
                    // ở màn "intro" (step "intro" không phải id câu hỏi), tránh gửi ending rác.
                    const isRealEnding =
                      selectedPath &&
                      selectedPath.results &&
                      Object.prototype.hasOwnProperty.call(selectedPath.results, e.detail);
                    if (isApiId(e.itemId) && isRealEnding) {
                      api.paths
                        .complete(e.itemId, e.detail)
                        .then((r) => { if (r && r.unlockedEndings) setPathUnlocks((prev) => ({ ...prev, [e.itemId]: r.unlockedEndings })); })
                        .catch((err) => showToast(err?.message || "Lưu kết quả thất bại"));
                    }
                  }
                }}
                unlockedEndings={pathUnlocks[selectedPath?.id] || []}
                onPresent={() => setView("pathPresent")}
                initialResultStep={participationByKey[`path:${selectedPath?.id}`]?.detail || null}
              />
            </PathDetailWithSwipe>
          )}
          {view === "pathPresent" && (
            <PathPresenterView
              path={selectedPath}
              onBack={() => setView("feed")}
              onSessionEnd={(session) => savePathSession({ ...session, pathId: selectedPath.id, pathTitle: selectedPath.title })}
            />
          )}
          {view === "deckDetail" && (
            <DeckDetailWithSwipe selectedDeck={selectedDeck} allSeries={allSeries} navigateChapter={navigateChapter} participatedKeys={participatedKeys} resultData={chapterResultData} onOpenSeries={openSeriesDetail}>
              <TopBar
                onBack={() => setView(prevAfterDeck)}
                right={
                  <DetailHeaderActions
                    item={selectedDeck}
                    onPresent={() => setView("deckPresent")}
                    isOwner={selectedDeck.mine || selectedDeck.author?.id === "me"}
                    participated={participatedKeys.has(`deck:${selectedDeck.id}`)}
                    allowGuestPresent={!!selectedDeck.allowGuestPresent}
                    onShareToProfile={shareToProfile}
                    contacts={contacts}
                    onShared={() => bumpShares(selectedDeck)}
                  />
                }
              />
              <DeckView
                key={(selectedDeck?.id || "") + ":" + (apiDeckResults[selectedDeck?.id]?.submitted ? "done" : "new")}
                deck={selectedDeck}
                onPresent={() => setView("deckPresent")}
                onComplete={(e) => {
                  addToHistory(e);
                  // Deck thật: nộp bài lên backend (server tự chấm lại — chống gian lận).
                  if (e.type === "deck" && isApiId(e.itemId)) {
                    api.decks
                      .submit(e.itemId, { answers: e.answers || {} })
                      .then((res) => setApiDeckResults((prev) => ({ ...prev, [e.itemId]: { answers: e.answers, submitted: true, result: res } })))
                      .catch((err) => showToast(err?.message || "Nộp bài thất bại"));
                  }
                }}
                initialAnswers={apiDeckResults[selectedDeck?.id]?.answers || participationByKey[`deck:${selectedDeck?.id}`]?.answers || null}
                initialSubmitted={apiDeckResults[selectedDeck?.id]?.submitted || !!participationByKey[`deck:${selectedDeck?.id}`]}
                serverResult={apiDeckResults[selectedDeck?.id]?.result || null}
                serverStats={apiDeckStats[selectedDeck?.id] || null}
              />
            </DeckDetailWithSwipe>
          )}
          {view === "deckPresent" && (
            selectedDeck?.deckMode === "exam"
              ? <ExamPresenterView deck={selectedDeck} onBack={() => setView("feed")} onShareToProfile={shareToProfile} contacts={contacts} onSessionEnd={(session) => saveDeckSession({ ...session, deckId: selectedDeck.id, deckTitle: selectedDeck.title, deckMode: selectedDeck.deckMode })} />
              : <DeckPresenterView deck={selectedDeck} onBack={() => setView("feed")} onShareToProfile={shareToProfile} contacts={contacts} onSessionEnd={(session) => saveDeckSession({ ...session, deckId: selectedDeck.id, deckTitle: selectedDeck.title, deckMode: selectedDeck.deckMode })} />
          )}
          {view === "create" && <CreateView onCreate={handleCreate} onUpdate={handleUpdate} editItem={editStructPost} mySeries={mySeries} />}
          {view === "profile" && (
            <ProfileView
              pathUnlocks={pathUnlocks}
              posts={allPosts}
              authorId="me"
              onLogout={handleLogout}
              onChangeAvatar={handleChangeAvatar}
              onEditStructure={startStructEdit}
              votedMap={votedMap}
              participatedKeys={participatedKeys}
              participationByKey={participationByKey}
              sessionCounts={sessionCounts}
              deckSessionCounts={deckSessionCounts}
              pathSessionCounts={pathSessionCounts}
              onBumpShares={bumpShares}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
              participationHistory={participationHistory}
              onRemoveHistory={removeFromHistory}
              presentationHistory={presentationHistory}
              onOpenRankie={openRankie}
              onOpenPath={openPathFromProfile}
              onOpenDeck={openDeckFromProfile}
              onOpenAuthor={openAuthorWall}
              onOpenHistory={() => setView("history")}
              onOpenPresentationHistory={() => setView("presentationHistory")}
              onOpenSession={openSessionDetail}
              onOpenBookmarks={() => setView("bookmarks")}
              onShareToProfile={shareToProfile}
              onBack={() => setView("feed")}
              onPin={togglePin}
              onHide={toggleHide}
              onEdit={editPost}
              onDuplicate={duplicatePost}
              onSoftDelete={softDelete}
              onRestore={restoreFromTrash}
              onPermanentDelete={permanentlyDelete}
              onCycleVisibility={cycleVisibility}
            />
          )}
          {view === "authorProfile" && (
            <ProfileView
              pathUnlocks={pathUnlocks}
              posts={allPosts}
              authorId={viewedAuthorId}
              rankTier={rankTiers[viewedAuthorId] || 0}
              onSetRank={setRank}
              fanCount={participationCountByAuthor[viewedAuthorId] || 0}
              votedMap={votedMap}
              participatedKeys={participatedKeys}
              participationByKey={participationByKey}
              sessionCounts={sessionCounts}
              deckSessionCounts={deckSessionCounts}
              pathSessionCounts={pathSessionCounts}
              onBumpShares={bumpShares}
              presentationHistory={presentationHistory}
              onOpenPresentationHistory={() => setView("presentationHistory")}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
              onOpenRankie={openRankie}
              onOpenPath={openPathFromProfile}
              onOpenDeck={openDeckFromProfile}
              onOpenAuthor={openAuthorWall}
              onShareToProfile={shareToProfile}
              onBack={() => setView(prevAfterAuthor)}
            />
          )}
          {view === "history" && (
            <ParticipationHistoryView
              history={participationHistory}
              onOpenRankie={openRankie}
              onOpenPath={openPathFromHistory}
              onOpenDeck={openDeckFromHistory}
              onRemove={removeFromHistory}
              onClear={clearHistory}
              onBack={() => setView("profile")}
            />
          )}
          {view === "presentationHistory" && (
            <PresentationHistoryView
              history={presentationHistory}
              onOpenSession={openSessionDetail}
              onBack={() => setView("profile")}
            />
          )}
          {view === "seriesDetail" && selectedSeriesId2 && (
            <SeriesView
              series={allSeries[selectedSeriesId2]}
              allSeries={allSeries}
              onBack={() => setView(prevAfterSession || "profile")}
              onOpenPost={(p) => navigateChapter(p)}
              onRename={renameSeries}
              onRemove={removeFromSeries}
            />
          )}
          {view === "sessionDetail" && selectedSession && (
            <SessionDetailView
              session={selectedSession}
              post={allPosts.find((p) => p.id === selectedSession.itemId) || null}
              onBack={() => setView(prevAfterSession)}
              onOpenPost={() => openPostForSession(selectedSession)}
            />
          )}
          {view === "bookmarks" && (
            <BookmarksView
              bookmarks={bookmarks}
              onOpenRankie={openRankie}
              onOpenPath={openPathFromBookmarks}
              onOpenDeck={openDeckFromBookmarks}
              onToggleBookmark={toggleBookmark}
              onBack={() => setView("profile")}
            />
          )}
          {view === "chat" && !openContact && (
            <ChatListView
              contacts={contacts}
              messages={chatMessages}
              onOpen={openChat}
              onBack={() => setView("feed")}
            />
          )}
          {view === "chat" && openContact && (
            <ChatDetailView
              contact={openContact}
              messages={chatMessages[openContact.id] || []}
              onSend={sendChatMessage}
              onBack={() => setOpenContact(null)}
            />
          )}
        </div>
        {(!isOverlay || (view === "chat" && !openContact)) && (
          <BottomNav active={view} setView={(v) => { setOpenContact(null); if (v === "create") setEditStructPost(null); setView(v); }} chatUnread={chatUnread} />
        )}
      </div>
    </div>
  );
}
