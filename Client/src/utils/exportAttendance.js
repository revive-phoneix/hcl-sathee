import { downloadTableSvg, downloadTableXlsx } from "./exportTable";

const buildAttendanceTable = ({
  records = [],
  columnLabel = "Period",
  activeTab = "daily",
  portalName = "HCL SATHEE",
  selectedDate = null,
  periodLabel = null,
}) => {
  const tabTitle =
    activeTab.charAt(0).toUpperCase() + activeTab.slice(1).toLowerCase();

  const formattedSelectedDate = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const headers = ["#", columnLabel, "Attendance (%)", "Status"];
  const rows = records.map((row, index) => [
    String(index + 1).padStart(2, "0"),
    row.label,
    row.value ??
      (row.percent == null || Number.isNaN(row.percent)
        ? "—"
        : `${Math.round(row.percent)}%`),
    row.statusLabel || "—",
  ]);

  const safePortal = (portalName || "HCL-SATHEE")
    .toString()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const filename = `attendance-${activeTab}-${safePortal || "portal"}`;
  const titleParts = [
    "Attendance Record",
    portalName,
    tabTitle,
    periodLabel || (formattedSelectedDate ? `Date ${formattedSelectedDate}` : null),
  ].filter(Boolean);

  return {
    headers,
    rows,
    filename,
    title: titleParts.join(" · "),
    sheetName: "Attendance",
  };
};

const downloadAttendance = (download, options) => download(buildAttendanceTable(options));

export const downloadAttendanceXlsx = (options) =>
  downloadAttendance(downloadTableXlsx, options);

export const downloadAttendanceSvg = (options) =>
  downloadAttendance(downloadTableSvg, options);
