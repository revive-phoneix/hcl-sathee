/**
 * One-time: hash any plain-text passwords currently stored in Firestore users.
 *
 * Usage (from Server/):
 *   node scripts/migrate-hash-passwords.js
 */
require("dotenv").config();
const { initFirebase, getDb } = require("../src/config/firebase");
const { hashPassword, isBcryptHash } = require("../src/Utils/password");

async function migrate() {
  initFirebase();
  const db = getDb();
  const snap = await db.collection("users").get();

  let hashed = 0;
  let skipped = 0;
  let empty = 0;

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const password = data.password;

    if (password == null || password === "") {
      empty += 1;
      continue;
    }

    if (isBcryptHash(String(password))) {
      skipped += 1;
      continue;
    }

    const hashedPassword = await hashPassword(password);
    await doc.ref.update({
      password: hashedPassword,
      updated_at: new Date(),
    });
    hashed += 1;
    console.log(`Hashed password for user ${doc.id} (${data.email || "no email"})`);
  }

  console.log("\nDone.");
  console.log(`  hashed:  ${hashed}`);
  console.log(`  already: ${skipped}`);
  console.log(`  empty:   ${empty}`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
