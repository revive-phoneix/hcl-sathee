const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;
const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);

const hashPassword = (plainPassword) =>
  bcrypt.hash(String(plainPassword), SALT_ROUNDS);

/** Supports legacy plain-text passwords and marks them for rehash on login. */
const verifyPassword = async (plainPassword, storedPassword) => {
  const stored = storedPassword == null ? "" : String(storedPassword);
  if (!stored) return { valid: false, needsRehash: false };
  if (isBcryptHash(stored)) {
    return {
      valid: await bcrypt.compare(String(plainPassword), stored),
      needsRehash: false,
    };
  }
  const valid = String(plainPassword) === stored;
  return { valid, needsRehash: valid };
};

module.exports = { hashPassword, verifyPassword, isBcryptHash };
