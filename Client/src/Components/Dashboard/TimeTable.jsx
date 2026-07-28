import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Calendar, Upload, X } from "lucide-react";

const ACCEPT =
  ".xls,.xlsx,.csv,.svg,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,image/svg+xml";

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
  `hcl_sathee_timetable_grid_${String(portalName || "default")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")}`;

const readStored = (portalName) => {
  try {
    const raw = localStorage.getItem(storageKey(portalName));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.kind === "svg" && parsed?.dataUrl) return parsed;
    if (parsed?.kind === "grid" && Array.isArray(parsed?.slots)) return parsed;
    return null;
  } catch {
    return null;
  }
};

const writeStored = (portalName, payload) => {
  try {
    if (!payload) localStorage.removeItem(storageKey(portalName));
    else localStorage.setItem(storageKey(portalName), JSON.stringify(payload));
  } catch (err) {
    console.error("Unable to save timetable", err);
    throw err;
  }
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

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
  return (
    DAY_ORDER.find(
      (day) =>
        day.toLowerCase() === raw.toLowerCase() ||
        day.toLowerCase().startsWith(raw.toLowerCase().slice(0, 3))
    ) || raw
  );
};

const normalizeTime = (value) =>
  String(value ?? "")
    .trim()
    .replace(/[\u2013\u2014\u2212\-]+/g, "–")
    .replace(/\s+/g, "");

const isDayName = (value) => {
  const h = normalizeHeader(value);
  return DAY_ORDER.some((day) => normalizeHeader(day) === h);
};

const isSpreadsheet = (file) => {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return (
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".csv") ||
    type.includes("sheet") ||
    type.includes("excel") ||
    type.includes("csv")
  );
};

const isSvg = (file) =>
  String(file?.type || "").includes("svg") ||
  String(file?.name || "").toLowerCase().endsWith(".svg");

/** Parse weekly grid sheet → { days, slots } like the PDF table */
const parseWeeklyGrid = (matrix) => {
  const headerRowIndex = matrix.findIndex((row) => {
    const cells = row.map(normalizeHeader);
    const hasTime = cells.some(
      (c) => c === "time" || c === "timing" || c === "period" || c === "slot"
    );
    return hasTime && row.filter(isDayName).length >= 3;
  });
  if (headerRowIndex < 0) return null;

  const headers = matrix[headerRowIndex];
  const timeIdx = pickColumn(headers, ["time", "timing", "period", "slot"]);
  if (timeIdx < 0) return null;

  const dayColumns = headers
    .map((header, index) => ({ index, day: normalizeDay(header) }))
    .filter(
      (col) => col.index !== timeIdx && DAY_ORDER.includes(col.day)
    )
    .sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    );

  if (!dayColumns.length) return null;

  const slots = [];
  for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
    const row = matrix[i] || [];
    const time = normalizeTime(row[timeIdx]);
    if (!time) continue;
    slots.push({
      time,
      cells: dayColumns.map(({ index }) => String(row[index] ?? "").trim()),
    });
  }

  if (!slots.length) return null;
  return {
    days: dayColumns.map((c) => c.day),
    slots,
  };
};

/** Long Day/Time/Subject rows → weekly grid */
const parseLongToGrid = (matrix) => {
  const headerRowIndex = matrix.findIndex((row) =>
    row.some((cell) => {
      const h = normalizeHeader(cell);
      return h === "day" || h === "time" || h.includes("subject");
    })
  );
  if (headerRowIndex < 0) return null;

  const headers = matrix[headerRowIndex];
  const dayIdx = pickColumn(headers, ["day", "weekday"]);
  const timeIdx = pickColumn(headers, ["time", "slot", "timing"]);
  const subjectIdx = pickColumn(headers, ["subject", "class", "course"]);
  if (dayIdx < 0 || timeIdx < 0 || subjectIdx < 0) return null;

  const map = new Map();
  const timeOrder = [];

  for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
    const row = matrix[i] || [];
    const day = normalizeDay(row[dayIdx]);
    const time = normalizeTime(row[timeIdx]);
    const subject = String(row[subjectIdx] ?? "").trim();
    if (!day || !time || !subject) continue;
    if (!timeOrder.includes(time)) timeOrder.push(time);
    map.set(`${time}__${day}`, subject);
  }

  const days = DAY_ORDER.filter((day) =>
    [...map.keys()].some((k) => k.endsWith(`__${day}`))
  );
  if (!days.length || !timeOrder.length) return null;

  return {
    days,
    slots: timeOrder.map((time) => ({
      time,
      cells: days.map((day) => map.get(`${time}__${day}`) || ""),
    })),
  };
};

const parseWorkbookToGrid = (workbook) => {
  for (const sheetName of workbook.SheetNames) {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
    });
    if (!matrix.length) continue;
    const weekly = parseWeeklyGrid(matrix);
    if (weekly) return weekly;
    const longForm = parseLongToGrid(matrix);
    if (longForm) return longForm;
  }
  return null;
};

const titleFromGrid = (grid) => {
  const first = grid.slots[0]?.time?.replace("–", " ");
  const last = grid.slots[grid.slots.length - 1]?.time?.replace("–", " ");
  if (first && last) {
    return `Weekly Timetable — ${first} to ${last}`;
  }
  return "Weekly Timetable";
};

const isBreakCell = (value) => /lunch|break|recess/i.test(String(value || ""));

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
            : "Upload an Excel (.xlsx) or SVG weekly timetable to view it as a table."}
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

function WeeklyTable({ title, days, slots }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="border border-slate-700 px-3 py-2.5 text-left font-semibold whitespace-nowrap">
              Time
            </th>
            {days.map((day) => (
              <th
                key={day}
                className="border border-slate-700 px-3 py-2.5 text-left font-semibold whitespace-nowrap"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, rowIndex) => {
            const lunchRow = slot.cells.every(
              (cell) => !cell || isBreakCell(cell)
            ) && slot.cells.some(isBreakCell);
            return (
              <tr
                key={`${slot.time}-${rowIndex}`}
                className={
                  lunchRow
                    ? "bg-amber-50"
                    : rowIndex % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50"
                }
              >
                <td className="border border-slate-200 px-3 py-2 font-mono text-xs font-semibold text-violet-700 whitespace-nowrap">
                  {slot.time}
                </td>
                {slot.cells.map((cell, cellIndex) => (
                  <td
                    key={`${slot.time}-${days[cellIndex]}`}
                    className={`border border-slate-200 px-3 py-2 text-slate-800 ${
                      isBreakCell(cell) ? "font-medium text-amber-800" : ""
                    }`}
                  >
                    {cell || "—"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
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
  const [data, setData] = useState(null);
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
    setData(readStored(portalName));
  }, [isOpen, portalName]);

  const hasUpload = Boolean(data);
  const subtitle = useMemo(() => {
    if (data?.kind === "grid") return data.title || "Weekly Centre Classes";
    if (data?.kind === "svg") return "Uploaded SVG timetable";
    if (portalName) return `${portalName} · Centre Classes`;
    return "Centre Classes";
  }, [data, portalName]);

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (event.target === backdropRef.current) onClose();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;

    if (!isSpreadsheet(file) && !isSvg(file)) {
      setError("Please upload an Excel (.xlsx) or SVG file.");
      return;
    }

    try {
      setError("");

      if (isSvg(file)) {
        const dataUrl = await fileToDataUrl(file);
        const payload = {
          kind: "svg",
          name: file.name,
          dataUrl,
          updatedAt: new Date().toISOString(),
        };
        writeStored(portalName, payload);
        setData(payload);
        return;
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const grid = parseWorkbookToGrid(workbook);

      if (!grid) {
        setError(
          "Could not read the timetable. Use a weekly sheet: Time | Monday | Tuesday | …"
        );
        return;
      }

      const payload = {
        kind: "grid",
        name: file.name,
        title: titleFromGrid(grid),
        days: grid.days,
        slots: grid.slots,
        updatedAt: new Date().toISOString(),
      };
      writeStored(portalName, payload);
      setData(payload);
    } catch (err) {
      console.error(err);
      setError("Unable to read that file. Check the format and try again.");
    }
  };

  const handleRemove = () => {
    writeStored(portalName, null);
    setData(null);
    setError("");
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-[#3B82F6]/30">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
              <Calendar size={22} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-black">Timetable</h2>
              <p className="text-sm text-gray-600 truncate">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 overflow-auto flex-1">
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!hasUpload ? (
            <EmptyTimetable
              readOnly={readOnly}
              onUploadClick={() => fileInputRef.current?.click()}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm">
                <p className="font-medium text-violet-800 truncate min-w-0">
                  {data.name}
                </p>
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

              {data.kind === "grid" ? (
                <WeeklyTable
                  title={data.title || "Weekly Timetable"}
                  days={data.days}
                  slots={data.slots}
                />
              ) : (
                <div className="overflow-auto rounded-xl border border-slate-200 bg-white p-3">
                  <img
                    src={data.dataUrl}
                    alt={data.name || "Timetable"}
                    className="mx-auto max-h-[60vh] w-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t flex flex-wrap items-center justify-end gap-3">
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
                className="px-5 py-2.5 border border-violet-300 text-violet-700 rounded-2xl hover:bg-violet-50 transition-colors font-medium inline-flex items-center gap-2"
              >
                <Upload size={18} />
                {hasUpload ? "Replace Upload" : "Upload"}
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="px-7 py-2.5 bg-[#0F172A] text-white rounded-2xl hover:bg-black transition-colors font-medium"
          >
            Close Timetable
          </button>
        </div>
      </div>
    </div>
  );
}
