import * as XLSX from "xlsx";

/** Build a one-sheet .xlsx from a header row + example rows and download it. */
const downloadSheet = (fileName, sheetName, headers, exampleRows) => {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(12, String(h).length + 3) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
};

/**
 * Weekly grid timetable template: a "Time" column plus one column per weekday.
 * Cells may name the course beside the subject, e.g. "JEE - Physics".
 */
export const downloadTimetableTemplate = () => {
  const headers = [
    "Time",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const rows = [
    ["09:00–10:00", "JEE - Physics", "NEET - Biology", "JEE - Chemistry", "SSC - Reasoning", "JEE - Mathematics", "NEET - Physics"],
    ["10:00–11:00", "JEE - Chemistry", "JEE - Mathematics", "NEET - Physics", "SSC - English", "NEET - Chemistry", "JEE - Physics"],
    ["11:00–11:30", "Lunch Break", "Lunch Break", "Lunch Break", "Lunch Break", "Lunch Break", "Lunch Break"],
    ["11:30–12:30", "NEET - Biology", "JEE - Physics", "SSC - Maths", "JEE - Chemistry", "JEE - Mathematics", "NEET - Biology"],
    ["12:30–01:30", "SSC - GK", "NEET - Chemistry", "JEE - Physics", "NEET - Biology", "SSC - Reasoning", "JEE - Chemistry"],
  ];
  downloadSheet("hcl-sathee-timetable-template.xlsx", "Timetable", headers, rows);
};

/**
 * Monthly teaching-schedule template. One row per topic.
 * Status is Pending / In Progress / Completed; Completion is a 0–100 number.
 */
export const downloadScheduleTemplate = () => {
  const headers = [
    "Subject",
    "Month",
    "Topic",
    "Planned Days",
    "Start Date",
    "End Date",
    "Faculty",
    "Completion",
    "Status",
  ];
  const rows = [
    ["Physics", "September 2026", "Kinematics", 4, "01 Sep", "05 Sep", "Mr. Sharma", 100, "Completed"],
    ["Physics", "September 2026", "Laws of Motion", 5, "06 Sep", "12 Sep", "Mr. Sharma", 40, "In Progress"],
    ["Chemistry", "September 2026", "Mole Concept", 3, "01 Sep", "04 Sep", "Ms. Verma", 0, "Pending"],
    ["Mathematics", "September 2026", "Quadratic Equations", 4, "08 Sep", "13 Sep", "Mr. Rao", 0, "Pending"],
  ];
  downloadSheet("hcl-sathee-schedule-template.xlsx", "Schedule", headers, rows);
};
