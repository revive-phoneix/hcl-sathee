/**
 * One-time: copy Students rows from MySQL into Firestore `students`.
 * Usage: node scripts/migrate-students-to-firestore.js
 */
require("dotenv").config();
const mysql = require("mysql2/promise");
const { initFirebase } = require("../src/config/firebase");
const Student = require("../src/Models/Student");

(async () => {
  initFirebase();

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await conn.execute("SELECT * FROM Students ORDER BY id ASC");
  await conn.end();

  if (!rows.length) {
    console.log("No students found in MySQL.");
    process.exit(0);
  }

  for (const row of rows) {
    await Student.importFromMysql(row);
    console.log(`Migrated student ${row.id}: ${row.email}`);
  }

  console.log(`Done. Migrated ${rows.length} student(s) to Firestore.`);
  process.exit(0);
})().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
