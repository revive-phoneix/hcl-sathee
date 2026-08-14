const VishistAttendance = require("../Models/VishistAttendance");
const User = require("../Models/User");
const { fail, ok, wrap } = require("../Utils/httpResponse");

exports.getVishistAttendance = wrap(
  async (req, res) => {
    const date = (req.query.date || "").trim();
    if (!date) return fail(res, 400, "date is required");
    const records = await VishistAttendance.findByDate(
      date,
      req.query.centre || null,
      req.query.status || null
    );
    return ok(res, { records });
  },
  { label: "Get Vishist Attendance Error", message: "Failed to fetch Vishist attendance" }
);

exports.markVishistAttendance = wrap(
  async (req, res) => {
    const { vishistUserId, subject, topicTaught, date } = req.body;
    if (!vishistUserId || !subject || !topicTaught || !date) {
      return fail(res, 400, "vishistUserId, subject, topicTaught and date are required");
    }

    const vishistUser = await User.findById(vishistUserId);
    if (!vishistUser || !vishistUser.isVishist) {
      return fail(res, 400, "Selected user is not a valid Sathee Vishist");
    }

    const record = await VishistAttendance.create({
      vishistUserId,
      vishistName: vishistUser.name,
      vishistEmail: vishistUser.email,
      centre: vishistUser.centre,
      subject,
      topicTaught,
      date,
      file: req.file,
      markedByUserId: req.user?.id,
      markedByName: req.user?.name,
    });

    return ok(res, { message: "Vishist attendance marked", record });
  },
  { label: "Mark Vishist Attendance Error", message: "Failed to mark Vishist attendance" }
);

exports.approveVishistAttendance = wrap(
  async (req, res) => {
    try {
      const record = await VishistAttendance.approve(req.params.id, req.user?.id);
      return ok(res, { message: "Vishist attendance approved", record });
    } catch (err) {
      return fail(res, err.status || 400, err.message || "Unable to approve attendance");
    }
  },
  { label: "Approve Vishist Attendance Error", message: "Failed to approve Vishist attendance" }
);

