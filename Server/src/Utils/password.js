const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;
const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);

const hashPassword = (plainPassword) =>
  bcrypt.hash(String(plainPassword), SALT_ROUNDS);

const verifyPassword = async (plainPassword, storedPassword) => {
  const stored = storedPassword == null ? "" : String(storedPassword);
  if (!stored) return { valid: false, needsRehash: false };
  if (isBcryptHash(stored)) {
    return {
      valid: await bcrypt.compare(String(plainPassword), stored),
      needsRehash: false,
    };
  }
  return { valid: false, needsRehash: false };
};

const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

const validatePasswordPolicy = (plainPassword) => {
  const password = String(plainPassword || "");
  if (password.length < 8) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  return { valid: true, message: "" };
};

module.exports = {
  hashPassword,
  verifyPassword,
  isBcryptHash,
  validatePasswordPolicy,
  PASSWORD_POLICY_MESSAGE,
};
