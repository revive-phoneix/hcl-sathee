const User = require("../Models/User");
const generateToken = require("../Utils/GenerateToken");
const { hashPassword, verifyPassword } = require("../Utils/password");

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
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return fail(res, 400, "Name, email and password are required");
    }

    const user = await findUserOrFail(res, email);
    if (!user) return;

    if (user.name?.trim() !== name.trim()) {
      return fail(res, 400, "Name does not match the invited account");
    }
    if (user.password) {
      return fail(res, 400, "Password already set for this account");
    }

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
    if (String(password).length < 6) {
      return fail(res, 400, "Password must be at least 6 characters long");
    }

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
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return fail(res, 401, "Invalid credentials");

    const { valid, needsRehash } = await verifyPassword(password, user.password);
    if (!valid) return fail(res, 401, "Invalid email or password");

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
