import { useEffect, useMemo, useState } from "react";

import { MainLayout } from "../../Components/MainLayout";
import TabSelector from "../../Components/Attendance/TabSelector";
import AttendanceToolbar from "../../Components/Attendance/AttendanceToolbar";
import AttendanceTable from "../../Components/Attendance/AttendanceTable";
import SummaryCards from "../../Components/Attendance/SummaryCards";
import SatheeMitraAttendance from "../../Components/Attendance/SatheeMitraAttendance";
import { fetchUsers } from "../../services/users";
import { matchesPortalCentre } from "../../utils/portalMapping";
import {
  downloadAttendanceSvg,
  downloadAttendanceXlsx,
} from "../../utils/exportAttendance";

const ATTENDANCE_BY_TAB = {
  daily: [
    { label: "Monday", value: "91%" },
    { label: "Tuesday", value: "88%" },
    { label: "Wednesday", value: "84%" },
    { label: "Thursday", value: "92%" },
    { label: "Friday", value: "89%" },
    { label: "Saturday", value: "83%" },
    { label: "Sunday", value: "79%" },
  ],
  weekly: [
    { label: "Week 1", value: "89%" },
    { label: "Week 2", value: "87%" },
    { label: "Week 3", value: "90%" },
    { label: "Week 4", value: "85%" },
    { label: "Week 5", value: "88%" },
    { label: "Week 6", value: "91%" },
    { label: "Week 7", value: "86%" },
    { label: "Week 8", value: "93%" },
    { label: "Week 9", value: "84%" },
    { label: "Week 10", value: "88%" },
  ],
  monthly: [
    { label: "January", value: "88%" },
    { label: "February", value: "91%" },
    { label: "March", value: "87%" },
    { label: "April", value: "90%" },
    { label: "May", value: "89%" },
  ],
};

const COLUMN_LABEL = { daily: "Day", weekly: "Week", monthly: "Month" };

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
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

const getWeekdayLabel = (value) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return WEEKDAY_LABELS[date.getDay()];
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
  const [loadingMitras, setLoadingMitras] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isMitraTab = activeTab === "sathee-mitra";
  const tableData = ATTENDANCE_BY_TAB[activeTab] || ATTENDANCE_BY_TAB.daily;

  const filtered = useMemo(() => {
    if (isMitraTab) return [];

    let rows = tableData;

    if (activeTab === "daily" && selectedDate) {
      const weekday = getWeekdayLabel(selectedDate);
      if (weekday) {
        rows = tableData.filter((row) => row.label === weekday);
      }
    }

    const q = search.toLowerCase().trim();
    if (!q) return rows;

    return rows.filter((row) => row.label.toLowerCase().includes(q));
  }, [tableData, activeTab, selectedDate, search, isMitraTab]);

  const centreMitras = useMemo(
    () =>
      mitras.filter(
        (user) =>
          String(user.role || "").toUpperCase() === "SATHEE MITRA" &&
          matchesPortalCentre(user.centre, portalName)
      ),
    [mitras, portalName]
  );

  const loadMitras = async () => {
    setLoadingMitras(true);
    try {
      setMitras(await fetchUsers());
    } catch (error) {
      console.error("Fetch Sathee Mitra error:", error);
      setMitras([]);
    } finally {
      setLoadingMitras(false);
    }
  };

  useEffect(() => {
    loadMitras();
  }, []);

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
        selectedDate: activeTab === "daily" ? selectedDate : null,
      };
      if (format === "xlsx") downloadAttendanceXlsx(payload);
      else downloadAttendanceSvg(payload);
    } catch (error) {
      console.error(`Export attendance ${format.toUpperCase()} error:`, error);
      alert(`Unable to export attendance ${format.toUpperCase()} right now`);
    } finally {
      setExporting(false);
    }
  };

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
              : "View attendance statistics of the entire centre on daily, weekly, and monthly basis."}
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
            }}
            exporting={exporting}
          />

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
              activeTab={activeTab}
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
                  Showing {filtered.length} of {tableData.length} records
                  {activeTab === "daily" ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-medium text-gray-600">
                        {formatDisplayDate(selectedDate)}
                        {getWeekdayLabel(selectedDate)
                          ? ` (${getWeekdayLabel(selectedDate)})`
                          : ""}
                      </span>
                    </>
                  ) : null}
                </>
              )}
            </p>
            <p className="text-xs text-gray-400">
              Last updated: <span className="font-medium text-gray-600">Today, 9:41 AM</span>
            </p>
          </div>
        </div>

        {!isMitraTab ? <SummaryCards activeTab={activeTab} /> : null}
      </div>
    </MainLayout>
  );
}
