const webpush = require("web-push");

let configured = false;

const ensureConfigured = () => {
  if (configured) return;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    throw new Error(
      "Web Push not configured. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT in .env."
    );
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
};

/**
 * Sends a Web Push notification to each subscription. `subscriptions` is an
 * array of PushSubscription objects ({ endpoint, keys: { p256dh, auth } }) —
 * see User.pushSubscriptions — not token strings.
 */
const sendToTokens = async (subscriptions, { title, body, data = {} }) => {
  const clean = (subscriptions || []).filter((s) => s?.endpoint);
  if (!clean.length) return;

  try {
    ensureConfigured();
  } catch (err) {
    console.error("Push notification failed:", err.message);
    return;
  }

  const payload = JSON.stringify({ title, body, data });

  await Promise.all(
    clean.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        console.error("Push notification failed for one subscription:", err.message);
      }
    })
  );
};

module.exports = { sendToTokens };
