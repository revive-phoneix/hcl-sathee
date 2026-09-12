import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MARGIN = 40;
const INK = [15, 23, 42];
const MUTED = [100, 116, 139];
const ACCENT = [29, 78, 216];
const HEAD_FILL = [30, 64, 175];

const ensureSpace = (doc, y, needed = 40) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
};

const setText = (doc, [r, g, b]) => doc.setTextColor(r, g, b);

const addSectionHeading = (doc, text, y, number) => {
  y = ensureSpace(doc, y, 34);
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  setText(doc, INK);
  doc.text(`${number}. ${text}`, MARGIN, y);
  doc.setFont(undefined, "normal");
  return y + 16;
};

const addCourseHeading = (doc, text, y) => {
  y = ensureSpace(doc, y, 26);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  setText(doc, ACCENT);
  doc.text(text, MARGIN, y);
  doc.setFont(undefined, "normal");
  setText(doc, INK);
  return y + 14;
};

const addSubHeading = (doc, text, y) => {
  y = ensureSpace(doc, y, 24);
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  setText(doc, INK);
  doc.text(text, MARGIN, y);
  doc.setFont(undefined, "normal");
  return y + 12;
};

const addNote = (doc, text, y) => {
  y = ensureSpace(doc, y, 20);
  doc.setFontSize(9);
  setText(doc, MUTED);
  doc.text(text, MARGIN, y);
  setText(doc, INK);
  return y + 16;
};

const addLabel = (doc, text, y) => {
  y = ensureSpace(doc, y, 18);
  doc.setFontSize(9);
  doc.setFont(undefined, "italic");
  setText(doc, MUTED);
  doc.text(text, MARGIN, y);
  doc.setFont(undefined, "normal");
  setText(doc, INK);
  return y + 10;
};

const addTable = (doc, y, { head, body }) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  y = ensureSpace(doc, y, 40);
  autoTable(doc, {
    head: [head],
    body,
    startY: y,
    margin: { left: MARGIN, right: MARGIN, top: MARGIN },
    tableWidth: pageWidth - MARGIN * 2,
    styles: { fontSize: 8, cellPadding: 4, textColor: INK },
    headStyles: { fillColor: HEAD_FILL, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  return doc.lastAutoTable.finalY + 16;
};

/** One "Managed by: Name (email · phone)" line per Sathee Mitra — no table. */
const addManagedByLine = (doc, y, mitra) => {
  y = ensureSpace(doc, y, 16);
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  const label = "Managed by: ";
  doc.text(label, MARGIN, y);
  const labelWidth = doc.getTextWidth(label);
  doc.setFont(undefined, "normal");
  const details = [mitra.email, mitra.phone].filter(Boolean).join(" · ");
  doc.text(`${mitra.name || "—"}${details ? ` (${details})` : ""}`, MARGIN + labelWidth, y);
  return y + 14;
};

const addManagedBySection = (doc, y, rows) => {
  if (!rows.length) return addNote(doc, "No Sathee Mitra found for this centre.", y);
  for (const mitra of rows) y = addManagedByLine(doc, y, mitra);
  return y + 6;
};

/** "List of Sathee Vishist" — a small Name/Email table, no attendance figures. */
const addVishistSection = (doc, y, rows) => {
  y = addSubHeading(doc, "List of Sathee Vishist", y);
  if (!rows.length) return addNote(doc, "No Sathee Vishist found for this centre.", y);
  return addTable(doc, y, {
    head: ["Name", "Email"],
    body: rows.map((r) => [r.name || "—", r.email || "—"]),
  });
};

const marksTables = (doc, y, tables, fallbackLabel) => {
  tables.forEach((table, index) => {
    const label = table.test.name || `${fallbackLabel} ${index + 1}`;
    y = addLabel(doc, table.test.testDate ? `${label} — ${table.test.testDate}` : label, y);
    y = addTable(doc, y, {
      head: ["Student", ...table.subjects],
      body: table.rows.map((row) => [row.student.name, ...row.cells]),
    });
  });
  return y;
};

/**
 * Renders the exact same data shown on screen (report.performanceByCourse /
 * report.attendanceByCourse, per-student 0/0 and 0% defaults already baked
 * in) into a paginated PDF, with Sathee Mitra / Vishist sections optionally
 * prepended — the heading numbers shift accordingly.
 */
export const buildCentreReportPdf = ({
  centreValue,
  centreId,
  place,
  address,
  dateLabel,
  periodLabel, // "Weekly" | "Monthly"
  courses,
  performanceByCourse,
  attendanceByCourse,
  includeMitra,
  mitraRows,
  includeVishist,
  vishistRows,
}) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  setText(doc, INK);
  doc.text(`${periodLabel.toUpperCase()} REPORT — ${centreValue}`, pageWidth / 2, 50, {
    align: "center",
  });
  doc.setFont(undefined, "normal");

  let leftY = 78;
  doc.setFontSize(10);
  [
    `Centre: ${centreValue}`,
    `Centre ID: ${centreId ?? "—"}`,
    `Place: ${place ?? "—"}`,
    `Address: ${address ?? "—"}`,
  ].forEach((line) => {
    doc.text(line, MARGIN, leftY);
    leftY += 14;
  });
  doc.text(dateLabel, pageWidth - MARGIN, 78, { align: "right" });

  let y = leftY + 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y - 12, pageWidth - MARGIN, y - 12);

  let headingNumber = 1;

  if (includeMitra) {
    y = addSectionHeading(doc, "Sathee Mitra", y, headingNumber++);
    y = addManagedBySection(doc, y, mitraRows) + 4;
  }

  if (includeVishist) {
    y = addSectionHeading(doc, "Sathee Vishist", y, headingNumber++);
    y = addVishistSection(doc, y, vishistRows) + 4;
  }

  y = addSectionHeading(doc, "Performance", y, headingNumber++);
  for (const course of courses) {
    y = addCourseHeading(doc, course, y);
    const perf = performanceByCourse[course];

    y = addSubHeading(doc, "Performance Test", y);
    y = perf.performance.length
      ? marksTables(doc, y, perf.performance, "Week")
      : addNote(doc, "No performance tests recorded for this period.", y);

    if (periodLabel === "Monthly") {
      y = addSubHeading(doc, "Pre-Mid Test", y);
      y = perf.preMid.length
        ? marksTables(doc, y, perf.preMid, "Pre-Mid Test")
        : addNote(doc, "No pre-mid test recorded for this period.", y);
    }
    y += 4;
  }

  y = addSectionHeading(doc, "Attendance", y, headingNumber);
  for (const course of courses) {
    y = addCourseHeading(doc, course, y);
    const rows = attendanceByCourse[course] || [];
    y = rows.length
      ? addTable(doc, y, {
          head: ["Student", "Student ID", "Attendance %"],
          body: rows.map((r) => [
            r.student.name,
            r.student.studentId || r.student.enrollmentNo || r.student.id,
            `${r.percentage}%`,
          ]),
        })
      : addNote(doc, "No students in this course.", y);
    y += 4;
  }

  return doc;
};
