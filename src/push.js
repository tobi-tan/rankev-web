// Thông báo đẩy trên WEB (Web Push/VAPID). App điện thoại (Capacitor) cần Firebase → chưa bật.
import api from "./api.js";
import { isNative } from "./native.js";

export const pushSupported = () =>
  !isNative && typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// iPhone/iPad: Safari chỉ cho thông báo đẩy khi Rankev được "Thêm vào Màn hình chính".
export const iosNeedsInstall = () =>
  typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.navigator.standalone && !pushSupported();

function keyBytes(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) || navigator.serviceWorker.register("/sw.js");
}
let cfg = null;
export async function pushConfig() {
  if (!cfg) cfg = api.push.config().catch(() => ({ enabled: false }));
  return cfg;
}
/** "on" | "off" | "denied" | "unavailable" */
export async function pushStatus() {
  if (!pushSupported()) return "unavailable";
  const c = await pushConfig();
  if (!c?.enabled) return "unavailable";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = reg && (await reg.pushManager.getSubscription());
  return sub && Notification.permission === "granted" ? "on" : "off";
}
export async function enablePush() {
  const c = await pushConfig();
  if (!c?.enabled) return "unavailable";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "denied" : "off";
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(c.publicKey) }));
  await api.push.subscribe(sub.toJSON());
  return "on";
}
export async function disablePush() {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = reg && (await reg.pushManager.getSubscription());
  if (!sub) return;
  try { await api.push.unsubscribe(sub.endpoint); } catch { /* vẫn huỷ ở trình duyệt */ }
  await sub.unsubscribe().catch(() => {});
}
/** Sau đăng nhập: thiết bị đã bật thông báo → gắn đăng ký vào tài khoản đang dùng. */
export async function resyncPush() {
  if (!pushSupported() || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = reg && (await reg.pushManager.getSubscription());
  if (sub) await api.push.subscribe(sub.toJSON()).catch(() => {});
}
