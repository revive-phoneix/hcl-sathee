import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const getStatusLabel = (value) => {
  const num = parseInt(value, 10);
  if (num >= 90) return "Excellent";
  if (num >= 85) return "Good";
  if (num >= 80) return "Average";
  return "Low";
};

export const downloadAttendancePdf = ({
  records = [],
  columnLabel = "Period",
  activeTab = "daily",
  portalName = "HCL SATHEE",
  selectedDate = null,
}) => {
  const doc = new jsPDF();
  const generatedOn = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const tabTitle =
    activeTab.charAt(0).toUpperCase() + activeTab.slice(1).toLowerCase();

  const formattedSelectedDate = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Attendance Record", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Portal: ${portalName || "HCL SATHEE"}`, 14, 26);
  doc.text(`View: ${tabTitle}`, 14, 32);

  let y = 38;
  if (formattedSelectedDate) {
    doc.text(`Date: ${formattedSelectedDate}`, 14, y);
    y += 6;
  }
  doc.text(`Generated on: ${generatedOn}`, 14, y);
  y += 6;
  doc.text(`Total records: ${records.length}`, 14, y);

  const tableRows = records.map((row, index) => [
    String(index + 1).padStart(2, "0"),
    row.label,
    row.value,
    getStatusLabel(row.value),
  ]);

  autoTable(doc, {
    startY: y + 8,
    head: [["#", columnLabel, "Attendance (%)", "Status"]],
    body: tableRows.length
      ? tableRows
      : [["—", "No records available", "—", "—"]],
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 16, halign: "center" },
      2: { halign: "center" },
      3: { halign: "center" },
    },
  });

  const safePortal = (portalName || "HCL-SATHEE")
    .toString()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  doc.save(`attendance-${activeTab}-${safePortal || "portal"}.pdf`);
};
