import { WEEKDAYS } from "./availableDays";

const COURSE_HINTS = [
  "JEE",
  "NEET",
  "SSC",
  "CLAT",
  "IBPS",
  "RRB",
  "ICAR",
  "CUET",
  "FOUNDATION",
  "FOUNDATION COURSE",
  "CLASS 11",
  "CLASS 12",
  "CLASS XI",
  "CLASS XII",
  "11TH",
  "12TH",
];

const isBreakLabel = (value) =>
  /^(lunch(\s+break)?|break|recess|free|—|-|–|n\/?a)$/i.test(
    String(value || "").trim()
  );

const looksLikeCourse = (value = "") => {
  const upper = String(value).trim().toUpperCase();
  if (!upper) return false;
  return COURSE_HINTS.some(
    (course) =>
      upper === course ||
      upper.startsWith(`${course} `) ||
      upper.endsWith(` ${course}`) ||
      upper.includes(` ${course} `)
  );
};

const resolveCourseSubject = (left, right) => {
  const a = String(left || "").trim();
  const b = String(right || "").trim();
  const aIsCourse = looksLikeCourse(a);
  const bIsCourse = looksLikeCourse(b);

  if (aIsCourse && !bIsCourse) return { course: a, subject: b };
  if (bIsCourse && !aIsCourse) return { course: b, subject: a };
  if (aIsCourse && bIsCourse) return { course: a, subject: b };
  return { course: a, subject: b };
};

export const weekdayNameFromDate = (date = new Date()) => {
  const names = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return names[date.getDay()] || "Monday";
};

export const parseClassLabel = (raw = "") => {
  const text = String(raw || "").trim().replace(/\s+/g, " ");
  if (!text || isBreakLabel(text)) {
    return { course: null, subject: null, label: text, isBreak: true };
  }

  const paren = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    const resolved = resolveCourseSubject(paren[1], paren[2]);
    return { ...resolved, label: text, isBreak: false };
  }

  for (const sep of [" - ", " – ", " | ", " / ", ":"]) {
    if (text.includes(sep)) {
      const [a, ...rest] = text.split(sep);
      const b = rest.join(sep).trim();
      if (a.trim() && b) {
        const resolved = resolveCourseSubject(a, b);
        return { ...resolved, label: text, isBreak: false };
      }
    }
  }

  const upper = text.toUpperCase();
  for (const hint of COURSE_HINTS) {
    if (upper.startsWith(`${hint} `)) {
      return {
        course: text.slice(0, hint.length).trim(),
        subject: text.slice(hint.length).trim(),
        label: text,
        isBreak: false,
      };
    }
    if (upper.endsWith(` ${hint}`)) {
      return {
        course: hint,
        subject: text.slice(0, text.length - hint.length).trim(),
        label: text,
        isBreak: false,
      };
    }
  }

  return { course: null, subject: text, label: text, isBreak: false };
};

export const getClassesForDay = (timetable, dayName) => {
  const day = WEEKDAYS.includes(dayName) ? dayName : weekdayNameFromDate();
  if (!timetable || timetable.kind !== "grid") {
    return { day, classes: [], unsupported: timetable?.kind === "svg" };
  }

  const days = Array.isArray(timetable.days) ? timetable.days : [];
  const dayIndex = days.findIndex(
    (d) => String(d).toLowerCase() === day.toLowerCase()
  );
  if (dayIndex < 0) {
    return { day, classes: [] };
  }

  const classes = [];
  const slots = Array.isArray(timetable.slots) ? timetable.slots : [];
  for (const slot of slots) {
    const cell = slot?.cells?.[dayIndex];
    const parsed = parseClassLabel(cell);
    if (parsed.isBreak || !parsed.subject) continue;
    classes.push({
      time: slot.time || "",
      course: parsed.course,
      subject: parsed.subject,
      label: parsed.label,
    });
  }

  return { day, classes, unsupported: false };
};

export const getTodaysClasses = (timetable, date = new Date()) =>
  getClassesForDay(timetable, weekdayNameFromDate(date));
