const { getMessaging } = require("firebase-admin/messaging");

const sendToTokens = async (tokens, { title, body, data = {} }) => {
  const clean = [...new Set((tokens || []).filter(Boolean))];
  if (!clean.length) return;

  try {
    await getMessaging().sendEachForMulticast({
      tokens: clean,
      notification: { title, body },
      data,
    });
  } catch (err) {
    console.error("Push notification failed:", err.message);
  }
};

module.exports = { sendToTokens };