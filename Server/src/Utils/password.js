const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);

const hashPassword = async (plainPassword) => {
  return bcrypt.hash(String(plainPassword), SALT_ROUNDS);
};

/**
 * Verify login password. Supports legacy plain-text values in Firestore
 * and upgrades them to bcrypt on successful login.
 */
const verifyPassword = async (plainPassword, storedPassword) => {
  const stored = storedPassword == null ? "" : String(storedPassword);
  if (!stored) {
    return { valid: false, needsRehash: false };
  }

  if (isBcryptHash(stored)) {
    const valid = await bcrypt.compare(String(plainPassword), stored);
    return { valid, needsRehash: false };
  }

  const valid = String(plainPassword) === stored;
  return { valid, needsRehash: valid };
};

module.exports = {
  hashPassword,
  verifyPassword,
  isBcryptHash,
};
