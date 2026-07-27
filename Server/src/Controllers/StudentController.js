const Student = require("../Models/Student");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { filterByUserCentre } = require("../Utils/centreMatch");

exports.getStudents = wrap(
  async (req, res) => {
    const students = filterByUserCentre(await Student.findAll(), req.user);
    return ok(res, { students });
  },
  { label: "Get Students Error", message: "Failed to fetch students" }
);

exports.addStudent = wrap(
  async (req, res) => {
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
      return fail(res, 400, "Name, gender, and email are required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await Student.findByEmail(normalizedEmail)) {
      return fail(res, 409, "A student with this email already exists");
    }

    const suffix = Date.now().toString().slice(-6);
    const student = await Student.create({
      studentId: studentId?.trim() || `STU${suffix}`,
      enrollmentNo: enrollmentNo?.trim() || `ENR${suffix}`,
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

    return ok(res, 201, { student });
  },
  { label: "Add Student Error", message: "Failed to add student" }
);
