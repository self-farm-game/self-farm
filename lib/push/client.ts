"use client";
// Браузерна частина push: зареєструвати service worker, підписатись,
// віддати підписку серверу. І чесно сказати, коли нічого з цього тут
// не вийде.

export const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

/** Чи налаштований push узагалі (чи є публічний ключ у збірці). */
export const pushConfigured = Boolean(VAPID_PUBLIC);

export type PushState =
  | "unsupported" // браузер не вміє (або iOS у вкладці, не з головного екрана)
  | "ios-needs-install" // iPhone: спершу «На екран «Додому»»
  | "not-configured" // ключів немає — гра зібрана без push
  | "denied" // людина заборонила сповіщення
  | "ready" // можна підписуватись
  | "subscribed"; // уже підписані

/** Чи це iOS-пристрій. iPadOS прикидається Mac, тому ще й по дотиках. */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Чи гра відкрита як застосунок з головного екрана, а не у вкладці. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // Safari має свій нестандартний прапорець
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function pushState(): Promise<PushState> {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    // На iPhone у звичайній вкладці PushManager просто відсутній — це не
    // поломка, це вимога Apple: спершу встановити на головний екран.
    return isIOS() && !isStandalone() ? "ios-needs-install" : "unsupported";
  }
  if (!pushConfigured) return "not-configured";
  if (Notification.permission === "denied") return "denied";
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) return "subscribed";
  } catch {
    /* ще не зареєстрований — нормально */
  }
  return "ready";
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

/**
 * Увімкнути push: дозвіл → підписка → віддати її серверу.
 * Повертає помилку рядком, а не кидає: усе це викликається з кнопки, і
 * людині треба показати, що саме не вийшло.
 */
export async function enablePush(opts: {
  times: string[];
  lang: string;
  userId?: string | null;
}): Promise<{ ok: true } | { ok: false; reason: PushState | "failed" | "no-permission" }> {
  const st = await pushState();
  if (st === "unsupported" || st === "ios-needs-install" || st === "not-configured") {
    return { ok: false, reason: st };
  }

  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "no-permission" };

  const reg = (await navigator.serviceWorker.getRegistration()) || (await registerSW());
  if (!reg) return { ok: false, reason: "failed" };
  await navigator.serviceWorker.ready;

  let sub: PushSubscription | null = null;
  try {
    sub =
      (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      }));
  } catch {
    return { ok: false, reason: "failed" };
  }

  try {
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: sub.toJSON(),
        times: opts.times,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Kiev",
        lang: opts.lang,
        userId: opts.userId || null,
      }),
    });
    if (!res.ok) return { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
  return { ok: true };
}

/** Вимкнути: прибрати підписку і в браузері, і на сервері. */
export async function disablePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), enabled: false }),
    }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  } catch {
    /* нічого страшного: без підписки сервер усе одно нічого не надішле */
  }
}
