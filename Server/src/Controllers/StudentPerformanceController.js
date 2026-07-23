const Student = require("../Models/Student");
const SubjectPerformance = require("../Models/SubjectPerformance");
const SubjectAttendance = require("../Models/SubjectAttendance");

const groupByStudentId = (rows) => {
  const map = new Map();
  for (const row of rows) {
    const key = row.studentId;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
};

exports.getStudentsWithPerformance = async (_req, res) => {
  try {
    const students = await Student.findAll();

    const [performances, attendances] = await Promise.all([
      SubjectPerformance.findAll(),
      SubjectAttendance.findAll(),
    ]);

    const performancesByStudent = groupByStudentId(performances);
    const attendancesByStudent = groupByStudentId(attendances);

    const studentsWithDetails = students.map((student) => ({
      ...student,
      performances: performancesByStudent.get(student.id) || [],
      attendances: attendancesByStudent.get(student.id) || [],
    }));

    res.status(200).json({ success: true, students: studentsWithDetails });
  } catch (error) {
    console.error("Get Students with Performance Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch performance details",
    });
  }
};

exports.addSubjectPerformance = async (req, res) => {
  try {
    const { studentId, subject, marks, maxMarks, grade, remarks } = req.body;

    if (!studentId || !subject || marks === undefined) {
      return res.status(400).json({
        success: false,
        message: "Student ID, subject, and marks are required",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const performance = await SubjectPerformance.create({
      studentId: student.id,
      subject,
      marks,
      maxMarks: maxMarks || 100,
      grade: grade || null,
      remarks: remarks || null,
    });

    res.status(201).json({ success: true, performance });
  } catch (error) {
    console.error("Add Subject Performance Error:", error);
    res.status(500).json({ success: false, message: "Failed to add performance record" });
  }
};

exports.addSubjectAttendance = async (req, res) => {
  try {
    const {
      studentId,
      subject,
      dailyAttendancePercentage,
      weeklyAttendancePercentage,
      monthlyAttendancePercentage,
      attendancePercentage,
      totalClasses,
      classesAttended,
    } = req.body;

    if (!studentId || !subject) {
      return res.status(400).json({
        success: false,
        message: "Student ID and subject are required",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const daily = dailyAttendancePercentage ?? attendancePercentage ?? 0;
    const weekly = weeklyAttendancePercentage ?? attendancePercentage ?? 0;
    const monthly = monthlyAttendancePercentage ?? attendancePercentage ?? 0;

    const attendance = await SubjectAttendance.create({
      studentId: student.id,
      subject,
      dailyAttendancePercentage: daily,
      weeklyAttendancePercentage: weekly,
      monthlyAttendancePercentage: monthly,
      totalClasses: totalClasses || 0,
      classesAttended: classesAttended || 0,
    });

    res.status(201).json({ success: true, attendance });
  } catch (error) {
    console.error("Add Subject Attendance Error:", error);
    res.status(500).json({ success: false, message: "Failed to add attendance record" });
  }
};
