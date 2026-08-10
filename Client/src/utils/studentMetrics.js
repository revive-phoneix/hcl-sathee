export const getInitials = (name = "", fallback = "") => {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return initials || fallback;
};

export const AVATAR_COLORS = ["#1e40af", "#0f766e", "#7c3aed", "#b45309", "#be123c"];

export const parsePercentValue = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = parseFloat(String(value ?? "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseJsonField = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

export const average = (values) => {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const getStudentAttendanceRates = (student) => {
  const rates = [];

  if (Array.isArray(student.attendances)) {
    for (const record of student.attendances) {
      const candidates = [
        record.dailyAttendancePercentage,
        record.weeklyAttendancePercentage,
        record.monthlyAttendancePercentage,
        record.attendancePercentage, // legacy fallback
      ];

      for (const value of candidates) {
        const rate = parsePercentValue(value);
        if (rate != null) rates.push(rate);
      }
    }
  }

  for (const value of Object.values(parseJsonField(student.attendance))) {
    const rate = parsePercentValue(value);
    if (rate != null) rates.push(rate);
  }

  return rates;
};

export const getStudentProgressRates = (student) => {
  const scores = [];

  if (Array.isArray(student.performances)) {
    for (const record of student.performances) {
      const marks = parsePercentValue(record.marks);
      const maxMarks = parsePercentValue(record.maxMarks) || 100;
      if (marks != null && maxMarks > 0) {
        scores.push((marks / maxMarks) * 100);
      }
    }
  }

  // Include test mark subject percentages if available
  if (student.subjectPercentages && typeof student.subjectPercentages === "object") {
    for (const percentage of Object.values(student.subjectPercentages)) {
      const pct = parsePercentValue(percentage);
      if (pct != null) scores.push(pct);
    }
  }

  for (const value of Object.values(parseJsonField(student.marks))) {
    const marks = parsePercentValue(value);
    if (marks != null) {
      scores.push(marks > 100 ? 100 : marks);
    }
  }

  return scores;
};

export const getProgressColor = (progress) => {
  if (progress >= 80) return "#15803D";
  if (progress >= 60) return "#22C55E";
  if (progress >= 40) return "#FACC15";
  if (progress >= 25) return "#F97316";
  return "#EF4444";
};

const EXAM_BATCHES = [
  { key: "JEE", exam: "JEE" },
  { key: "NEET", exam: "NEET" },
  { key: "SSC", exam: "SSC" },
  { key: "CLAT", exam: "CLAT" },
  { key: "IBPS", exam: "IBPS" },
  { key: "ICAR", exam: "ICAR" },
  { key: "CUET", exam: "CUET" },
  { key: "RRB", exam: "RRB" },
];

const normalizeCourseKey = (course = "") => {
  const normalized = String(course)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  if (normalized.includes("JEE")) return "JEE";
  if (normalized.includes("NEET")) return "NEET";
  if (normalized.includes("SSC")) return "SSC";
  if (normalized.includes("CLAT")) return "CLAT";
  if (normalized.includes("IBPS") || normalized.includes("IPBS")) return "IBPS";
  if (normalized.includes("ICAR")) return "ICAR";
  if (normalized.includes("CUET")) return "CUET";
  if (normalized.includes("RRB")) return "RRB";
  return normalized;
};

export const getCourseExamProgress = (students = []) => {
  const byCourse = new Map(EXAM_BATCHES.map((batch) => [batch.key, []]));

  for (const student of students) {
    const key = normalizeCourseKey(student.course);
    if (!byCourse.has(key)) continue;
    byCourse.get(key).push(student);
  }

  return EXAM_BATCHES.map((batch) => {
    const courseStudents = byCourse.get(batch.key) || [];
    if (!courseStudents.length) {
      return {
        exam: batch.exam,
        progress: 0,
        color: "#94A3B8",
        noStudents: true,
        studentCount: 0,
      };
    }

    const scores = courseStudents.flatMap(getStudentProgressRates);
    const progress = average(scores);
    const rounded = progress == null ? 0 : Math.round(progress);

    return {
      exam: batch.exam,
      progress: rounded,
      color: getProgressColor(rounded),
      noStudents: false,
      studentCount: courseStudents.length,
    };
  });
};
