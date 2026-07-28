import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Calendar, Upload, X } from "lucide-react";

const ACCEPT =
  ".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const storageKey = (portalName = "") =>
  `hcl_sathee_timetable_data_${String(portalName || "default")
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
    console.error("Unable to save timetable data", err);
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

const normalizeDay = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const match = DAY_ORDER.find(
    (day) => day.toLowerCase() === raw.toLowerCase() || day.toLowerCase().startsWith(raw.toLowerCase().slice(0, 3))
  );
  return match || raw;
};

const parseTimetableWorkbook = (workbook) => {
  const rows = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (!matrix.length) return;

    const headerRowIndex = matrix.findIndex((row) =>
      row.some((cell) => {
        const h = normalizeHeader(cell);
        return (
          h === "day" ||
          h === "time" ||
          h.includes("subject") ||
          h.includes("period")
        );
      })
    );
    if (headerRowIndex < 0) return;

    const headers = matrix[headerRowIndex];
    const dayIdx = pickColumn(headers, ["day", "weekday"]);
    const dateIdx = pickColumn(headers, ["date", "day date", "daydate"]);
    const timeIdx = pickColumn(headers, ["time", "slot", "timing", "period time"]);
    const subjectIdx = pickColumn(headers, ["subject", "class", "course"]);
    const monthIdx = pickColumn(headers, ["month", "period", "label"]);

    if (dayIdx < 0 || timeIdx < 0 || subjectIdx < 0) return;

    for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
      const row = matrix[i] || [];
      const day = normalizeDay(row[dayIdx]);
      const time = String(row[timeIdx] ?? "").trim();
      const subject = String(row[subjectIdx] ?? "").trim();
      if (!day || !time || !subject) continue;

      rows.push({
        day,
        date: String(dateIdx >= 0 ? row[dateIdx] : "").trim(),
        time,
        subject,
        month: String(monthIdx >= 0 ? row[monthIdx] : "").trim(),
      });
    }
  });

  return rows;
};

const groupByDay = (rows) => {
  const map = new Map();

  rows.forEach((row) => {
    const key = `${row.day}__${row.date || ""}`;
    if (!map.has(key)) {
      map.set(key, {
        day: row.day,
        date: row.date,
        month: row.month,
        classes: [],
      });
    }
    map.get(key).classes.push({
      time: row.time,
      subject: row.subject,
    });
  });

  return [...map.values()].sort((a, b) => {
    const dayDiff =
      (DAY_ORDER.indexOf(a.day) === -1 ? 99 : DAY_ORDER.indexOf(a.day)) -
      (DAY_ORDER.indexOf(b.day) === -1 ? 99 : DAY_ORDER.indexOf(b.day));
    if (dayDiff !== 0) return dayDiff;
    return String(a.date).localeCompare(String(b.date), undefined, {
      numeric: true,
    });
  });
};

function EmptyTimetable({ readOnly, onUploadClick }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
        <Calendar size={28} className="text-violet-500" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-800">No Timetable Available</p>
        <p className="text-sm text-gray-500 mt-1 max-w-sm leading-relaxed">
          {readOnly
            ? "No timetable has been uploaded for this centre yet."
            : "Upload an Excel or CSV timetable to display centre classes here."}
        </p>
      </div>
      {!readOnly ? (
        <button
          type="button"
          onClick={onUploadClick}
          className="mt-1 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-all inline-flex items-center gap-2"
        >
          <Upload size={16} />
          Upload Timetable
        </button>
      ) : null}
    </div>
  );
}

export default function TimeTable({
  isOpen,
  onClose,
  readOnly = false,
  portalName = "",
}) {
  const backdropRef = useRef(null);
  const fileInputRef = useRef(null);
  const [allRows, setAllRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
      setMeta({
        name: stored.name || "Uploaded timetable",
        updatedAt: stored.updatedAt || null,
      });
    } else {
      setAllRows([]);
      setMeta(null);
    }
  }, [isOpen, portalName]);

  const days = useMemo(() => groupByDay(allRows), [allRows]);

  const periodLabel = useMemo(() => {
    const month = allRows.find((r) => r.month)?.month;
    if (month) return `${month} - Centre Classes`;
    if (portalName) return `${portalName} · Centre Classes`;
    return "Centre Classes";
  }, [allRows, portalName]);

  if (!isOpen) return null;

  const hasUpload = allRows.length > 0;

  const handleBackdropClick = (event) => {
    if (event.target === backdropRef.current) onClose();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
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
      const parsedRows = parseTimetableWorkbook(workbook);

      if (!parsedRows.length) {
        setError(
          "No timetable rows found. Include columns like Day, Date, Time, Subject (optional Month)."
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
      setMeta({ name: file.name, updatedAt: payload.updatedAt });
    } catch (err) {
      console.error(err);
      setError("Unable to read that file. Check the format and try again.");
    }
  };

  const handleRemove = () => {
    writeStored(portalName, null);
    setAllRows([]);
    setMeta(null);
    setError("");
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-[#3B82F6]/30">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
              <Calendar size={24} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-black">Timetable</h2>
              <p className="text-sm text-gray-600">{periodLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1">
          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!hasUpload ? (
            <EmptyTimetable
              readOnly={readOnly}
              onUploadClick={() => fileInputRef.current?.click()}
            />
          ) : (
            <>
              {meta ? (
                <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-violet-800 truncate">{meta.name}</p>
                    <p className="text-xs text-violet-600 mt-0.5">
                      {allRows.length} class
                      {allRows.length === 1 ? "" : "es"} · {days.length} day
                      {days.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="shrink-0 text-violet-600 hover:text-violet-800 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {days.map((day) => (
                  <div
                    key={`${day.day}-${day.date}`}
                    className="bg-[#f8fafc] border border-gray-200 rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-lg text-black">
                          {day.day}
                        </div>
                        <div className="text-sm text-gray-500">
                          {day.month
                            ? `${day.month.split(" ")[0]} ${day.date || ""}`.trim()
                            : day.date
                              ? `Date ${day.date}`
                              : "Centre day"}
                        </div>
                      </div>
                      <div className="text-xs px-3 py-1 bg-violet-100 text-violet-700 rounded-full font-medium">
                        {day.classes.length} classes
                      </div>
                    </div>

                    <div className="space-y-3">
                      {day.classes.map((item) => (
                        <div
                          key={`${day.day}-${item.time}-${item.subject}`}
                          className="bg-white border border-gray-100 rounded-xl p-3 text-sm"
                        >
                          <div className="font-mono text-violet-600 font-medium mb-1">
                            {item.time}
                          </div>
                          <div className="font-medium text-black">
                            {item.subject}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
                <strong>Note:</strong> Timetable is subject to change. Please
                check with the centre administrator for updates.
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t flex flex-wrap items-center justify-end gap-3">
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
                className="px-6 py-3 border border-violet-300 text-violet-700 rounded-2xl hover:bg-violet-50 transition-colors font-medium inline-flex items-center gap-2"
              >
                <Upload size={18} />
                {hasUpload ? "Replace Upload" : "Upload"}
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 bg-[#0F172A] text-white rounded-2xl hover:bg-black transition-colors font-medium"
          >
            Close Timetable
          </button>
        </div>
      </div>
    </div>
  );
}
