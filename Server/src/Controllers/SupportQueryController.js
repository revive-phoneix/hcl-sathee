const { fail, ok, wrap } = require("../Utils/httpResponse");
const User = require("../Models/User");
const { isAdminRole } = require("../Utils/centreMatch");
const { sendToTokens } = require("../Utils/pushNotifications");
const { buildSupportQueryNotificationPayload } = require("../Utils/supportQueries");

exports.createSupportQuery = wrap(
  async (req, res) => {
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();

    if (!title) {
      return fail(res, 400, "Query title is required");
    }
    if (!description) {
      return fail(res, 400, "Description is required");
    }
    if (description.length > 2000) {
      return fail(res, 400, "Description must be at most 2000 characters");
    }

    const allUsers = await User.findAll();
    const admins = allUsers.filter((u) => isAdminRole(u.role));
    const tokens = admins.flatMap((u) => u.fcmTokens || []);

    const payload = buildSupportQueryNotificationPayload({
      title,
      description,
      user: req.user,
    });

    sendToTokens(tokens, payload);

    return ok(res, 201, {
      message: "Your query has been submitted successfully. Admins have been notified.",
      query: {
        title,
        description,
        submittedBy: req.user?.email || req.user?.id || "user",
      },
    });
  },
  {
    label: "Create Support Query Error",
    message: "Failed to submit support query",
    useErrorMessage: true,
  }
);
