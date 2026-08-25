const jwt = require("jsonwebtoken");

/**
 * Generate a short-lived password reset token
 * Expires in 10 minutes; purpose is always "password-reset"
 */
const generateResetToken = ({ id, email }) =>
  jwt.sign({ id, email, purpose: "password-reset" }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });

/**
 * Verify a password reset token
 * Throws on invalid/expired/wrong purpose
 */
const verifyResetToken = (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.purpose !== "password-reset") {
    throw new Error("Invalid token");
  }
  return payload;
};

module.exports = { generateResetToken, verifyResetToken };
