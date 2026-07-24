const Student = require("../Models/Student");
const { filterByUserCentre } = require("../Utils/centreMatch");

exports.getStudents = async (req, res) => {
  try {
    const students = filterByUserCentre(await Student.findAll(), req.user);
    res.status(200).json({ success: true, students });
  } catch (error) {
    console.error("Get Students Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
};

exports.addStudent = async (req, res) => {
  try {
    const {
      studentId,
      enrollmentNo,
      name,
      gender,
      email,
      phone,
      centre,
      course,
      category,
      address,
      parents,
      marks,
      attendance,
      qualifications,
      avatarColor,
      initials,
    } = req.body;

    if (!name || !gender || !email) {
      return res.status(400).json({
        success: false,
        message: "Name, gender, and email are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingStudent = await Student.findByEmail(normalizedEmail);
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "A student with this email already exists",
      });
    }

    const studentIdValue = studentId?.trim() || `STU${Date.now().toString().slice(-6)}`;
    const enrollmentNoValue = enrollmentNo?.trim() || `ENR${Date.now().toString().slice(-6)}`;

    const student = await Student.create({
      studentId: studentIdValue,
      enrollmentNo: enrollmentNoValue,
      name: name.trim(),
      gender: gender.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      centre: centre?.trim() || null,
      course: course?.trim() || null,
      category: category?.trim() || null,
      address: address || null,
      parents: parents || {},
      marks: marks || {},
      attendance: attendance || {},
      qualifications: qualifications || {},
      avatarColor: avatarColor || null,
      initials: initials || null,
    });

    res.status(201).json({ success: true, student });
  } catch (error) {
    console.error("Add Student Error:", error);
    res.status(500).json({ success: false, message: "Failed to add student" });
  }
};
