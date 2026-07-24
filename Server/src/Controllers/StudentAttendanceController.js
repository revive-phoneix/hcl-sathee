const StudentAttendance = require("../Models/StudentAttendance");
const Student = require("../Models/Student");
const { filterByUserCentre } = require("../Utils/centreMatch");

exports.getStudentAttendance = async (req, res) => {
  try {
    const date = (req.query.date || "").trim();
    const from = (req.query.from || "").trim();
    const to = (req.query.to || "").trim();

    let records;
    if (from && to) {
      records = await StudentAttendance.findByDateRange(from, to);
    } else if (date) {
      records = await StudentAttendance.findByDate(date);
    } else {
      return res.status(400).json({
        success: false,
        message: "Provide date=YYYY-MM-DD or from & to date range",
      });
    }

    records = filterByUserCentre(records, req.user);
    res.status(200).json({ success: true, records });
  } catch (error) {
    console.error("Get Student Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student attendance",
    });
  }
};

exports.upsertStudentAttendance = async (req, res) => {
  try {
    const { studentId, name, centre, date, status, dailyAttendancePercentage } =
      req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "studentId, date and status are required",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const record = await StudentAttendance.upsert({
      studentId,
      name: name || student.name,
      centre: centre || student.centre,
      date,
      status,
      dailyAttendancePercentage,
    });

    res.status(200).json({
      success: true,
      message: "Attendance saved",
      record,
    });
  } catch (error) {
    console.error("Upsert Student Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save student attendance",
    });
  }
};
