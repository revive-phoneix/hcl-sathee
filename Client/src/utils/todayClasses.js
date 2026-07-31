import { WEEKDAYS } from "./availableDays";

const COURSE_HINTS = [
  "JEE",
  "NEET",
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
  /^(lunch|break|recess|free|—|-|–|n\/?a)$/i.test(String(value || "").trim());

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

/**
 * Parse a timetable cell into course + subject when possible.
 * Examples: "JEE - Physics", "NEET Biology", "Physics (JEE)", "Physics"
 */
export const parseClassLabel = (raw = "") => {
  const text = String(raw || "").trim().replace(/\s+/g, " ");
  if (!text || isBreakLabel(text)) {
    return { course: null, subject: null, label: text, isBreak: true };
  }

  const paren = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    const left = paren[1].trim();
    const right = paren[2].trim();
    const rightIsCourse = COURSE_HINTS.some((c) =>
      right.toUpperCase().includes(c)
    );
    if (rightIsCourse) {
      return { course: right, subject: left, label: text, isBreak: false };
    }
    return { course: left, subject: right, label: text, isBreak: false };
  }

  for (const sep of [" - ", " – ", " | ", " / ", ":"]) {
    if (text.includes(sep)) {
      const [a, ...rest] = text.split(sep);
      const b = rest.join(sep).trim();
      if (a.trim() && b) {
        return {
          course: a.trim(),
          subject: b,
          label: text,
          isBreak: false,
        };
      }
    }
  }

  const upper = text.toUpperCase();
  for (const hint of COURSE_HINTS) {
    if (upper.startsWith(hint + " ")) {
      return {
        course: text.slice(0, hint.length).trim(),
        subject: text.slice(hint.length).trim(),
        label: text,
        isBreak: false,
      };
    }
  }

  return { course: null, subject: text, label: text, isBreak: false };
};

/**
 * From a saved grid timetable, list classes for a given weekday.
 * @returns {{ day: string, classes: Array<{ time, course, subject, label }> }}
 */
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
