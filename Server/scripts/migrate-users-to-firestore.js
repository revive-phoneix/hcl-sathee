/**
 * One-time: copy Users rows from MySQL into Firestore `users` collection.
 * Usage: node scripts/migrate-users-to-firestore.js
 */
require("dotenv").config();
const mysql = require("mysql2/promise");
const { initFirebase } = require("../src/config/firebase");
const User = require("../src/Models/User");

(async () => {
  initFirebase();

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await conn.execute("SELECT * FROM Users ORDER BY id ASC");
  await conn.end();

  if (!rows.length) {
    console.log("No users found in MySQL.");
    process.exit(0);
  }

  for (const row of rows) {
    await User.importFromMysql(row);
    console.log(`Migrated user ${row.id}: ${row.email}`);
  }

  console.log(`Done. Migrated ${rows.length} user(s) to Firestore.`);
  process.exit(0);
})().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
