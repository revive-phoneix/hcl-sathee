const { fail, ok, wrap } = require("../Utils/httpResponse");
const User = require("../Models/User");
const SupportQuery = require("../Models/SupportQuery");
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

    const query = await SupportQuery.create({
      title,
      description,
      submittedBy: req.user?.name || req.user?.email || "Partner User",
      submittedByEmail: req.user?.email || "",
      submittedByRole: req.user?.role || "HCL Partner",
      centre: req.user?.centre || null,
    });

    const allUsers = await User.findAll();
    const admins = allUsers.filter((u) => isAdminRole(u.role));
    const tokens = admins.flatMap((u) => u.fcmTokens || []);

    const payload = buildSupportQueryNotificationPayload({
      title,
      description,
      user: req.user,
    });

    await sendToTokens(tokens, payload);

    return ok(res, 201, {
      message: "Your query has been submitted successfully. Admins have been notified.",
      query,
    });
  },
  {
    label: "Create Support Query Error",
    message: "Failed to submit support query",
    useErrorMessage: true,
  }
);

exports.getSupportQueries = wrap(
  async (_req, res) => {
    const queries = await SupportQuery.findAll();
    return ok(res, { queries });
  },
  {
    label: "Get Support Queries Error",
    message: "Failed to fetch support queries",
  }
);

exports.getMySupportQueries = wrap(
  async (req, res) => {
    const email = String(req.user?.email || "").trim().toLowerCase();
    const queries = email ? await SupportQuery.findBySubmittedByEmail(email) : [];
    return ok(res, { queries });
  },
  {
    label: "Get My Support Queries Error",
    message: "Failed to fetch your support queries",
  }
);

exports.replyToSupportQuery = wrap(
  async (req, res) => {
    const { id } = req.params;
    const message = String(req.body?.message || "").trim();
    const adminName = String(req.user?.name || req.user?.email || "Admin").trim();

    if (!message) {
      return fail(res, 400, "Reply message is required");
    }

    const updated = await SupportQuery.addReply(id, { adminName, message });
    if (!updated) {
      return fail(res, 404, "Query not found");
    }

    const queryOwner = await User.findByEmail(updated.submittedByEmail || "");
    if (queryOwner?.fcmTokens?.length) {
      await sendToTokens(queryOwner.fcmTokens, {
        title: "Admin replied to your query",
        body: `${adminName}: ${message}`,
        data: {
          type: "support-query-reply",
          queryId: String(updated.id),
          queryTitle: updated.title,
        },
      });
    }

    return ok(res, { message: "Reply sent successfully", query: updated });
  },
  {
    label: "Reply Support Query Error",
    message: "Failed to send reply",
    useErrorMessage: true,
  }
);
