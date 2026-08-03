const LeaveRequest = require("../Models/LeaveRequest");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { isAdminRole, filterByUserCentre } = require("../Utils/centreMatch");

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
const VALID_STATUSES = new Set(["approved", "rejected"]);

exports.createLeaveRequest = wrap(
  async (req, res) => {
    const fromDate = String(req.body?.fromDate || "").trim();
    const toDate = String(req.body?.toDate || "").trim();
    const reason = String(req.body?.reason || "").trim();
    const name = String(req.body?.name || "").trim() || null;

    if (!isValidDate(fromDate) || !isValidDate(toDate)) {
      return fail(res, 400, "fromDate and toDate are required (YYYY-MM-DD)");
    }
    if (toDate < fromDate) {
      return fail(res, 400, "toDate cannot be before fromDate");
    }
    if (!reason) {
      return fail(res, 400, "Reason is required");
    }
    if (reason.length > 1000) {
      return fail(res, 400, "Reason must be at most 1000 characters");
    }

    const leave = await LeaveRequest.create({
      userId: req.user?.id ?? null,
      name,
      email: req.user?.email || null,
      centre: req.user?.centre || null,
      fromDate,
      toDate,
      reason,
    });

    return ok(res, 201, {
      message: "Leave request submitted successfully",
      leave,
    });
  },
  {
    label: "Create Leave Request Error",
    message: "Failed to submit leave request",
    useErrorMessage: true,
  }
);

exports.getMyLeaveRequests = wrap(
  async (req, res) => {
    const userId = req.user?.id;
    if (userId == null) return fail(res, 401, "Authentication required");
    const leaves = await LeaveRequest.findByUser(userId);
    return ok(res, { leaves });
  },
  { label: "Get My Leave Requests Error", message: "Failed to fetch leave requests" }
);

exports.getLeaveRequests = wrap(
  async (req, res) => {
    if (!isAdminRole(req.user?.role)) {
      return fail(res, 403, "Admin access required");
    }
    const leaves = filterByUserCentre(await LeaveRequest.findAll(), req.user);
    return ok(res, { leaves });
  },
  { label: "Get Leave Requests Error", message: "Failed to fetch leave requests" }
);

exports.updateLeaveRequestStatus = wrap(
  async (req, res) => {
    if (!isAdminRole(req.user?.role)) {
      return fail(res, 403, "Admin access required");
    }

    const { id } = req.params;
    const status = String(req.body?.status || "").trim().toLowerCase();

    if (!VALID_STATUSES.has(status)) {
      return fail(res, 400, "Status must be approved or rejected");
    }

    const current = await LeaveRequest.findById(id);
    if (!current) {
      return fail(res, 404, "Leave request not found");
    }

    if (current.status && String(current.status).toLowerCase() !== "pending") {
      return fail(res, 409, "Leave request has already been reviewed");
    }

    const leave = await LeaveRequest.updateStatus(id, status, {
      reviewedBy: req.user?.id ?? null,
      reviewedByEmail: req.user?.email ?? null,
      reviewedAt: new Date(),
    });

    return ok(res, {
      message: `Leave request ${status}`,
      leave,
    });
  },
  {
    label: "Update Leave Request Status Error",
    message: "Failed to update leave request status",
    useErrorMessage: true,
  }
);
