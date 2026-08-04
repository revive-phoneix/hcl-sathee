const User = require("../Models/User");
const generateToken = require("../Utils/GenerateToken");
const { verifyInviteToken } = require("../Utils/inviteToken");
const {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
} = require("../Utils/password");

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const ok = (res, payload) => res.status(200).json({ success: true, ...payload });

const serverError = (res, err) => {
  console.error(err);
  return fail(res, 500, "Server Error");
};

const findUserOrFail = async (res, email) => {
  const user = await User.findByEmail(email);
  if (!user) {
    fail(res, 404, "User not found");
    return null;
  }
  return user;
};

exports.createPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return fail(res, 400, "Token and password are required");
    }

    let payload;
    try {
      payload = verifyInviteToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return fail(res, 400, "This invite link has expired. Please ask an admin to resend it.");
      }
      return fail(res, 400, "This invite link is invalid.");
    }

    const user = await findUserOrFail(res, payload.email);
    if (!user) return;
    if (user.name?.trim() !== payload.name?.trim()) {
      return fail(res, 400, "Name does not match the invited account");
    }
    if (user.password) {
      return fail(res, 400, "Password already set for this account");
    }

    const policy = validatePasswordPolicy(password);
    if (!policy.valid) return fail(res, 400, policy.message);

    await User.update(user.id, { password: await hashPassword(password) });
    return ok(res, { message: "Password created successfully" });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.forgotPasswordLookup = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return fail(res, 400, "Email is required");

    const user = await User.findByEmail(email);
    if (!user) return fail(res, 404, "No account found for this email");

    return ok(res, {
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.forgotPasswordReset = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password) {
      return fail(res, 400, "Name, email, role and new password are required");
    }
    const policy = validatePasswordPolicy(password);
    if (!policy.valid) return fail(res, 400, policy.message);

    const user = await findUserOrFail(res, email);
    if (!user) return;

    if (user.name?.trim() !== String(name).trim()) {
      return fail(res, 400, "Name does not match this account");
    }
    if (
      String(user.role || "").trim().toUpperCase() !==
      String(role).trim().toUpperCase()
    ) {
      return fail(res, 400, "Role does not match this account");
    }

    await User.update(user.id, { password: await hashPassword(password) });
    return ok(res, { message: "Password updated successfully" });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.login = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return fail(res, 400, "Name, email and password are required");
    }

    const user = await User.findByEmail(email);
    if (!user) return fail(res, 401, "Invalid credentials");

    if (user.name?.trim() !== name) {
      return fail(res, 401, "Invalid credentials");
    }

    const { valid, needsRehash } = await verifyPassword(password, user.password);
    if (!valid) return fail(res, 401, "Invalid credentials");

    if (needsRehash) {
      await User.update(user.id, { password: await hashPassword(password) });
    }

    return ok(res, {
      message: "Login Successful",
      token: generateToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        centre: user.centre,
      },
    });
  } catch (err) {
    return serverError(res, err);
  }
};
