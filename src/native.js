// Cầu nối APP ĐIỆN THOẠI (Capacitor). Trên web mọi hàm đều là no-op an toàn.
// - Thanh trạng thái theo giao diện sáng/tối · nút Back Android (lùi màn / thu nhỏ app như FB)
// - Rung phản hồi khi bình chọn · bảng chia sẻ của hệ điều hành · mở link rankev://… / https://…/vote/…
import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // "ios" | "android" | "web"

// Domain web thật dùng cho link chia sẻ (app native không có origin http để dựng link).
export const SHARE_BASE = isNative ? "https://rankev-web.vercel.app" : (typeof window !== "undefined" ? window.location.origin : "https://rankev-web.vercel.app");
export const shareLink = (kind, id) => `${SHARE_BASE}/${kind}/${id}`;

let Haptics, ImpactStyle, Share;

let started = false;
export async function initNative({ onOpenUrl } = {}) {
  if (!isNative || started) return;
  started = true;
  const [{ StatusBar, Style }, { App }, { SplashScreen }, hap, share] = await Promise.all([
    import("@capacitor/status-bar"),
    import("@capacitor/app"),
    import("@capacitor/splash-screen"),
    import("@capacitor/haptics"),
    import("@capacitor/share"),
  ]);
  Haptics = hap.Haptics; ImpactStyle = hap.ImpactStyle; Share = share.Share;
  document.documentElement.classList.add("rk-native", `rk-${platform}`);

  // Thanh trạng thái: theo theme (tối = chữ sáng). Android: không đè lên WebView.
  const applyBar = () => {
    const light = document.documentElement.getAttribute("data-theme") === "light";
    StatusBar.setStyle({ style: light ? Style.Light : Style.Dark }).catch(() => {});
    if (platform === "android") {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      StatusBar.setBackgroundColor({ color: light ? "#F4F1E8" : "#101C15" }).catch(() => {});
    }
  };
  applyBar();
  new MutationObserver(applyBar).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // Nút Back Android: lùi màn trong app (dùng chung cơ chế lịch sử như cử chỉ vuốt);
  // hết màn để lùi → thu nhỏ app (giống Facebook), không thoát hẳn.
  App.addListener("backButton", ({ canGoBack }) => {
    const ev = new CustomEvent("rk-native-back", { cancelable: true });
    window.dispatchEvent(ev); // sheet / popup đang mở có thể tự đóng và chặn (preventDefault)
    if (ev.defaultPrevented) return;
    if (canGoBack) window.history.back();
    else App.minimizeApp();
  });

  // Link mở thẳng vào app: rankev://vote/<id>, https://rankev-web.vercel.app/vote/<id>…
  App.addListener("appUrlOpen", ({ url }) => { if (url) onOpenUrl?.(url); });
  App.getLaunchUrl().then((r) => { if (r?.url) onOpenUrl?.(r.url); }).catch(() => {});

  SplashScreen.hide().catch(() => {});
}

/** Rung nhẹ (bình chọn, RankUp…) — chỉ trong app. */
export function haptic(kind = "light") {
  if (!Haptics) return;
  const style = kind === "medium" ? ImpactStyle.Medium : kind === "heavy" ? ImpactStyle.Heavy : ImpactStyle.Light;
  Haptics.impact({ style }).catch(() => {});
}

/** Bảng chia sẻ của hệ điều hành (app) / navigator.share (web). Trả false nếu không có. */
export async function systemShare({ title, url, text }) {
  if (Share) { try { await Share.share({ title, text, url, dialogTitle: title }); return true; } catch { return false; } }
  if (typeof navigator !== "undefined" && navigator.share) { try { await navigator.share({ title, text, url }); return true; } catch { return false; } }
  return false;
}
export const canSystemShare = () => isNative || (typeof navigator !== "undefined" && !!navigator.share);
