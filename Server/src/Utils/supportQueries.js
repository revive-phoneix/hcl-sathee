const buildSupportQueryNotificationPayload = ({ title, description, user }) => {
  const trimmedTitle = String(title || "").trim();
  const trimmedDescription = String(description || "").trim();
  const submitterName = String(user?.name || user?.email || "A user").trim();

  return {
    title: "New Query from Partner Portal",
    body: `${submitterName} submitted a new query: ${trimmedTitle || "Untitled query"}. ${trimmedDescription || "No description provided."}`,
    data: {
      type: "support-query",
      queryTitle: trimmedTitle || "Untitled query",
      queryDescription: trimmedDescription || "No description provided.",
      submittedBy: submitterName,
    },
  };
};

module.exports = { buildSupportQueryNotificationPayload };
