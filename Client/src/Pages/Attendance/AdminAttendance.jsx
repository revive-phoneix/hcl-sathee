import { useCallback, useEffect, useMemo, useState } from "react";

import { MainLayout } from "../../Components/MainLayout";
import TabSelector from "../../Components/Attendance/TabSelector";
import AttendanceToolbar from "../../Components/Attendance/AttendanceToolbar";
import AttendanceTable from "../../Components/Attendance/AttendanceTable";
import SummaryCards from "../../Components/Attendance/SummaryCards";
import SatheeMitraAttendance from "../../Components/Attendance/SatheeMitraAttendance";
import { fetchUsers } from "../../services/users";
import { fetchStudents } from "../../services/students";
import { fetchStudentAttendanceRange } from "../../services/studentAttendance";
import { matchesPortalCentre } from "../../utils/portalMapping";
import {
  downloadAttendanceSvg,
  downloadAttendanceXlsx,
} from "../../utils/exportAttendance";

const COLUMN_LABEL = { daily: "Day", weekly: "Week", monthly: "Month" };

const WEEKDAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** Monday–Sunday week containing the selected date. */
const getWeekRange = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toInputDate(monday), to: toInputDate(sunday) };
};

const getMonthRange = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: toInputDate(from), to: toInputDate(to) };
};

const getYearRange = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  const year = d.getFullYear();
  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
    year,
  };
};

const eachDateInclusive = (from, to) => {
  const dates = [];
  const cur = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cur <= end) {
    dates.push(toInputDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

const percentStatusMeta = (percent) => {
  if (percent == null || Number.isNaN(percent)) {
    return { statusKey: "none", statusLabel: "—" };
  }
  if (percent >= 90) return { statusKey: "excellent", statusLabel: "Excellent" };
  if (percent >= 85) return { statusKey: "good", statusLabel: "Good" };
  if (percent >= 80) return { statusKey: "average", statusLabel: "Average" };
  return { statusKey: "low", statusLabel: "Low" };
};

const buildRow = (label, percent) => {
  const meta = percentStatusMeta(percent);
  return {
    id: label,
    label,
    percent,
    statusKey: meta.statusKey,
    statusLabel: meta.statusLabel,
    value:
      percent == null || Number.isNaN(percent)
        ? "—"
        : `${Math.round(percent)}%`,
  };
};

/**
 * Centre daily % = average of all centre students' daily %.
 * Students with no record for that day count as 0.
 */
const centrePercentForDate = (date, studentIds, recordsByStudentDate) => {
  if (!studentIds.length) return null;

  let sum = 0;
  let hasAnyRecord = false;
  for (const studentId of studentIds) {
    const rec = recordsByStudentDate.get(`${studentId}_${date}`);
    if (rec) {
      hasAnyRecord = true;
      sum += Number(rec.dailyAttendancePercentage) || 0;
    }
  }

  if (!hasAnyRecord) return null;
  return sum / studentIds.length;
};

const averageOfPercents = (percents) => {
  const valid = percents.filter((p) => p != null && !Number.isNaN(p));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

/** Calendar weeks (Mon–Sun) that intersect the selected month. */
const getWeeksInMonth = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  const year = d.getFullYear();
  const month = d.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const firstMonday = new Date(monthStart);
  const startDay = firstMonday.getDay();
  const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
  firstMonday.setDate(firstMonday.getDate() + mondayOffset);

  const weeks = [];
  let cursor = new Date(firstMonday);
  let weekIndex = 1;

  while (cursor <= monthEnd) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const clippedFrom = weekStart < monthStart ? monthStart : weekStart;
    const clippedTo = weekEnd > monthEnd ? monthEnd : weekEnd;

    weeks.push({
      label: `Week ${weekIndex}`,
      from: toInputDate(clippedFrom),
      to: toInputDate(clippedTo),
      dates: eachDateInclusive(toInputDate(clippedFrom), toInputDate(clippedTo)),
    });

    cursor.setDate(cursor.getDate() + 7);
    weekIndex += 1;
  }

  return weeks;
};

export default function AdminAttendance({
  portalName = "HCL SATHEE",
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  readOnly = false,
  roleLabel = "Admin Portal",
}) {
  const [activeTab, setActiveTab] = useState("daily");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => toInputDate());
  const [mitras, setMitras] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingMitras, setLoadingMitras] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const isMitraTab = activeTab === "sathee-mitra";

  const centreStudents = useMemo(
    () =>
      students.filter((student) =>
        matchesPortalCentre(student.centre, portalName)
      ),
    [students, portalName]
  );

  const centreStudentIds = useMemo(
    () => centreStudents.map((s) => String(s.id)),
    [centreStudents]
  );

  const centreMitras = useMemo(
    () =>
      mitras.filter(
        (user) =>
          String(user.role || "").toUpperCase() === "SATHEE MITRA" &&
          matchesPortalCentre(user.centre, portalName)
      ),
    [mitras, portalName]
  );

  const recordsByStudentDate = useMemo(() => {
    const map = new Map();
    for (const record of attendanceRecords) {
      map.set(`${String(record.studentId)}_${record.date}`, record);
    }
    return map;
  }, [attendanceRecords]);

  const periodMeta = useMemo(() => {
    if (activeTab === "daily") {
      const range = getWeekRange(selectedDate);
      return {
        ...range,
        label: `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`,
      };
    }
    if (activeTab === "weekly") {
      const range = getMonthRange(selectedDate);
      const d = new Date(`${selectedDate}T00:00:00`);
      return {
        ...range,
        label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      };
    }
    if (activeTab === "monthly") {
      const range = getYearRange(selectedDate);
      return { ...range, label: String(range.year) };
    }
    return { from: selectedDate, to: selectedDate, label: formatDisplayDate(selectedDate) };
  }, [activeTab, selectedDate]);

  const tableRows = useMemo(() => {
    if (isMitraTab) return [];

    if (activeTab === "daily") {
      const { from } = getWeekRange(selectedDate);
      const monday = new Date(`${from}T00:00:00`);
      return WEEKDAY_LABELS.map((label, index) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + index);
        const date = toInputDate(day);
        const percent = centrePercentForDate(
          date,
          centreStudentIds,
          recordsByStudentDate
        );
        return buildRow(label, percent);
      });
    }

    if (activeTab === "weekly") {
      return getWeeksInMonth(selectedDate).map((week) => {
        const dayPercents = week.dates.map((date) =>
          centrePercentForDate(date, centreStudentIds, recordsByStudentDate)
        );
        return buildRow(week.label, averageOfPercents(dayPercents));
      });
    }

    if (activeTab === "monthly") {
      const year = new Date(`${selectedDate}T00:00:00`).getFullYear();
      return MONTH_LABELS.map((label, monthIndex) => {
        const from = toInputDate(new Date(year, monthIndex, 1));
        const to = toInputDate(new Date(year, monthIndex + 1, 0));
        const dates = eachDateInclusive(from, to);
        const dayPercents = dates.map((date) =>
          centrePercentForDate(date, centreStudentIds, recordsByStudentDate)
        );
        return buildRow(label, averageOfPercents(dayPercents));
      });
    }

    return [];
  }, [
    isMitraTab,
    activeTab,
    selectedDate,
    centreStudentIds,
    recordsByStudentDate,
  ]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tableRows;
    return tableRows.filter((row) => row.label.toLowerCase().includes(q));
  }, [tableRows, search]);

  const summary = useMemo(() => {
    const withPercent = filtered.filter(
      (row) => row.percent != null && !Number.isNaN(row.percent)
    );
    if (!withPercent.length) {
      return {
        average: "—",
        highest: "—",
        lowest: "—",
        records: String(filtered.length),
      };
    }

    const avg =
      withPercent.reduce((sum, row) => sum + row.percent, 0) / withPercent.length;
    const sorted = [...withPercent].sort((a, b) => b.percent - a.percent);
    const high = sorted[0];
    const low = sorted[sorted.length - 1];

    return {
      average: `${avg.toFixed(1)}%`,
      highest: `${Math.round(high.percent)}% — ${high.label}`,
      lowest: `${Math.round(low.percent)}% — ${low.label}`,
      records: String(filtered.length),
    };
  }, [filtered]);

  const loadMitras = useCallback(async () => {
    setLoadingMitras(true);
    try {
      setMitras(await fetchUsers());
    } catch (err) {
      console.error("Fetch Sathee Mitra error:", err);
      setMitras([]);
    } finally {
      setLoadingMitras(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      setStudents(await fetchStudents());
    } catch (err) {
      console.error("Fetch students error:", err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    if (isMitraTab || !selectedDate) return;

    setLoadingAttendance(true);
    setError("");
    try {
      let range;
      if (activeTab === "daily") range = getWeekRange(selectedDate);
      else if (activeTab === "weekly") range = getMonthRange(selectedDate);
      else range = getYearRange(selectedDate);

      const records = await fetchStudentAttendanceRange(range.from, range.to);
      setAttendanceRecords(records);
    } catch (err) {
      console.error("Load student attendance error:", err);
      setError(
        err.response?.data?.message || "Unable to load centre attendance"
      );
      setAttendanceRecords([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, [isMitraTab, selectedDate, activeTab]);

  useEffect(() => {
    loadMitras();
    loadStudents();
  }, [loadMitras, loadStudents]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const runAttendanceExport = (format) => {
    if (isMitraTab) {
      alert("Export for Sathee Mitra attendance is not available yet");
      return;
    }

    try {
      setExporting(true);
      const payload = {
        records: filtered,
        columnLabel: COLUMN_LABEL[activeTab],
        activeTab,
        portalName,
        selectedDate,
        periodLabel: periodMeta.label,
      };
      if (format === "xlsx") downloadAttendanceXlsx(payload);
      else downloadAttendanceSvg(payload);
    } catch (err) {
      console.error(`Export attendance ${format.toUpperCase()} error:`, err);
      alert(`Unable to export attendance ${format.toUpperCase()} right now`);
    } finally {
      setExporting(false);
    }
  };

  const busy = loadingStudents || loadingAttendance;

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      roleLabel={roleLabel}
    >
      <div className="grid-cols-4 gap-6 w-full mx-auto px-6 space-y-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Record</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isMitraTab
              ? "Track Sathee Mitra presence with arrival and departure photo proof."
              : "Combined centre attendance by day, week, and month."}
          </p>
        </div>

        <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.06)] overflow-hidden">
          <AttendanceToolbar
            search={search}
            setSearch={setSearch}
            activeTab={activeTab}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onExportXlsx={() => runAttendanceExport("xlsx")}
            onExportSvg={() => runAttendanceExport("svg")}
            onRefresh={() => {
              setSearch("");
              setSelectedDate(toInputDate());
              loadMitras();
              loadStudents();
              loadAttendance();
            }}
            exporting={exporting}
          />

          {error && !isMitraTab ? (
            <div className="mx-5 mt-4 mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {isMitraTab ? (
            <SatheeMitraAttendance
              mitras={centreMitras}
              loading={loadingMitras}
              search={search}
              selectedDate={selectedDate}
            />
          ) : (
            <AttendanceTable
              filtered={filtered}
              columnLabel={COLUMN_LABEL[activeTab]}
              loading={busy}
            />
          )}

          <div className="flex items-center justify-between px-6 py-3.5 border-t border-[rgba(0,0,0,0.05)] bg-[#fafbfc]">
            <p className="text-xs text-gray-400">
              {isMitraTab ? (
                <>
                  Showing{" "}
                  <span className="font-medium text-gray-600">{centreMitras.length}</span>{" "}
                  Sathee Mitra
                </>
              ) : (
                <>
                  Showing {filtered.length} of {tableRows.length} records
                  {periodMeta.label ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-medium text-gray-600">
                        {periodMeta.label}
                      </span>
                    </>
                  ) : null}
                  {centreStudentIds.length ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-medium text-gray-600">
                        {centreStudentIds.length} students
                      </span>
                    </>
                  ) : null}
                </>
              )}
            </p>
            <p className="text-xs text-gray-400">
              {activeTab === "daily"
                ? "Centre % = average of all students that day"
                : activeTab === "weekly"
                  ? "Week % = average of centre daily %"
                  : activeTab === "monthly"
                    ? "Month % = average of centre daily %"
                    : null}
            </p>
          </div>
        </div>

        {!isMitraTab ? (
          <SummaryCards activeTab={activeTab} summary={summary} />
        ) : null}
      </div>
    </MainLayout>
  );
}
