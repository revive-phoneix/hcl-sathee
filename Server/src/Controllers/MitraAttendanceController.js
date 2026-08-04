const MitraAttendance = require("../Models/MitraAttendance");
const User = require("../Models/User");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { filterByUserCentre } = require("../Utils/centreMatch");

const VALID_TYPES = new Set(["arrival", "departure"]);

exports.getMitraAttendance = wrap(
  async (req, res) => {
    const date = (req.query.date || "").trim();
    if (!date) {
      return fail(res, 400, "date query param is required (YYYY-MM-DD)");
    }

    const records = filterByUserCentre(
      await MitraAttendance.findByDate(date),
      req.user
    );
    return ok(res, { records });
  },
  { label: "Get Mitra Attendance Error", message: "Failed to fetch Sathee Mitra attendance" }
);

exports.uploadMitraPhoto = wrap(
  async (req, res) => {
    const {
      name,
      email,
      centre,
      centreId,
      date,
      type,
      dailyAttendancePercentage,
      weeklyAttendancePercentage,
      monthlyAttendancePercentage,
    } = req.body;
    const userId = req.user?.id;

    if (!userId || !date || !type) {
      return fail(res, 400, "date and type are required");
    }
    if (!VALID_TYPES.has(type)) {
      return fail(res, 400, "type must be arrival or departure");
    }
    if (!req.file) {
      return fail(res, 400, "Photo file is required");
    }

    const dbUser = await User.findById(userId);
    const record = await MitraAttendance.upsertCheckIn({
      userId,
      name: dbUser?.name || name || null,
      email: dbUser?.email || req.user?.email || email || null,
      centre: dbUser?.centre || centre || req.user?.centre || null,
      centreId: centreId || null,
      date,
      type,
      file: req.file,
      dailyAttendancePercentage,
      weeklyAttendancePercentage,
      monthlyAttendancePercentage,
    });

    return ok(res, {
      message: `${type} photo uploaded successfully`,
      record,
    });
  },
  {
    label: "Upload Mitra Photo Error",
    message: "Failed to upload photo",
    useErrorMessage: true,
  }
);
