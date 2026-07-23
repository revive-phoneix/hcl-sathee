import { downloadTableSvg, downloadTableXlsx } from "./exportTable";

const getStatusLabel = (value) => {
  const num = parseInt(value, 10);
  if (num >= 90) return "Excellent";
  if (num >= 85) return "Good";
  if (num >= 80) return "Average";
  return "Low";
};

const buildAttendanceTable = ({
  records = [],
  columnLabel = "Period",
  activeTab = "daily",
  portalName = "HCL SATHEE",
  selectedDate = null,
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
    row.value,
    getStatusLabel(row.value),
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
    formattedSelectedDate ? `Date ${formattedSelectedDate}` : null,
  ].filter(Boolean);

  return {
    headers,
    rows,
    filename,
    title: titleParts.join(" · "),
    sheetName: "Attendance",
  };
};

export const downloadAttendanceXlsx = (options) => {
  const table = buildAttendanceTable(options);
  downloadTableXlsx(table);
};

export const downloadAttendanceSvg = (options) => {
  const table = buildAttendanceTable(options);
  downloadTableSvg(table);
};
