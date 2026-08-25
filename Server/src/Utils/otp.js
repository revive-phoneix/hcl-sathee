const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;
const OTP_SALT_ROUNDS = 10;

/**
 * Generate a cryptographically random 6-digit OTP
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999);
};

/**
 * Hash an OTP using bcrypt (consistent with password hashing)
 */
const hashOtp = async (otp) => {
  return bcrypt.hash(String(otp), OTP_SALT_ROUNDS);
};

/**
 * Verify an OTP against its hash
 */
const verifyOtpHash = async (otp, hash) => {
  if (!hash) return false;
  try {
    return await bcrypt.compare(String(otp), hash);
  } catch {
    return false;
  }
};

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  OTP_TTL_MS,
  MAX_OTP_ATTEMPTS,
};
