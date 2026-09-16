// Plain Web Push (VAPID) — no Firebase SDK, works natively in every modern
// browser. Replaces the old firebase.js FCM helpers.

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

const isPushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

/**
 * Requests notification permission (if not already granted) and returns a
 * PushSubscription (plain JSON: { endpoint, keys: { p256dh, auth } }), or
 * null if unsupported/denied. Reuses an existing subscription if present.
 */
export const subscribeToPush = async () => {
  if (!isPushSupported()) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register("/push-sw.js");
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing.toJSON();

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  return subscription.toJSON();
};

/**
 * Unsubscribes the current device from push, returning the (now-cancelled)
 * subscription's JSON so the server can also drop it, or null if there was
 * none to begin with.
 */
export const unsubscribeFromPush = async () => {
  if (!isPushSupported()) return null;

  const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
  if (!registration) return null;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return null;

  const json = subscription.toJSON();
  await subscription.unsubscribe();
  return json;
};
