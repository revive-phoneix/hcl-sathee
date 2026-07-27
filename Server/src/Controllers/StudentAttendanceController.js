const StudentAttendance = require("../Models/StudentAttendance");
const Student = require("../Models/Student");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { filterByUserCentre } = require("../Utils/centreMatch");

exports.getStudentAttendance = wrap(
  async (req, res) => {
    const date = (req.query.date || "").trim();
    const from = (req.query.from || "").trim();
    const to = (req.query.to || "").trim();

    let records;
    if (from && to) {
      records = await StudentAttendance.findByDateRange(from, to);
    } else if (date) {
      records = await StudentAttendance.findByDate(date);
    } else {
      return fail(res, 400, "Provide date=YYYY-MM-DD or from & to date range");
    }

    return ok(res, { records: filterByUserCentre(records, req.user) });
  },
  { label: "Get Student Attendance Error", message: "Failed to fetch student attendance" }
);

exports.upsertStudentAttendance = wrap(
  async (req, res) => {
    const { studentId, name, centre, date, status, dailyAttendancePercentage } =
      req.body;

    if (!studentId || !date || !status) {
      return fail(res, 400, "studentId, date and status are required");
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return fail(res, 404, "Student not found");
    }

    const record = await StudentAttendance.upsert({
      studentId,
      name: name || student.name,
      centre: centre || student.centre,
      date,
      status,
      dailyAttendancePercentage,
    });

    return ok(res, { message: "Attendance saved", record });
  },
  {
    label: "Upsert Student Attendance Error",
    message: "Failed to save student attendance",
    useErrorMessage: true,
  }
);
