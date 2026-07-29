const User = require("../Models/User");
const { sendWelcomeEmail } = require("../Utils/sendEmail");
const { createPasswordLink } = require("../Utils/createPasswordLink");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const {
  VALID_CENTRES,
  filterByUserCentre,
  isAdminRole,
  isHclPartnerRole,
} = require("../Utils/centreMatch");

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
  return safe;
};

exports.getUsers = wrap(
  async (req, res) => {
    let users = await User.findAll();

    if (isHclPartnerRole(req.user?.role)) {
      users = filterByUserCentre(users, req.user).filter((user) =>
        isMitra(user.role)
      );
    } else if (!isAdminRole(req.user?.role)) {
      users = [];
    }

    return ok(res, { users: users.map(toPublicUser) });
  },
  { label: "Get Users Error", message: "Failed to fetch users" }
);

exports.addUser = wrap(
  async (req, res) => {
    const { name, email, phone, role, centre, availableDays, isVishist } =
      req.body;

    if (!name || !email || !phone || !role) {
      return fail(res, 400, "Name, email, phone number and role are required");
    }
    if (!VALID_ROLES.includes(role)) {
      return fail(res, 400, "Invalid role selected");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCentre = centre?.trim() || null;
    const normalizedDays = User.normalizeAvailableDays(availableDays);

    if (!normalizedCentre) {
      return fail(res, 400, "Centre is required");
    }
    if (!VALID_CENTRES.includes(normalizedCentre)) {
      return fail(res, 400, "Invalid centre selected");
    }
    if (await User.findByEmail(normalizedEmail)) {
      return fail(res, 409, "Email already exists");
    }
    if (await User.findByPhone(phone.trim())) {
      return fail(res, 409, "Phone number already exists");
    }

    const createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      role,
      centre: normalizedCentre,
      availableDays: isMitra(role) ? normalizedDays : [],
      ...(isMitra(role) ? { isVishist: Boolean(isVishist) } : {}),
      password: null,
    });

    let emailSent = false;
    let emailError = null;
    const passwordSetupLink = createPasswordLink(name.trim(), normalizedEmail);

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

exports.updateUser = wrap(
  async (req, res) => {
    const { availableDays, name, phone, centre, isVishist } = req.body;
    const existing = await User.findById(req.params.id);

    if (!existing) {
      return fail(res, 404, "User not found");
    }

    const patch = {};
    if (name != null) patch.name = String(name).trim();
    if (phone != null) patch.phone = String(phone).trim();
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
