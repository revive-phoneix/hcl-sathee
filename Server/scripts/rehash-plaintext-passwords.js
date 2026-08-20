/**
 * One-time migration: hash user passwords that are stored as plaintext.
 * Usage: node scripts/rehash-plaintext-passwords.js
 */
require("dotenv").config();
const { initFirebase } = require("../src/config/firebase");
const User = require("../src/Models/User");
const { hashPassword, isBcryptHash } = require("../src/Utils/password");

(async () => {
  initFirebase();
  let cursor;
  let migrated = 0;

  do {
    const users = await User.findAll({ limit: 200, cursor });
    for (const user of users) {
      if (user.password && !isBcryptHash(user.password)) {
        await User.update(user.id, { password: await hashPassword(user.password) });
        migrated += 1;
      }
    }
    cursor = users.nextCursor;
  } while (cursor);

  console.log(`Done. Rehashed ${migrated} plaintext password(s).`);
})().catch((err) => {
  console.error("Password migration failed:", err);
  process.exit(1);
});