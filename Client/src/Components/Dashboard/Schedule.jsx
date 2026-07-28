import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import ExportDropdown from "../common/ExportDropdown";
import { downloadTableSvg, downloadTableXlsx } from "../../utils/exportTable";

const DEFAULT_SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English"];
const DEFAULT_MONTHS = [
  "July 2026",
  "August 2026",
  "September 2026",
  "October 2026",
];

const MONTH_INDEX = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const parseMonthLabel = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const match = text.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (!match) return null;
  const monthIdx = MONTH_INDEX[match[1].toLowerCase()];
  const year = Number(match[2]);
  if (monthIdx == null || !Number.isFinite(year)) return null;
  return { year, monthIdx, label: `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()} ${year}` };
};

const sortMonthsAscending = (months = []) =>
  [...new Set(months.filter(Boolean))].sort((a, b) => {
    const pa = parseMonthLabel(a);
    const pb = parseMonthLabel(b);
    if (pa && pb) {
      if (pa.year !== pb.year) return pa.year - pb.year;
      return pa.monthIdx - pb.monthIdx;
    }
    if (pa) return -1;
    if (pb) return 1;
    return String(a).localeCompare(String(b));
  });

const monthsFromRows = (rows = []) =>
  sortMonthsAscending(rows.map((r) => r.month).filter(Boolean));

const firstMonth = (months = []) => months[0] || DEFAULT_MONTHS[0];

const normalizeMonthLabel = (value, fallback = DEFAULT_MONTHS[0]) => {
  const parsed = parseMonthLabel(value);
  if (parsed) return parsed.label;
  const text = String(value ?? "").trim();
  return text || fallback;
};

const ACCEPT =
  ".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

const storageKey = (portalName = "") =>
  `hcl_sathee_schedule_data_${String(portalName || "default")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")}`;

const readStored = (portalName) => {
  try {
    const raw = localStorage.getItem(storageKey(portalName));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.rows)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeStored = (portalName, payload) => {
  try {
    if (!payload) localStorage.removeItem(storageKey(portalName));
    else localStorage.setItem(storageKey(portalName), JSON.stringify(payload));
  } catch (err) {
    console.error("Unable to save schedule data", err);
    throw err;
  }
};

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[%()]/g, " ")
    .replace(/\s+/g, " ");

const pickColumn = (headers, aliases) => {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx >= 0) return idx;
  }
  return -1;
};

const normalizeStatus = (value) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "Pending";
  if (raw.includes("complete") || raw === "done") return "Completed";
  if (raw.includes("progress") || raw.includes("ongoing")) return "In Progress";
  if (raw.includes("pending") || raw.includes("todo") || raw.includes("not started")) return "Pending";
  if (raw === "completed") return "Completed";
  if (raw === "in progress") return "In Progress";
  return "Pending";
};

const normalizeCompletion = (value, status) => {
  const num = Number(String(value ?? "").replace("%", "").trim());
  if (Number.isFinite(num)) return Math.max(0, Math.min(100, Math.round(num)));
  if (status === "Completed") return 100;
  if (status === "In Progress") return 50;
  return 0;
};

const parseScheduleWorkbook = (workbook, { fallbackSubject, fallbackMonth }) => {
  const rows = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
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
    const daysIdx = pickColumn(headers, [
      "planned days",
      "days",
      "planned day",
      "duration",
    ]);
    const startIdx = pickColumn(headers, ["start date", "start", "from"]);
    const endIdx = pickColumn(headers, ["end date", "end", "to"]);
    const facultyIdx = pickColumn(headers, ["faculty", "teacher", "instructor"]);
    const completionIdx = pickColumn(headers, [
      "completion",
      "completion %",
      "progress",
      "progress %",
    ]);
    const statusIdx = pickColumn(headers, ["status"]);

    if (topicIdx < 0) return;

    const sheetSubjectGuess = DEFAULT_SUBJECTS.find(
      (s) => normalizeHeader(s) === normalizeHeader(sheetName)
    );

    for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
      const row = matrix[i] || [];
      const topic = String(row[topicIdx] ?? "").trim();
      if (!topic) continue;

      const status = normalizeStatus(statusIdx >= 0 ? row[statusIdx] : "");
      const subject =
        String(subjectIdx >= 0 ? row[subjectIdx] : "").trim() ||
        sheetSubjectGuess ||
        fallbackSubject ||
        "Mathematics";
      const month = normalizeMonthLabel(
        monthIdx >= 0 ? row[monthIdx] : "",
        fallbackMonth || DEFAULT_MONTHS[0]
      );
      rows.push({
        subject,
        month,
        topic,
        days: Number(daysIdx >= 0 ? row[daysIdx] : 0) || 0,
        start: String(startIdx >= 0 ? row[startIdx] : "").trim() || "—",
        end: String(endIdx >= 0 ? row[endIdx] : "").trim() || "—",
        faculty: String(facultyIdx >= 0 ? row[facultyIdx] : "").trim() || "—",
        completion: normalizeCompletion(
          completionIdx >= 0 ? row[completionIdx] : "",
          status
        ),
        status,
      });
    }
  });

  return rows;
};

function StatusBadge({ status }) {
  const config = {
    Completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    "In Progress": "bg-blue-100 text-blue-700 border border-blue-200",
    Pending: "bg-gray-100 text-gray-500 border border-gray-200",
  };
  const dot = {
    Completed: "text-emerald-500",
    "In Progress": "text-blue-500",
    Pending: "text-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config[status] || config.Pending}`}
    >
      <span className={dot[status] || dot.Pending}>
        {status === "Pending" ? "○" : "●"}
      </span>
      {status}
    </span>
  );
}

function ProgressBar({ value, status }) {
  const barColor =
    status === "Completed"
      ? "bg-emerald-500"
      : status === "In Progress"
        ? "bg-blue-500"
        : "bg-gray-300";
  const trackColor =
    status === "Completed"
      ? "bg-emerald-100"
      : status === "In Progress"
        ? "bg-blue-100"
        : "bg-gray-200";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className={`flex-1 h-1.5 rounded-full ${trackColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">
        {value}%
      </span>
    </div>
  );
}

function EmptyState({ readOnly, onUploadClick }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 gap-5">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center"
        style={{ background: "#ccd2dd" }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="6" y="10" width="36" height="32" rx="4" fill="#94a3b8" />
          <rect x="6" y="10" width="36" height="9" rx="4" fill="#3B82F6" />
          <rect x="14" y="25" width="20" height="2" rx="1" fill="#cbd5e1" />
          <rect x="14" y="31" width="14" height="2" rx="1" fill="#cbd5e1" />
          <rect
            x="12"
            y="6"
            width="4"
            height="7"
            rx="2"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <rect
            x="32"
            y="6"
            width="4"
            height="7"
            rx="2"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800">No Schedule Available</p>
        <p className="text-sm text-gray-500 mt-1 max-w-xs leading-relaxed">
          {readOnly
            ? "No teaching schedule has been uploaded for this centre yet."
            : "Upload an Excel or CSV schedule to view topics, progress, and status here."}
        </p>
      </div>
      {!readOnly ? (
        <button
          type="button"
          onClick={onUploadClick}
          className="mt-1 px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 active:scale-95 transition-all shadow-sm"
        >
          Upload Schedule
        </button>
      ) : null}
    </div>
  );
}

export default function Schedule({
  isOpen,
  onClose,
  readOnly = false,
  portalName = "",
}) {
  const [subject, setSubject] = useState("Mathematics");
  const [month, setMonth] = useState(DEFAULT_MONTHS[0]);
  const [search, setSearch] = useState("");
  const [scheduleMeta, setScheduleMeta] = useState(null);
  const [allRows, setAllRows] = useState([]);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const backdropRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    const stored = readStored(portalName);
    if (stored) {
      setAllRows(stored.rows);
      setScheduleMeta({
        name: stored.name || "Uploaded schedule",
        updatedAt: stored.updatedAt || null,
      });
      const first = stored.rows[0];
      if (first?.subject) setSubject(first.subject);
      setMonth(firstMonth(monthsFromRows(stored.rows)));
    } else {
      setAllRows([]);
      setScheduleMeta(null);
      setMonth(DEFAULT_MONTHS[0]);
    }
  }, [isOpen, portalName]);

  const subjects = useMemo(() => {
    const fromData = [...new Set(allRows.map((r) => r.subject).filter(Boolean))];
    return fromData.length ? fromData : DEFAULT_SUBJECTS;
  }, [allRows]);

  const months = useMemo(() => {
    const fromData = monthsFromRows(allRows);
    return fromData.length ? fromData : DEFAULT_MONTHS;
  }, [allRows]);

  useEffect(() => {
    if (!subjects.includes(subject) && subjects[0]) setSubject(subjects[0]);
  }, [subjects, subject]);

  useEffect(() => {
    if (!months.includes(month)) setMonth(firstMonth(months));
  }, [months, month]);

  if (!isOpen) return null;

  const hasUpload = allRows.length > 0;

  const rows = allRows.filter((r) => {
    const matchesSubject = r.subject === subject;
    const matchesMonth = r.month === month;
    const matchesSearch = r.topic.toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesMonth && matchesSearch;
  });

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = "";
    if (!file) return;

    const name = file.name.toLowerCase();
    const allowed =
      name.endsWith(".xls") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".csv") ||
      String(file.type || "").includes("sheet") ||
      String(file.type || "").includes("excel") ||
      String(file.type || "").includes("csv");

    if (!allowed) {
      setError("Please upload an Excel (.xlsx / .xls) or CSV file.");
      return;
    }

    try {
      setError("");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const parsedRows = parseScheduleWorkbook(workbook, {
        fallbackSubject: subject,
        fallbackMonth: month,
      });

      if (!parsedRows.length) {
        setError(
          "No schedule rows found. Include columns like Subject, Month, Topic, Days, Start, End, Faculty, Completion, Status."
        );
        return;
      }

      const payload = {
        name: file.name,
        updatedAt: new Date().toISOString(),
        rows: parsedRows,
      };
      writeStored(portalName, payload);
      setAllRows(parsedRows);
      setScheduleMeta({ name: file.name, updatedAt: payload.updatedAt });
      setSubject(parsedRows[0].subject);
      setMonth(firstMonth(monthsFromRows(parsedRows)));
      setSearch("");
    } catch (err) {
      console.error(err);
      setError("Unable to read that file. Check the format and try again.");
    }
  };

  const handleRemove = () => {
    writeStored(portalName, null);
    setAllRows([]);
    setScheduleMeta(null);
    setError("");
    setMonth(DEFAULT_MONTHS[0]);
    setSearch("");
  };

  const runScheduleExport = (format) => {
    try {
      setExporting(true);
      const headers = [
        "Topic",
        "Days",
        "Start",
        "End",
        "Faculty",
        "Completion (%)",
        "Status",
      ];
      const exportRows = rows.map((r) => [
        r.topic,
        r.days,
        r.start,
        r.end,
        r.faculty,
        r.completion,
        r.status,
      ]);
      const filename = `schedule-${subject}-${month}`
        .toLowerCase()
        .replace(/\s+/g, "-");
      const payload = {
        headers,
        rows: exportRows,
        filename,
        title: `Teaching Schedule · ${subject} · ${month}`,
        sheetName: "Schedule",
      };
      if (format === "xlsx") downloadTableXlsx(payload);
      else downloadTableSvg(payload);
    } catch (err) {
      console.error(`Export schedule ${format.toUpperCase()} error:`, err);
      alert(`Unable to export schedule ${format.toUpperCase()} right now`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(10, 18, 35, 0.62)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="relative flex flex-col bg-white shadow-2xl overflow-hidden"
        style={{
          width: "90%",
          maxWidth: "1200px",
          height: "90vh",
          borderRadius: "24px",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Teaching Schedule"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all"
          aria-label="Close modal"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#EFF6FF" }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect
                  x="2"
                  y="4"
                  width="18"
                  height="16"
                  rx="2.5"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1.6"
                />
                <path d="M2 9h18" stroke="#3B82F6" strokeWidth="1.6" />
                <rect x="7" y="1.5" width="2" height="5" rx="1" fill="#3B82F6" />
                <rect x="13" y="1.5" width="2" height="5" rx="1" fill="#3B82F6" />
                <path
                  d="M6 13h2M10 13h2M14 13h2M6 16.5h2M10 16.5h2"
                  stroke="#3B82F6"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                Centre Teaching Schedule
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {portalName
                  ? `${portalName} · Monthly Subject Planning & Coverage`
                  : "Monthly Subject Planning & Coverage"}
              </p>
            </div>
          </div>
          <div
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-100 flex-shrink-0"
            style={{ background: "#EFF6FF" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect
                x="1"
                y="2"
                width="12"
                height="11"
                rx="1.5"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="1.3"
              />
              <path d="M1 5.5h12" stroke="#3B82F6" strokeWidth="1.3" />
            </svg>
            <span className="text-sm font-bold text-blue-600">{month}</span>
          </div>
        </div>

        <div
          className="flex flex-col flex-1 overflow-y-auto px-8 py-5 gap-5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
        >
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!hasUpload ? (
            <EmptyState
              readOnly={readOnly}
              onUploadClick={() => fileInputRef.current?.click()}
            />
          ) : (
            <>
              {scheduleMeta ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-blue-800 truncate">
                      {scheduleMeta.name}
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {allRows.length} topic
                      {allRows.length === 1 ? "" : "s"} loaded
                    </p>
                  </div>
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="shrink-0 text-blue-600 hover:text-blue-800 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Subject
                  </label>
                  <div className="relative">
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 pr-7 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 cursor-pointer transition-all min-w-[150px]"
                    >
                      {subjects.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      ▾
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Month
                  </label>
                  <div className="relative">
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 pr-7 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 cursor-pointer transition-all min-w-[140px]"
                    >
                      {months.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      ▾
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Search
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <circle
                        cx="6"
                        cy="6"
                        r="4.5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M9.5 9.5l3 3"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search Topic..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                  <p className="text-base font-bold text-gray-800">
                    No topics for this filter
                  </p>
                  <p className="text-sm text-gray-500">
                    Try another subject or month.
                  </p>
                </div>
              ) : (
                <div
                  className="overflow-x-auto rounded-2xl border border-gray-100 flex-1"
                  style={{ minHeight: 0 }}
                >
                  <table
                    className="w-full text-sm border-collapse"
                    style={{ minWidth: "720px" }}
                  >
                    <thead>
                      <tr style={{ background: "#ccd2dd" }}>
                        {[
                          "Topic",
                          "Planned Days",
                          "Start Date",
                          "End Date",
                          "Faculty",
                          "Completion",
                          "Status",
                        ].map((col, i, arr) => (
                          <th
                            key={col}
                            className={`px-4 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap ${i === 0 ? "rounded-tl-2xl" : ""} ${i === arr.length - 1 ? "rounded-tr-2xl" : ""}`}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr
                          key={`${row.topic}-${i}`}
                          className="border-t border-gray-100 hover:bg-blue-50/50 transition-colors cursor-default"
                          style={{
                            background: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                          }}
                        >
                          <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                            {row.topic}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                              {row.days} Days
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                            {row.start}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                            {row.end}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-gray-700 whitespace-nowrap">
                            {row.faculty}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <ProgressBar
                              value={row.completion}
                              status={row.status}
                            />
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <StatusBadge status={row.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          {!readOnly ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl border border-blue-200 text-sm font-semibold text-blue-600 hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 9V3M4.5 5.5L7 3l2.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 10v1.5A1.5 1.5 0 003.5 13h7A1.5 1.5 0 0012 11.5V10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                {hasUpload ? "Replace Upload" : "Upload"}
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
          >
            Close
          </button>
          <ExportDropdown
            exporting={exporting}
            onExportXlsx={() => runScheduleExport("xlsx")}
            onExportSvg={() => runScheduleExport("svg")}
            label="Export Schedule"
          />
        </div>
      </div>
    </div>
  );
}
