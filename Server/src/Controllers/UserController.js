const User = require("../Models/User");
const { sendWelcomeEmail } = require("../Utils/sendEmail");
const { createPasswordLink } = require("../Utils/createPasswordLink");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const {
  VALID_CENTRES,
  filterByUserCentre,
  matchesCentre,
  isAdminRole,
  isHclPartnerRole,
  isSatheeMitraRole,
} = require("../Utils/centreMatch");
const { isValidPhone10, normalizePhone10 } = require("../Utils/phone");

const VALID_ROLES = ["ADMIN", "SATHEE MITRA", "HCL PARTNER"];
const TEST_EMAIL_DOMAIN = "@example.com";
const isMitra = (role) => String(role).toUpperCase() === "SATHEE MITRA";

const formatEmailError = (err) => {
  const oauthError =
    err?.response?.data?.error_description ||
    err?.response?.data?.error?.message ||
    (typeof err?.response?.data?.error === "string" ? err.response.data.error : null);

  const raw = oauthError || err?.message || "Failed to send welcome email";
  if (String(raw).toLowerCase().includes("invalid_grant")) {
    return "Gmail authorization expired (invalid_grant). Update EMAIL_REFRESH_TOKEN on the server.";
  }
  return raw;
};
const toPublicUser = (user) => {
  if (!user) return user;
  const { password, ...safe } = user;
  return { ...safe, hasPassword: Boolean(password) };
};

exports.getUsers = wrap(
  async (req, res) => {
    const usersPage = await User.findAll({
      limit: req.query.limit,
      cursor: req.query.cursor,
    });
    let users = usersPage;

    if (isAdminRole(req.user?.role)) {
      users = users;
    } else if (isHclPartnerRole(req.user?.role) || isSatheeMitraRole(req.user?.role)) {
      users = filterByUserCentre(users, req.user).filter((user) =>
        isMitra(user.role)
      );
    } else {
      users = [];
    }

    return ok(res, { users: users.map(toPublicUser), nextCursor: usersPage.nextCursor });
  },
  { label: "Get Users Error", message: "Failed to fetch users" }
);

exports.getAdminUsers = wrap(
  async (req, res) => {
    const usersPage = await User.findAll({
      limit: req.query.limit,
      cursor: req.query.cursor,
    });
    const users = usersPage;
    const admins = users.filter((user) => isAdminRole(user.role));
    return ok(res, { users: admins.map(toPublicUser), nextCursor: usersPage.nextCursor });
  },
  { label: "Get Admin Users Error", message: "Failed to fetch admin users" }
);

exports.getMe = wrap(
  async (req, res) => {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return fail(res, 404, "User not found");
    }
    return ok(res, { user: toPublicUser(user) });
  },
  { label: "Get Me Error", message: "Failed to fetch current user" }
);

exports.getVishistMentors = wrap(
  async (req, res) => {
    const allUsers = await User.findAll();
    const isAdmin = isAdminRole(req.user?.role);
    const centre = isAdmin ? req.query.centre || null : req.user?.centre;

    let mentors = allUsers.filter(
      (u) => isSatheeMitraRole(u.role) && Boolean(u.isVishist)
    );
    if (centre) {
      mentors = mentors.filter((u) => matchesCentre(u.centre, centre));
    }

    return ok(res, {
      mentors: mentors.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        centre: u.centre,
        availableDays: u.availableDays || [],
      })),
    });
  },
  { label: "Get Vishist Mentors Error", message: "Failed to fetch Vishist mentors" }
);

exports.saveFcmToken = wrap(
  async (req, res) => {
    const token = String(req.body?.token || "").trim();
    if (!token) return fail(res, 400, "Token is required");
    await User.addFcmToken(req.user?.id, token);
    return ok(res, { message: "Device registered for notifications" });
  },
  { label: "Save FCM Token Error", message: "Failed to save device token" }
);

exports.addUser = wrap(
  async (req, res) => {
    const { name, email, phone, role, centre, availableDays, isVishist } =
      req.body;

    if (!name || !email || !phone || !role) {
      return fail(res, 400, "Name, email, phone number and role are required");
    }
    if (!isValidPhone10(phone)) {
      return fail(res, 400, "Phone number must be exactly 10 digits");
    }
    if (!VALID_ROLES.includes(role)) {
      return fail(res, 400, "Invalid role selected");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone10(phone);
    const normalizedCentre = centre?.trim() || null;
    const normalizedDays = User.normalizeAvailableDays(availableDays);

    if (!normalizedCentre) {
      return fail(res, 400, "Centre is required");
    }
    if (!VALID_CENTRES.includes(normalizedCentre)) {
      return fail(res, 400, "Invalid centre selected");
    }
    let createdUser;
    try {
      createdUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        role,
        centre: normalizedCentre,
        availableDays: isMitra(role) ? normalizedDays : [],
        ...(isMitra(role) ? { isVishist: Boolean(isVishist) } : {}),
        password: null,
      });
    } catch (error) {
      if (error.code === "DUPLICATE_EMAIL" || error.code === "DUPLICATE_PHONE") {
        return fail(res, 409, error.message);
      }
      throw error;
    }

    let emailSent = false;
    let emailError = null;
    const passwordSetupLink = createPasswordLink(name.trim(), normalizedEmail, role);

    if (normalizedEmail.endsWith(TEST_EMAIL_DOMAIN)) {
      emailError = "Skipped welcome email for @example.com addresses";
    } else {
      try {
        await sendWelcomeEmail(normalizedEmail, name.trim(), role);
        emailSent = true;
      } catch (err) {
        emailError = formatEmailError(err);
        console.error("Welcome email failed:", emailError, err);
      }
    }

    return ok(res, 201, {
      message: emailSent
        ? "User created successfully. Welcome email sent."
        : "User created successfully, but welcome email could not be sent.",
      emailSent,
      emailError,
      passwordSetupLink: emailSent ? null : passwordSetupLink,
      user: toPublicUser(createdUser),
    });
  },
  { label: "Add User Error", message: "Failed to create user" }
);
exports.resendInvite = wrap(
  async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, "User not found");
    if (user.password) {
      return fail(res, 400, "This user has already set their password");
    }

    const passwordSetupLink = createPasswordLink(user.name, user.email, user.role);

    if (user.email.endsWith(TEST_EMAIL_DOMAIN)) {
      return ok(res, {
        message: "Skipped resend for @example.com address",
        emailSent: false,
        passwordSetupLink,
      });
    }

    try {
      await sendWelcomeEmail(user.email, user.name, user.role);
      return ok(res, { message: "Invite resent successfully", emailSent: true });
    } catch (err) {
      const emailError = formatEmailError(err);
      console.error("Resend invite failed:", emailError, err);
      return fail(res, 502, emailError);
    }
  },
  { label: "Resend Invite Error", message: "Failed to resend invite" }
);

exports.updateCurrentUser = wrap(
  async (req, res) => {
    const { name, email, phone } = req.body;
    const current = await User.findById(req.user?.id);

    if (!current) {
      return fail(res, 404, "User not found");
    }

    const patch = {};

    if (name != null) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return fail(res, 400, "Name is required");
      }
      patch.name = trimmedName;
    }

    if (email != null) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return fail(res, 400, "Please enter a valid email address");
      }

      if (normalizedEmail !== current.email) {
        const existing = await User.findByEmail(normalizedEmail);
        if (existing && String(existing.id) !== String(req.user.id)) {
          return fail(res, 409, "Email already exists");
        }
      }
      patch.email = normalizedEmail;
    }

    if (phone != null) {
      const normalizedPhone = normalizePhone10(phone);
      if (!isValidPhone10(phone)) {
        return fail(res, 400, "Phone number must be exactly 10 digits");
      }

      if (normalizedPhone !== current.phone) {
        const existing = await User.findByPhone(normalizedPhone);
        if (existing && String(existing.id) !== String(req.user.id)) {
          return fail(res, 409, "Phone number already exists");
        }
      }
      patch.phone = normalizedPhone;
    }

    if (!Object.keys(patch).length) {
      return fail(res, 400, "No valid fields to update");
    }

    const updated = await User.update(req.user.id, patch);
    return ok(res, {
      message: "Profile updated successfully",
      user: toPublicUser(updated),
    });
  },
  { label: "Update Current User Error", message: "Failed to update profile" }
);

exports.updateUser = wrap(
  async (req, res) => {
    const { availableDays, name, phone, centre, isVishist } = req.body;
    const existing = await User.findById(req.params.id);

    if (!existing) {
      return fail(res, 404, "User not found");
    }

    const patch = {};
    if (name != null) patch.name = String(name).trim();
    if (phone != null) {
      if (!isValidPhone10(phone)) {
        return fail(res, 400, "Phone number must be exactly 10 digits");
      }
      patch.phone = normalizePhone10(phone);
    }
    if (centre != null) {
      const normalizedCentre = String(centre).trim();
      if (!VALID_CENTRES.includes(normalizedCentre)) {
        return fail(res, 400, "Invalid centre selected");
      }
      patch.centre = normalizedCentre;
    }
    if (availableDays != null) {
      patch.availableDays = User.normalizeAvailableDays(availableDays);
    }
    if (isVishist != null) {
      if (isMitra(existing.role)) {
        patch.isVishist = User.normalizeIsVishist(existing.role, isVishist);
      }
      // Non-Mitra: never store isVishist
    }
    if (!Object.keys(patch).length) {
      return fail(res, 400, "No valid fields to update");
    }

    const updated = await User.update(req.params.id, patch);
    return ok(res, {
      message: "User updated successfully",
      user: toPublicUser(updated),
    });
  },
  { label: "Update User Error", message: "Failed to update user" }
);

exports.deleteUser = wrap(
  async (req, res) => {
    if (!(await User.destroy(req.params.id))) {
      return fail(res, 404, "User not found");
    }
    return ok(res, { message: "User deleted successfully" });
  },
  { label: "Delete User Error", message: "Failed to delete user" }
);
