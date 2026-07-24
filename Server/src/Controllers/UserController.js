const User = require("../Models/User");
const { sendWelcomeEmail } = require("../Utils/sendEmail");
const {
  filterByUserCentre,
  isAdminRole,
  isHclPartnerRole,
} = require("../Utils/centreMatch");

const VALID_ROLES = ["ADMIN", "SATHEE MITRA", "HCL PARTNER"];
const VALID_CENTRES = [
  "HCL RAJASTHAN",
  "HCL RAJATHAN",
  "HCL JHARKHAND",
  "HCL MADHYA PRADESH",
];
const TEST_EMAIL_DOMAIN = "@example.com";

const toPublicUser = (user) => {
  if (!user) return user;
  const { password, ...safe } = user;
  return safe;
};

exports.getUsers = async (req, res) => {
  try {
    let users = await User.findAll();

    // Partners only see Sathee Mitra in their own centre (for view/export).
    if (isHclPartnerRole(req.user?.role)) {
      users = filterByUserCentre(users, req.user).filter(
        (user) => String(user.role || "").toUpperCase() === "SATHEE MITRA"
      );
    } else if (!isAdminRole(req.user?.role)) {
      users = [];
    }

    res.status(200).json({
      success: true,
      users: users.map(toPublicUser),
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

exports.addUser = async (req, res) => {
  try {
    const { name, email, phone, role, centre } = req.body;

    if (!name || !email || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone number and role are required",
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCentre = centre?.trim() || null;

    if (!normalizedCentre) {
      return res.status(400).json({
        success: false,
        message: "Centre is required",
      });
    }

    if (!VALID_CENTRES.includes(normalizedCentre)) {
      return res.status(400).json({
        success: false,
        message: "Invalid centre selected",
      });
    }

    const existingUser = await User.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const existingPhone = await User.findByPhone(phone.trim());
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    const createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      role,
      centre: normalizedCentre,
      password: null,
    });

    if (!normalizedEmail.endsWith(TEST_EMAIL_DOMAIN)) {
      try {
        await sendWelcomeEmail(normalizedEmail, name.trim(), role);
      } catch (emailError) {
        console.error("Welcome email failed:", emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: toPublicUser(createdUser),
    });
  } catch (error) {
    console.error("Add User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};
