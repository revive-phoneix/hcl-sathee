import { useCallback, useEffect, useMemo, useState } from "react";

import { MainLayout } from "../../Components/MainLayout";
import TabSelector from "../../Components/Attendance/TabSelector";
import AttendanceToolbar from "../../Components/Attendance/AttendanceToolbar";
import AttendanceTable from "../../Components/Attendance/AttendanceTable";
import SummaryCards from "../../Components/Attendance/SummaryCards";
import SatheeMitraAttendance from "../../Components/Attendance/SatheeMitraAttendance";
import { fetchUsers } from "../../services/users";
import { fetchStudents } from "../../services/students";
import {
  fetchStudentAttendanceByDate,
  fetchStudentAttendanceRange,
  upsertStudentAttendance,
} from "../../services/studentAttendance";
import { matchesPortalCentre } from "../../utils/portalMapping";
import {
  downloadAttendanceSvg,
  downloadAttendanceXlsx,
} from "../../utils/exportAttendance";

const COLUMN_LABEL = { daily: "Student", weekly: "Student", monthly: "Student" };

const STATUS_LABEL = {
  present: "Present",
  late: "Late",
  absent: "Absent",
};

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
  return {
    from: toInputDate(from),
    to: toInputDate(to),
    dayCount: to.getDate(),
    monthLabel: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
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

const recordKey = (studentId, date) => `${String(studentId)}_${date}`;

const averagePercent = (studentId, recordsMap, dates) => {
  if (!dates.length) return 0;
  let sum = 0;
  for (const date of dates) {
    const rec = recordsMap[recordKey(studentId, date)];
    sum += rec ? Number(rec.dailyAttendancePercentage) || 0 : 0;
  }
  return sum / dates.length;
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
  const [savingId, setSavingId] = useState(null);

  const isMitraTab = activeTab === "sathee-mitra";
  const canMark = !readOnly && activeTab === "daily";

  const centreStudents = useMemo(
    () =>
      students.filter((student) =>
        matchesPortalCentre(student.centre, portalName)
      ),
    [students, portalName]
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

  const recordsMap = useMemo(() => {
    const map = {};
    for (const record of attendanceRecords) {
      map[recordKey(record.studentId, record.date)] = record;
    }
    return map;
  }, [attendanceRecords]);

  const periodMeta = useMemo(() => {
    if (activeTab === "weekly") {
      const range = getWeekRange(selectedDate);
      return {
        ...range,
        dates: eachDateInclusive(range.from, range.to),
        label: `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`,
      };
    }
    if (activeTab === "monthly") {
      const range = getMonthRange(selectedDate);
      return {
        ...range,
        dates: eachDateInclusive(range.from, range.to),
        label: range.monthLabel,
      };
    }
    return {
      from: selectedDate,
      to: selectedDate,
      dates: [selectedDate],
      label: formatDisplayDate(selectedDate),
    };
  }, [activeTab, selectedDate]);

  const tableRows = useMemo(() => {
    if (isMitraTab) return [];

    return centreStudents.map((student) => {
      const id = student.id;
      if (activeTab === "daily") {
        const record = recordsMap[recordKey(id, selectedDate)];
        const status = record?.status || "";
        const percent = record
          ? Number(record.dailyAttendancePercentage)
          : null;

        return {
          id,
          label: student.name || "—",
          subLabel: student.course || student.centre || "",
          student,
          percent,
          rawStatus: status,
          statusKey: status || "none",
          statusLabel: status ? STATUS_LABEL[status] || status : "Not marked",
          value:
            percent == null || Number.isNaN(percent)
              ? "—"
              : `${Math.round(percent)}%`,
        };
      }

      const percent = averagePercent(id, recordsMap, periodMeta.dates);
      const meta = percentStatusMeta(percent);
      return {
        id,
        label: student.name || "—",
        subLabel: student.course || student.centre || "",
        student,
        percent,
        rawStatus: "",
        statusKey: meta.statusKey,
        statusLabel: meta.statusLabel,
        value: `${Math.round(percent)}%`,
      };
    });
  }, [
    isMitraTab,
    centreStudents,
    activeTab,
    recordsMap,
    selectedDate,
    periodMeta.dates,
  ]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tableRows;
    return tableRows.filter(
      (row) =>
        (row.label || "").toLowerCase().includes(q) ||
        (row.subLabel || "").toLowerCase().includes(q)
    );
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
      let records;
      if (activeTab === "daily") {
        records = await fetchStudentAttendanceByDate(selectedDate);
      } else {
        const range =
          activeTab === "weekly"
            ? getWeekRange(selectedDate)
            : getMonthRange(selectedDate);
        records = await fetchStudentAttendanceRange(range.from, range.to);
      }
      setAttendanceRecords(records);
    } catch (err) {
      console.error("Load student attendance error:", err);
      setError(
        err.response?.data?.message || "Unable to load student attendance"
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

  const handleStatusChange = async (row, status) => {
    if (!canMark || !status) return;

    setSavingId(row.id);
    setError("");
    try {
      const saved = await upsertStudentAttendance({
        studentId: row.id,
        name: row.label,
        centre: row.student?.centre,
        date: selectedDate,
        status,
      });

      setAttendanceRecords((prev) => {
        const without = prev.filter(
          (r) =>
            !(
              String(r.studentId) === String(row.id) &&
              r.date === selectedDate
            )
        );
        return [...without, saved];
      });
    } catch (err) {
      console.error("Save student attendance error:", err);
      setError(
        err.response?.data?.message || "Unable to save student attendance"
      );
    } finally {
      setSavingId(null);
    }
  };

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
              : "View and mark student attendance. Weekly and monthly rates average daily percentages."}
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
              canMark={canMark && savingId == null}
              onStatusChange={handleStatusChange}
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
                  Showing {filtered.length} of {centreStudents.length} students
                  {periodMeta.label ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-medium text-gray-600">
                        {periodMeta.label}
                      </span>
                    </>
                  ) : null}
                </>
              )}
            </p>
            <p className="text-xs text-gray-400">
              {activeTab === "weekly"
                ? "Weekly = average of 7 daily %"
                : activeTab === "monthly"
                  ? "Monthly = average of all days in month"
                  : canMark
                    ? "Select status to mark attendance"
                    : "View only"}
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
