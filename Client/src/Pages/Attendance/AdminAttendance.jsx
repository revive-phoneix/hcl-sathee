import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { MainLayout } from "../../Components/MainLayout";
import TabSelector from "../../Components/Attendance/TabSelector";
import AttendanceToolbar from "../../Components/Attendance/AttendanceToolbar";
import AttendanceTable from "../../Components/Attendance/AttendanceTable";
import SatheeMitraAttendance from "../../Components/Attendance/SatheeMitraAttendance";
import MyMitraAttendance from "../../Components/Attendance/MyMitraAttendance";
import VishistAttendanceUpload from "../../Components/Attendance/VishistAttendanceUpload";
import ApplyLeaveModal from "../../Components/Attendance/ApplyLeaveModal";
import TodaysClassesCard from "../../Components/Attendance/TodaysClassesCard";
import ClassSubjectAttendanceTables from "../../Components/Attendance/ClassSubjectAttendanceTables";
import { fetchUsers } from "../../services/users";
import { applyLeaveRequest, fetchMyLeaveRequests } from "../../services/leaveRequests";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { fetchStudents } from "../../services/students";
import api from "../../services/apiClient";
import { matchesPortalCentre } from "../../utils/portalMapping";
import {
  downloadAttendanceSvg,
  downloadAttendanceXlsx,
} from "../../utils/exportAttendance";
import { WEEKDAYS } from "../../utils/availableDays";

const COLUMN_LABEL = { daily: "Day", weekly: "Week", monthly: "Month" };
const PERIOD_TABS = new Set(["daily", "weekly", "monthly"]);

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

const averageOfPercents = (percents) => {
  const valid = percents.filter((p) => p != null && !Number.isNaN(p));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

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

const fetchList = async (fetcher, onSuccess, onLoading, errorLabel) => {
  onLoading(true);
  try {
    onSuccess(await fetcher());
  } catch (err) {
    console.error(`${errorLabel}:`, err);
    onSuccess([]);
  } finally {
    onLoading(false);
  }
};

const formatLeaveDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const leaveStatusMeta = (status) => {
  const value = String(status || "pending").toLowerCase();
  if (value === "approved") {
    return {
      label: "Approved",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }
  if (value === "rejected") {
    return {
      label: "Rejected",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }
  return {
    label: "Pending",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  };
};

export default function AdminAttendance({
  portalName = "HCL SATHEE",
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  readOnly = false,
  roleLabel = "Admin Portal",
  showCentreFilter,
  showMitraTab,
  mitraTabLabel = "Sathee Mitra",
  mitraSelfUpload = false,
  userName = "",
  userEmail = "",
  userId = null,
  userCentre = null,
  isCustomCentre = false,
}) {
  const navigate = useNavigate();
  const isAdminView = !readOnly;
  const centreFilterEnabled =
    typeof showCentreFilter === "boolean" ? showCentreFilter : isAdminView;
  const mitraTabEnabled =
    typeof showMitraTab === "boolean" ? showMitraTab : true;
  const [activeTab, setActiveTab] = useState("");
  const [selectedCentre, setSelectedCentre] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [appliedType, setAppliedType] = useState("");
  const [appliedCentre, setAppliedCentre] = useState("");
  const [appliedRole, setAppliedRole] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => toInputDate());
  const [mitras, setMitras] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingMitras, setLoadingMitras] = useState(false);
  const [attendanceDropdownOpen, setAttendanceDropdownOpen] = useState(false);
  const attendanceMenuRef = useRef(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState("");
  const [leaveError, setLeaveError] = useState("");
  const [mitraPanel, setMitraPanel] = useState("attendance");
  const [myRequests, setMyRequests] = useState([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(false);
  const [myRequestsError, setMyRequestsError] = useState("");
  const [attendancePanel, setAttendancePanel] = useState("myAttendance");

  useEffect(() => {
    if (!attendanceDropdownOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!attendanceMenuRef.current?.contains(event.target)) {
        setAttendanceDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setAttendanceDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [attendanceDropdownOpen]);

  const centreScope = centreFilterEnabled ? selectedCentre : portalName;

  const hasCompleteSelection = Boolean(activeTab && centreScope && selectedRole);
  const viewReady =
    Boolean(appliedType && appliedCentre && appliedRole) &&
    appliedType === activeTab &&
    appliedCentre === centreScope &&
    appliedRole === selectedRole;
  const isMitraView = viewReady && appliedRole === "sathee-mitra";
  const isVishistView = viewReady && appliedRole === "sathee-vishist";
  const filtersReady = viewReady;

  const centreStudents = useMemo(
    () =>
      students.filter((student) =>
        matchesPortalCentre(student.centre, centreScope)
      ),
    [students, centreScope]
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
          matchesPortalCentre(user.centre, centreScope)
      ),
    [mitras, centreScope]
  );

  const centreVishistMitras = useMemo(
    () => centreMitras.filter((user) => Boolean(user.isVishist)),
    [centreMitras]
  );

  const currentMitra = useMemo(() => {
    if (!userId) return [];
    return [
      {
        id: userId,
        name: userName || "",
        email: userEmail || "",
        centre: userCentre || portalName || "",
      },
    ];
  }, [userId, userName, userEmail, userCentre, portalName]);

  const attendancePercentByDate = useMemo(() => {
    const map = new Map();
    for (const day of attendanceRecords) {
      map.set(day.date, Number(day.percentage) || 0);
    }
    return map;
  }, [attendanceRecords]);

  const periodMeta = useMemo(() => {
    if (appliedType === "daily") {
      const range = getWeekRange(selectedDate);
      return {
        ...range,
        label: `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`,
      };
    }
    if (appliedType === "weekly") {
      const range = getMonthRange(selectedDate);
      const d = new Date(`${selectedDate}T00:00:00`);
      return {
        ...range,
        label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      };
    }
    if (appliedType === "monthly") {
      const range = getYearRange(selectedDate);
      return { ...range, label: String(range.year) };
    }
    return { from: selectedDate, to: selectedDate, label: formatDisplayDate(selectedDate) };
  }, [appliedType, selectedDate]);

  const tableRows = useMemo(() => {
    if (isMitraView || !filtersReady) return [];

    const activeType = appliedType || activeTab;

    if (isVishistView) {
      if (activeType !== "daily") return [];

      const assignedDays = new Set(
        centreVishistMitras.flatMap((mentor) =>
          Array.isArray(mentor.availableDays)
            ? mentor.availableDays.map((day) => String(day).toLowerCase())
            : []
        )
      );

      return WEEKDAYS.filter((day) => assignedDays.has(day.toLowerCase())).map((day) =>
        buildRow(day, 0)
      );
    }

    if (activeType === "daily") {
      const { from } = getWeekRange(selectedDate);
      const monday = new Date(`${from}T00:00:00`);
      return WEEKDAYS.map((label, index) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + index);
        const date = toInputDate(day);
        const percent = attendancePercentByDate.get(date) ?? null;
        return buildRow(label, percent);
      });
    }

    if (activeType === "weekly") {
      return getWeeksInMonth(selectedDate).map((week) => {
        const dayPercents = week.dates.map((date) => attendancePercentByDate.get(date) ?? null);
        return buildRow(week.label, averageOfPercents(dayPercents));
      });
    }

    if (activeType === "monthly") {
      const year = new Date(`${selectedDate}T00:00:00`).getFullYear();
      return MONTH_LABELS.map((label, monthIndex) => {
        const from = toInputDate(new Date(year, monthIndex, 1));
        const to = toInputDate(new Date(year, monthIndex + 1, 0));
        const dates = eachDateInclusive(from, to);
        const dayPercents = dates.map((date) => attendancePercentByDate.get(date) ?? null);
        return buildRow(label, averageOfPercents(dayPercents));
      });
    }

    return [];
  }, [
    isMitraView,
    isVishistView,
    filtersReady,
    appliedType,
    activeTab,
    selectedDate,
    attendancePercentByDate,
    centreVishistMitras,
  ]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tableRows;
    return tableRows.filter((row) => row.label.toLowerCase().includes(q));
  }, [tableRows, search]);

  const loadMitras = useCallback(
    () => {
      if (isCustomCentre) {
        setMitras([]);
        setLoadingMitras(false);
        return;
      }
      fetchList(fetchUsers, setMitras, setLoadingMitras, "Fetch Sathee Mitra error");
    },
    [isCustomCentre]
  );

  const loadStudents = useCallback(
    () => {
      if (isCustomCentre) {
        setStudents([]);
        setLoadingStudents(false);
        return;
      }
      fetchList(fetchStudents, setStudents, setLoadingStudents, "Fetch students error");
    },
    [isCustomCentre]
  );

  const loadAttendance = useCallback(async () => {
    if (isCustomCentre || !viewReady || appliedRole !== "student" || !selectedDate) {
      setAttendanceRecords([]);
      return;
    }
    if (centreFilterEnabled && (!appliedCentre || !PERIOD_TABS.has(appliedType))) {
      setAttendanceRecords([]);
      return;
    }

    setLoadingAttendance(true);
    setError("");
    try {
      let range;
      if (appliedType === "daily") range = getWeekRange(selectedDate);
      else if (appliedType === "weekly") range = getMonthRange(selectedDate);
      else range = getYearRange(selectedDate);

      const response = await api.get("/api/students/performance/attendance-range", {
        params: {
          from: range.from,
          to: range.to,
          ...(appliedCentre ? { centre: appliedCentre } : {}),
        },
      });
      setAttendanceRecords(response.data.days ?? []);
    } catch (err) {
      console.error("Load student attendance error:", err);
      setError(
        err.response?.data?.message || "Unable to load centre attendance"
      );
      setAttendanceRecords([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, [isCustomCentre, viewReady, appliedRole, appliedType, appliedCentre, selectedDate, centreFilterEnabled]);

  useEffect(() => {
    if (mitraTabEnabled) loadMitras();
    loadStudents();
  }, [mitraTabEnabled, loadMitras, loadStudents]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    if (!mitraSelfUpload || mitraPanel !== "requests") return;

    if (isCustomCentre) {
      setMyRequests([]);
      setLoadingMyRequests(false);
      setMyRequestsError("");
      return;
    }

    let isMounted = true;
    setLoadingMyRequests(true);
    setMyRequestsError("");

    fetchMyLeaveRequests()
      .then((leaves) => {
        if (!isMounted) return;
        setMyRequests(leaves);
      })
      .catch((err) => {
        console.error("Load my leave requests error:", err);
        if (!isMounted) return;
        setMyRequests([]);
        setMyRequestsError(getApiErrorMessage(err, "Unable to load your requests"));
      })
      .finally(() => {
        if (isMounted) setLoadingMyRequests(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mitraSelfUpload, mitraPanel, isCustomCentre]);

  const handleApplyLeave = async (payload) => {
    setSubmittingLeave(true);
    setLeaveError("");
    setLeaveMessage("");
    try {
      await applyLeaveRequest(payload);
      setShowLeaveModal(false);
      setLeaveMessage(
        "Leave request submitted. Admins for your centre will be notified once push alerts are enabled."
      );
    } catch (err) {
      console.error("Apply leave error:", err);
      setLeaveError(getApiErrorMessage(err, "Unable to submit leave request"));
    } finally {
      setSubmittingLeave(false);
    }
  };

  const runAttendanceExport = (format) => {
    if (isMitraView) {
      alert("Export for Sathee Mitra attendance is not available yet");
      return;
    }

    if (!filtersReady) {
      alert("Please select Type, Centre, Role and click Go before exporting");
      return;
    }

    try {
      setExporting(true);
      const payload = {
        records: filtered,
        columnLabel: COLUMN_LABEL[appliedType],
        activeTab: appliedType,
        portalName: centreFilterEnabled
          ? selectedCentre || portalName
          : portalName,
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

  const busy = loadingStudents || (viewReady && appliedRole === "student" ? loadingAttendance : false);

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
        {mitraSelfUpload ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Attendance</h2>
                <p className="text-sm text-slate-500">
                  Choose the attendance view for your own record or Sathee Vishist mentors.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div ref={attendanceMenuRef} className="relative inline-flex">
                  <button
                    type="button"
                    onClick={() => setAttendanceDropdownOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={attendanceDropdownOpen}
                    className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Attendance
                    <span className={`inline-block transition-transform ${attendanceDropdownOpen ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>

                  {attendanceDropdownOpen ? (
                    <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setAttendancePanel("myAttendance");
                          setMitraPanel("myAttendance");
                          setAttendanceDropdownOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <span>My Attendance</span>
                        {attendancePanel === "myAttendance" ? <span className="text-sky-600">Selected</span> : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAttendancePanel("vishistAttendance");
                          setMitraPanel("myAttendance");
                          setAttendanceDropdownOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <span>Vishist Attendance</span>
                        {attendancePanel === "vishistAttendance" ? <span className="text-sky-600">Selected</span> : null}
                      </button>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setMitraPanel("requests")}
                  className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    mitraPanel === "requests"
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-sky-200 bg-white text-sky-700 hover:bg-sky-50"
                  }`}
                >
                  MyRequests
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLeaveError("");
                    setLeaveMessage("");
                    setShowLeaveModal(true);
                  }}
                  className="shrink-0 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Apply Leave
                </button>
              </div>
            </div>

            {mitraPanel === "attendance" ? <TodaysClassesCard portalName={portalName} isCustomCentre={isCustomCentre} /> : null}
          </div>
        ) : null}

        {mitraSelfUpload ? (
          mitraPanel === "myAttendance" ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {attendancePanel === "vishistAttendance" ? "Vishist Attendance" : "My Attendance"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {attendancePanel === "vishistAttendance"
                      ? "Review attendance for Sathee Vishist mentors in your centre."
                      : "Upload your arrival and departure photos for daily tracking."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMitraPanel("attendance")}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back to Attendance
                </button>
              </div>

              {attendancePanel === "vishistAttendance" ? (
  <VishistAttendanceUpload portalName={portalName} isCustomCentre={isCustomCentre} />
) : (
  <MyMitraAttendance
    userId={userId}
    userName={userName}
    userEmail={userEmail}
    userCentre={userCentre}
    portalName={portalName}
    selectedDate={selectedDate}
    isCustomCentre={isCustomCentre}
  />
)}
            </div>
          ) : mitraPanel === "attendance" ? (
            <ClassSubjectAttendanceTables
              portalName={portalName}
              userCentre={userCentre}
              students={centreStudents}
              studentsLoading={loadingStudents}
              isCustomCentre={isCustomCentre}
            />
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">MyRequests</h3>
                  <p className="text-sm text-slate-500">
                    Track the status of leave requests you have submitted.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMitraPanel("attendance")}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back to Attendance
                </button>
              </div>

              {myRequestsError ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {myRequestsError}
                </div>
              ) : null}

              {loadingMyRequests ? (
                <p className="py-10 text-center text-sm text-slate-500">Loading your requests…</p>
              ) : myRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                  <p className="text-sm font-medium text-slate-800">No leave requests submitted yet.</p>
                  <p className="mt-1 text-sm text-slate-500">Use Apply Leave to send a request to the admin.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myRequests.map((leave) => {
                    const statusMeta = leaveStatusMeta(leave.status);

                    return (
                      <div
                        key={leave.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-semibold text-slate-900">
                                {formatLeaveDate(leave.fromDate)} - {formatLeaveDate(leave.toDate)}
                              </h4>
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                                {statusMeta.label}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                              {leave.reason || "No reason provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        ) : null}

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900">Attendance Record</h1>
            <p className="mt-1 text-sm text-gray-500">
              {viewReady && appliedRole === "sathee-mitra"
                ? "Track Sathee Mitra presence with arrival and departure photo proof."
                : "Combined centre attendance by day, week, and month."}
            </p>
          </div>
          {mitraSelfUpload ? null : isAdminView ? (
            <button
              type="button"
              onClick={() => navigate("/leave-requests")}
              className="shrink-0 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            >
              Leave Requests
            </button>
          ) : null}
        </div>

        {leaveMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {leaveMessage}
          </div>
        ) : null}
        {leaveError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {leaveError}
          </div>
        ) : null}

        <TabSelector
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedCentre={selectedCentre}
          setSelectedCentre={setSelectedCentre}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          showCentreFilter={centreFilterEnabled}
          showMitraTab={false}
          mitraTabLabel={mitraTabLabel}
          onGo={() => {
            setAppliedType(activeTab);
            setAppliedCentre(centreScope);
            setAppliedRole(selectedRole);
          }}
          canGo={hasCompleteSelection}
        />

        <div className="bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.06)] overflow-hidden">
          <AttendanceToolbar
            search={search}
            setSearch={setSearch}
            activeTab={
              filtersReady || isMitraView
                ? appliedType || activeTab || "daily"
                : "daily"
            }
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onExportXlsx={() => runAttendanceExport("xlsx")}
            onExportSvg={() => runAttendanceExport("svg")}
            exporting={exporting}
            showExport={!readOnly}
          />

          {error && !isMitraView ? (
            <div className="mx-5 mt-4 mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!viewReady ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">
                Select Type, Centre, and Role to view attendance
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Choose all three filters and click Go to load the records.
              </p>
            </div>
          ) : isMitraView ? (
            <SatheeMitraAttendance
              mitras={mitraSelfUpload ? currentMitra : centreMitras}
              loading={loadingMitras}
              search={search}
              selectedDate={selectedDate}
              activeTab={appliedType}
              canApprove={!readOnly && !mitraSelfUpload}
              isCustomCentre={isCustomCentre}
            />
          ) : isVishistView && appliedType !== "daily" ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-gray-700">
                Weekly and monthly attendance is not available for Sathee Vishist.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Select Daily to view the allotted attendance days.
              </p>
            </div>
          ) : (
            <AttendanceTable
              filtered={filtered}
              columnLabel={COLUMN_LABEL[activeTab] || "Day"}
              loading={busy}
            />
          )}
        </div>
      </div>

      {showLeaveModal && mitraSelfUpload ? (
        <ApplyLeaveModal
          userName={userName}
          submitting={submittingLeave}
          onClose={() => {
            if (!submittingLeave) setShowLeaveModal(false);
          }}
          onSubmit={handleApplyLeave}
        />
      ) : null}
    </MainLayout>
  );
}
