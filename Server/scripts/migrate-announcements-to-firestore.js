/**
 * One-time: copy Announcements rows from MySQL into Firestore `announcements`.
 * Usage: node scripts/migrate-announcements-to-firestore.js
 */
require("dotenv").config();
const mysql = require("mysql2/promise");
const { initFirebase } = require("../src/config/firebase");
const Announcement = require("../src/Models/Announcement");

(async () => {
  initFirebase();

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await conn.execute("SELECT * FROM Announcements ORDER BY id ASC");
  await conn.end();

  if (!rows.length) {
    console.log("No announcements found in MySQL.");
    process.exit(0);
  }

  for (const row of rows) {
    await Announcement.importFromMysql(row);
    console.log(`Migrated announcement ${row.id}: ${row.title}`);
  }

  console.log(`Done. Migrated ${rows.length} announcement(s) to Firestore.`);
  process.exit(0);
})().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
