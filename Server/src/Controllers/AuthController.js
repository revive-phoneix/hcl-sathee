const User = require("../Models/User");
const generateToken = require("../Utils/GenerateToken");
const { verifyInviteToken } = require("../Utils/inviteToken");
const { generateResetToken, verifyResetToken } = require("../Utils/resetToken");
const { generateOtp, hashOtp, verifyOtpHash, OTP_TTL_MS, MAX_OTP_ATTEMPTS } = require("../Utils/otp");
const { sendPasswordResetOtpEmail } = require("../Utils/sendEmail");
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

/**
 * Step 1: Request OTP for password reset
 * Returns generic response regardless of account existence
 */
exports.requestPasswordResetOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return fail(res, 400, "Email is required");

    const user = await User.findByEmail(email);

    // Always return the same generic message to prevent email enumeration
    const genericResponse = "If an account exists for this email, a verification code has been sent.";

    if (!user) {
      // Log this for monitoring but don't tell the client
      return ok(res, { message: genericResponse });
    }

    // Generate and hash OTP
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Store OTP in user document
    await User.setPasswordResetOtp(user.id, { otpHash, expiresAt });

    // Send OTP via email (fail gracefully if email not configured)
    try {
      await sendPasswordResetOtpEmail(email, user.name, otp);
    } catch (emailError) {
      console.error("Failed to send password reset OTP email:", emailError);
      // Still return success to the client; the OTP is stored server-side anyway
      // User can try to verify even if email fails (for testing) or retry request
    }

    return ok(res, { message: genericResponse });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * Step 2: Verify OTP and return reset token
 * Returns generic 400 for any failure (user not found, wrong OTP, expired, max attempts)
 */
exports.verifyPasswordResetOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return fail(res, 400, "Email and OTP are required");
    }

    const genericError = "Invalid or expired code";

    const user = await User.findByEmail(email);
    if (!user) {
      return fail(res, 400, genericError);
    }

    const otpData = await User.getPasswordResetOtp(user.id);
    if (!otpData.otpHash || !otpData.otpExpiresAt) {
      return fail(res, 400, genericError);
    }

    // Check if expired
    if (new Date() > new Date(otpData.otpExpiresAt)) {
      await User.clearPasswordResetOtp(user.id);
      return fail(res, 400, genericError);
    }

    // Check attempt limit
    if (otpData.otpAttempts >= MAX_OTP_ATTEMPTS) {
      await User.clearPasswordResetOtp(user.id);
      return fail(res, 400, genericError);
    }

    // Verify OTP
    const otpValid = await verifyOtpHash(otp, otpData.otpHash);
    if (!otpValid) {
      // Increment failed attempts
      const newAttempts = await User.incrementOtpAttempts(user.id);
      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        // Lock out: clear OTP so they must request a new one
        await User.clearPasswordResetOtp(user.id);
      }
      return fail(res, 400, genericError);
    }

    // OTP is valid! Clear it (single-use) and issue reset token
    await User.clearPasswordResetOtp(user.id);
    const resetToken = generateResetToken({ id: user.id, email: user.email });

    return ok(res, { resetToken });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * Step 3: Reset password using reset token
 * Requires valid reset token (not user-supplied name/role)
 */
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
      return fail(res, 400, "Reset token and new password are required");
    }

    const genericError = "Invalid or expired reset link";

    // Verify reset token
    let payload;
    try {
      payload = verifyResetToken(resetToken);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return fail(res, 400, "This password reset link has expired. Please request a new one.");
      }
      return fail(res, 400, genericError);
    }

    // Find user by ID from token (not from request body)
    const user = await User.findById(payload.id);
    if (!user || user.email !== payload.email) {
      return fail(res, 400, genericError);
    }

    // Validate password policy
    const policy = validatePasswordPolicy(password);
    if (!policy.valid) return fail(res, 400, policy.message);

    // Update password and clear any lingering OTP state
    await User.update(user.id, { password: await hashPassword(password) });
    await User.clearPasswordResetOtp(user.id);

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
