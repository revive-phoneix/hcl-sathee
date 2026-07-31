import * as XLSX from "xlsx";
import {
  getCanonicalCentreKey,
  getCentreValueFromPortal,
} from "../../utils/portalMapping";

export const DEFAULT_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
];

export const DEFAULT_MONTHS = [
  "July 2026",
  "August 2026",
  "September 2026",
  "October 2026",
];

export const SCHEDULE_ACCEPT =
  ".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

const MONTH_INDEX = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7,
  september: 8, sep: 8, sept: 8, october: 9, oct: 9, november: 10, nov: 10,
  december: 11, dec: 11,
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_WORD =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

const storageKey = (portalName = "") => {
  const centre = getCentreValueFromPortal(portalName) || portalName || "default";
  const key = getCanonicalCentreKey(centre) || "DEFAULT";
  return `hcl_sathee_schedule_${key}`;
};

const legacyStorageKeys = (portalName = "") => {
  const centreLabel = getCentreValueFromPortal(portalName) || "";
  const rawPortal = String(portalName || "");
  const candidates = [rawPortal, centreLabel, getCanonicalCentreKey(centreLabel || rawPortal)];
  const keys = new Set();
  keys.add(storageKey(portalName));
  for (const value of candidates) {
    if (!value) continue;
    const slug = String(value)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (!slug) continue;
    keys.add(`hcl_sathee_schedule_data_${slug}`);
    keys.add(`hcl_sathee_schedule_${slug}`);
  }
  return [...keys];
};

const parseStoredSchedule = (raw) => {
  try {
    const parsed = JSON.parse(raw || "null");
    return Array.isArray(parsed?.rows) && parsed.rows.length ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Read cached schedule. Also recovers older localStorage keys from before
 * cloud sync (those were never uploaded, which is why phones saw nothing).
 */
export const readLocalSchedule = (portalName) => {
  try {
    for (const key of legacyStorageKeys(portalName)) {
      const parsed = parseStoredSchedule(localStorage.getItem(key));
      if (parsed) return parsed;
    }

    // Last resort: any schedule blob left on this browser for this centre.
    const centreKey = getCanonicalCentreKey(
      getCentreValueFromPortal(portalName) || portalName || ""
    );
    let best = null;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("hcl_sathee_schedule")) continue;
      if (centreKey && !key.toUpperCase().includes(centreKey.replace(/^HCL/, ""))) {
        // e.g. key contains RAJASTHAN while centreKey is HCLRAJASTHAN
        const loose = centreKey.replace(/^HCL/, "");
        if (!key.toUpperCase().includes(loose)) continue;
      }
      const parsed = parseStoredSchedule(localStorage.getItem(key));
      if (parsed && (!best || parsed.rows.length > best.rows.length)) {
        best = parsed;
      }
    }
    return best;
  } catch {
    return null;
  }
};

export const writeLocalSchedule = (portalName, payload) => {
  try {
    const primary = storageKey(portalName);
    if (!payload?.rows?.length) {
      for (const key of legacyStorageKeys(portalName)) {
        localStorage.removeItem(key);
      }
      return;
    }
    localStorage.setItem(primary, JSON.stringify(payload));
    // Drop legacy duplicates so we don't keep two sources of truth.
    for (const key of legacyStorageKeys(portalName)) {
      if (key !== primary) localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn("Unable to cache schedule locally:", err?.message || err);
  }
};

export const clearLocalSchedule = (portalName) => {
  try {
    for (const key of legacyStorageKeys(portalName)) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
};

export const readStoredSchedule = readLocalSchedule;

export const writeStoredSchedule = writeLocalSchedule;

const parseMonthLabel = (value) => {
  const match = String(value ?? "").trim().match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (!match) return null;
  const monthIdx = MONTH_INDEX[match[1].toLowerCase()];
  const year = Number(match[2]);
  if (monthIdx == null || !Number.isFinite(year)) return null;
  return { year, monthIdx, label: `${MONTH_NAMES[monthIdx]} ${year}` };
};

export const sortMonthsAscending = (months = []) =>
  [...new Set(months.filter(Boolean))].sort((a, b) => {
    const pa = parseMonthLabel(a);
    const pb = parseMonthLabel(b);
    if (pa && pb) return pa.year !== pb.year ? pa.year - pb.year : pa.monthIdx - pb.monthIdx;
    if (pa) return -1;
    if (pb) return 1;
    return String(a).localeCompare(String(b));
  });

export const monthsFromRows = (rows = []) =>
  sortMonthsAscending(rows.map((r) => r.month).filter(Boolean));

export const firstMonth = (months = []) => months[0] || DEFAULT_MONTHS[0];

export const mergeScheduleRows = (existing = [], incoming = []) => {
  const incomingMonths = new Set(incoming.map((r) => r.month).filter(Boolean));
  return [...existing.filter((r) => !incomingMonths.has(r.month)), ...incoming];
};

const normalizeMonthLabel = (value, fallback = DEFAULT_MONTHS[0]) => {
  const parsed = parseMonthLabel(value);
  if (parsed) return parsed.label;
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  const bare = text.match(/^([a-zA-Z]{3,9})$/);
  if (bare && MONTH_INDEX[bare[1].toLowerCase()] != null) {
    return `${MONTH_NAMES[MONTH_INDEX[bare[1].toLowerCase()]]} 2026`;
  }
  return text;
};

const inferMonthFromText = (value, fallbackYear = 2026) => {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const withYear = text.match(new RegExp(`\\b(${MONTH_WORD})\\b[\\s_-]*(\\d{4})`, "i"));
  if (withYear) return normalizeMonthLabel(`${withYear[1]} ${withYear[2]}`);
  const monthOnly = text.match(new RegExp(`\\b(${MONTH_WORD})\\b`, "i"));
  if (monthOnly) return normalizeMonthLabel(`${monthOnly[1]} ${fallbackYear}`);
  return parseMonthLabel(text)?.label || null;
};

const normalizeHeader = (value) =>
  String(value ?? "").trim().toLowerCase().replace(/[%()]/g, " ").replace(/\s+/g, " ");

const pickColumn = (headers, aliases) => {
  const normalized = headers.map(normalizeHeader);
  return aliases.reduce((found, alias) => (found >= 0 ? found : normalized.indexOf(alias)), -1);
};

const normalizeStatus = (value) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "Pending";
  if (raw.includes("complete") || raw === "done") return "Completed";
  if (raw.includes("progress") || raw.includes("ongoing")) return "In Progress";
  return "Pending";
};

const normalizeCompletion = (value, status) => {
  const num = Number(String(value ?? "").replace("%", "").trim());
  if (Number.isFinite(num)) return Math.max(0, Math.min(100, Math.round(num)));
  if (status === "Completed") return 100;
  if (status === "In Progress") return 50;
  return 0;
};

const formatScheduleDate = (value) => {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${String(value.getDate()).padStart(2, "0")} ${value.toLocaleString("en-US", { month: "short" })}`;
  }
  return String(value).trim();
};

const inferMonthFromDateValue = (value, fallbackYear = 2026) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return normalizeMonthLabel(
      `${value.toLocaleString("en-US", { month: "long" })} ${value.getFullYear()}`
    );
  }
  const text = String(value ?? "").trim();
  if (!text) return null;
  const withYear = text.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (withYear) return normalizeMonthLabel(`${withYear[2]} ${withYear[3]}`);
  const short = text.match(/^(\d{1,2})\s+([A-Za-z]{3,9})$/);
  if (short) return normalizeMonthLabel(`${short[2]} ${fallbackYear}`);
  return inferMonthFromText(text, fallbackYear);
};

export const repairScheduleRows = (rows = []) =>
  rows.map((row) => {
    const inferred =
      inferMonthFromDateValue(row.start) || inferMonthFromDateValue(row.end);
    return inferred && inferred !== row.month ? { ...row, month: inferred } : row;
  });

const inferMetaFromSheetPrefix = (matrix, headerRowIndex) => {
  let month = null;
  let subject = null;
  let faculty = null;
  let yearHint = 2026;

  for (let i = 0; i < headerRowIndex; i += 1) {
    const row = matrix[i] || [];
    const joined = row.map((cell) => String(cell ?? "").trim()).filter(Boolean).join(" ");
    if (!joined) continue;

    const titleMatch = joined.match(/^([A-Za-z]+)\s+(\d{4})\s*[-–—:]\s*(.+)$/);
    if (titleMatch) {
      month = normalizeMonthLabel(`${titleMatch[1]} ${titleMatch[2]}`);
      yearHint = Number(titleMatch[2]) || yearHint;
      const maybeSubject = titleMatch[3].trim();
      if (maybeSubject && !/^faculty$/i.test(maybeSubject)) subject = maybeSubject;
    }

    const monthOnly = parseMonthLabel(joined);
    if (!month && monthOnly) {
      month = monthOnly.label;
      yearHint = monthOnly.year;
    }

    const facultyIdx = row.findIndex((cell) => normalizeHeader(cell) === "faculty");
    if (facultyIdx >= 0) {
      const next = String(row[facultyIdx + 1] ?? "").trim();
      if (next) faculty = next;
    }
  }

  return { month, subject, faculty, yearHint };
};

export const parseScheduleWorkbook = (
  workbook,
  { fallbackSubject, fallbackMonth, fileName = "" } = {}
) => {
  const rows = [];
  const fileMonth = inferMonthFromText(fileName);

  workbook.SheetNames.forEach((sheetName) => {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
      raw: true,
    });
    if (!matrix.length) return;

    const headerRowIndex = matrix.findIndex((row) =>
      row.some((cell) => {
        const h = normalizeHeader(cell);
        return h.includes("topic") || h === "subject" || h.includes("planned");
      })
    );
    if (headerRowIndex < 0) return;

    const headers = matrix[headerRowIndex];
    const subjectIdx = pickColumn(headers, ["subject"]);
    const monthIdx = pickColumn(headers, ["month", "period"]);
    const topicIdx = pickColumn(headers, ["topic", "chapter", "unit"]);
    const daysIdx = pickColumn(headers, ["planned days", "days", "planned day", "duration"]);
    const startIdx = pickColumn(headers, ["start date", "start", "from"]);
    const endIdx = pickColumn(headers, ["end date", "end", "to"]);
    const facultyIdx = pickColumn(headers, ["faculty", "teacher", "instructor"]);
    const completionIdx = pickColumn(headers, ["completion", "completion %", "progress", "progress %"]);
    const statusIdx = pickColumn(headers, ["status"]);
    if (topicIdx < 0) return;

    const prefixMeta = inferMetaFromSheetPrefix(matrix, headerRowIndex);
    const sheetSubjectGuess = DEFAULT_SUBJECTS.find(
      (s) => normalizeHeader(s) === normalizeHeader(sheetName)
    );

    for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
      const row = matrix[i] || [];
      const topic = String(row[topicIdx] ?? "").trim();
      if (!topic) continue;

      const status = normalizeStatus(statusIdx >= 0 ? row[statusIdx] : "");
      const startRaw = startIdx >= 0 ? row[startIdx] : "";
      const endRaw = endIdx >= 0 ? row[endIdx] : "";
      const start = formatScheduleDate(startRaw) || "—";
      const end = formatScheduleDate(endRaw) || "—";
      const monthFromDates =
        inferMonthFromDateValue(startRaw, prefixMeta.yearHint) ||
        inferMonthFromDateValue(endRaw, prefixMeta.yearHint) ||
        inferMonthFromDateValue(start, prefixMeta.yearHint) ||
        inferMonthFromDateValue(end, prefixMeta.yearHint);

      rows.push({
        subject:
          String(subjectIdx >= 0 ? row[subjectIdx] : "").trim() ||
          prefixMeta.subject ||
          sheetSubjectGuess ||
          (sheetName && sheetName !== "Sheet1" ? sheetName : "") ||
          fallbackSubject ||
          "Mathematics",
        month:
          prefixMeta.month ||
          fileMonth ||
          monthFromDates ||
          (monthIdx >= 0 ? normalizeMonthLabel(row[monthIdx], "") : "") ||
          normalizeMonthLabel(fallbackMonth, DEFAULT_MONTHS[0]),
        topic,
        days: Number(daysIdx >= 0 ? row[daysIdx] : 0) || 0,
        start,
        end,
        faculty:
          String(facultyIdx >= 0 ? row[facultyIdx] : "").trim() ||
          prefixMeta.faculty ||
          "—",
        completion: normalizeCompletion(
          completionIdx >= 0 ? row[completionIdx] : "",
          status
        ),
        status,
      });
    }
  });

  return repairScheduleRows(rows);
};

export const parseScheduleFile = async (file, options) => {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });
  return parseScheduleWorkbook(workbook, { ...options, fileName: file.name });
};

export const scheduleMetaLabel = (rows, lastFile) => ({
  name: `Centre schedule · ${monthsFromRows(rows).join(", ")}`,
  lastFile: lastFile || null,
  updatedAt: new Date().toISOString(),
});
