/**
 * Seed 50 dummy students aligned to today's Rajasthan timetable courses:
 * RRB, SSC, IBPS, CUET (Geography + Entrepreneurship).
 *
 * Distribution: 20 HCL RAJASTHAN, 15 HCL JHARKHAND, 15 HCL MADHYA PRADESH
 *
 * Usage: node scripts/seed-dummy-students.js
 *
 * Writes docs with sequential IDs (no full-collection scans) and throttles
 * to avoid Firestore free-tier quota exhaustion.
 */
require("dotenv").config();

const { initFirebase, getDb } = require("../src/config/firebase");
const { resolveSubjectsForCourse } = require("../src/Utils/courseSubjects");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CENTRES = [
  { centre: "HCL RAJASTHAN", count: 20 },
  { centre: "HCL JHARKHAND", count: 15 },
  { centre: "HCL MADHYA PRADESH", count: 15 },
];

const COURSE_PLAN = ["RRB", "SSC", "IBPS", "CUET"];

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
  "Ishaan", "Shaurya", "Ananya", "Aadhya", "Diya", "Myra", "Anika", "Sara",
  "Ira", "Navya", "Kiara", "Pari", "Rohan", "Kabir", "Yash", "Dev", "Om",
  "Neha", "Priya", "Kavya", "Meera", "Tanvi", "Harsh", "Nikhil", "Rahul",
  "Aman", "Sneha", "Pooja", "Ritika", "Manav", "Ishita", "Aisha", "Ved",
  "Atharv", "Dhruv", "Laksh", "Rudra", "Anvi", "Siya", "Aarohi", "Trisha", "Nisha",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Singh", "Gupta", "Mehta", "Joshi", "Khan",
  "Reddy", "Nair", "Iyer", "Das", "Chopra", "Malhotra", "Bansal", "Yadav",
  "Mishra", "Pandey", "Choudhary", "Kapoor",
];

const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"];
const AVATAR_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

const zeroMaps = (subjects) => {
  const marks = {};
  const attendance = {};
  for (const subject of subjects) {
    marks[subject] = 0;
    attendance[subject] = 0;
  }
  return { marks, attendance };
};

const subjectsForCourse = (course) => {
  if (course === "CUET") {
    return resolveSubjectsForCourse(course, [
      "Language",
      "General Test",
      "Geography",
      "Entrepreneurship",
    ]);
  }
  return resolveSubjectsForCourse(course, null, null, null);
};

const pickName = (index) => {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[index % LAST_NAMES.length];
  return `${first} ${last}`;
};

const initialsOf = (name) =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "ST";

const withRetry = async (label, fn, attempts = 8) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      const quota = /RESOURCE_EXHAUSTED|Quota exceeded/i.test(
        String(error.message || error)
      );
      console.log(`retry ${label} (${attempt}/${attempts}): ${error.message}`);
      if (attempt === attempts) throw error;
      await sleep((quota ? 5000 : 1000) * attempt);
    }
  }
  return null;
};

const buildRoster = () => {
  const roster = [];
  let globalIndex = 0;

  for (const { centre, count } of CENTRES) {
    for (let i = 0; i < count; i += 1) {
      const course = COURSE_PLAN[i % COURSE_PLAN.length];
      const name = pickName(globalIndex);
      const gender = globalIndex % 3 === 0 ? "Female" : "Male";
      const pad = String(globalIndex + 1).padStart(3, "0");
      roster.push({
        centre,
        course,
        name,
        gender,
        studentId: `DUM${pad}`,
        enrollmentNo: `ENR-DUM${pad}`,
        email: `dummy.student.${pad}@hclsathee.test`,
        phone: `9${String(700000000 + globalIndex).slice(-9)}`,
        category: CATEGORIES[globalIndex % CATEGORIES.length],
        address: `${centre.replace("HCL ", "")} Centre Area`,
        avatarColor: AVATAR_COLORS[globalIndex % AVATAR_COLORS.length],
        initials: initialsOf(name),
        parents: {
          father: `Father of ${name.split(" ")[0]}`,
          fatherPhone: `8${String(700000000 + globalIndex).slice(-9)}`,
          mother: `Mother of ${name.split(" ")[0]}`,
          motherPhone: `7${String(700000000 + globalIndex).slice(-9)}`,
        },
      });
      globalIndex += 1;
    }
  }

  return roster;
};

async function main() {
  initFirebase();
  const db = getDb();

  const Timetable = require("../src/Models/Timetable");
  const tt = await withRetry("timetable", () =>
    Timetable.findByCentreKey("HCL RAJASTHAN")
  );
  if (tt?.kind === "grid") {
    const fri = (tt.days || []).findIndex((d) =>
      String(d).toLowerCase().startsWith("fri")
    );
    console.log("\nFriday timetable (Rajasthan):");
    for (const slot of tt.slots || []) {
      console.log(`  ${slot.time}  ${(slot.cells || [])[fri] || "—"}`);
    }
  }

  const roster = buildRoster();
  console.log(`\nSeeding up to ${roster.length} dummy students...\n`);

  let nextStudentId = 80000 + (Date.now() % 10000);
  let nextSubjectId = Date.now();
  let created = 0;
  let skipped = 0;
  const byCentre = {};
  const byCourse = {};

  for (const row of roster) {
    const existingSnap = await withRetry(`lookup ${row.email}`, () =>
      db.collection("students").where("email", "==", row.email).limit(1).get()
    );
    if (!existingSnap.empty) {
      skipped += 1;
      console.log(`skip  ${row.email}`);
      continue;
    }

    const resolved = subjectsForCourse(row.course);
    if (!resolved.ok) {
      console.error(`fail  ${row.name}: ${resolved.message}`);
      continue;
    }

    const maps = zeroMaps(resolved.subjects);
    const id = nextStudentId;
    nextStudentId += 1;
    const now = new Date();
    const payload = {
      id,
      studentId: row.studentId,
      enrollmentNo: row.enrollmentNo,
      name: row.name,
      gender: row.gender,
      email: row.email,
      phone: row.phone,
      centre: row.centre,
      course: row.course,
      category: row.category,
      address: row.address,
      parents: row.parents,
      subjects: resolved.subjects,
      marks: maps.marks,
      attendance: maps.attendance,
      qualifications: {},
      avatarColor: row.avatarColor,
      initials: row.initials,
      created_at: now,
      updated_at: now,
    };

    await withRetry(`student ${row.studentId}`, () =>
      db.collection("students").doc(String(id)).set(payload)
    );

    for (const subject of resolved.subjects) {
      const perfId = (nextSubjectId += 1);
      const attId = (nextSubjectId += 1);
      const t = new Date();
      await withRetry(`perf ${row.studentId}/${subject}`, () =>
        db.collection("subjectPerformances").doc(String(perfId)).set({
          id: perfId,
          studentId: id,
          subject,
          marks: 0,
          maxMarks: 100,
          grade: null,
          remarks: null,
          created_at: t,
          updated_at: t,
        })
      );
      await sleep(150);
      await withRetry(`att ${row.studentId}/${subject}`, () =>
        db.collection("subjectAttendances").doc(String(attId)).set({
          id: attId,
          studentId: id,
          subject,
          dailyAttendancePercentage: 0,
          weeklyAttendancePercentage: 0,
          monthlyAttendancePercentage: 0,
          totalClasses: 0,
          classesAttended: 0,
          percentage: 0,
          created_at: t,
          updated_at: t,
        })
      );
      await sleep(150);
    }

    created += 1;
    byCentre[row.centre] = (byCentre[row.centre] || 0) + 1;
    byCourse[row.course] = (byCourse[row.course] || 0) + 1;
    console.log(
      `ok    ${row.studentId}  ${row.name.padEnd(18)}  ${row.centre.padEnd(22)}  ${row.course}`
    );
    await sleep(400);
  }

  console.log("\nDone.");
  console.log({ created, skipped, byCentre, byCourse });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
