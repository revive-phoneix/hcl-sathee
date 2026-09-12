import { Trash2 } from "lucide-react";
import CourseBadge from "./CourseBadge";
import { SerialNoCell, SerialNoHeader } from "../common/tableSerial";
import { getCentreId } from "../../utils/centreDirectory";

const TABLE_COLUMNS = [
  "Student Full Name",
  "Gender",
  "Centre",
  "Kendra ID",
  "Student ID",
  "Email Address",
  "Phone Number",
  "Course Enrolled",
  "Actions",
];

// Short, badge-like columns read better centered; everything else stays
// left-aligned with the text it holds.
const CENTERED_COLUMNS = new Set(["Kendra ID", "Actions"]);

const headerStyle = {
  padding: "14px 20px",
  textAlign: "left",
  fontSize: 13,
  fontWeight: 700,
  color: "#374151",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const cellStyle = { padding: "16px 20px", color: "#374151" };
const centerCellStyle = { ...cellStyle, textAlign: "center" };

export default function StudentTable({
  paginated,
  onViewDetails,
  onDeleteStudent,
  readOnly = false,
  serialOffset = 0,
}) {
  const colCount = readOnly ? 9 : 10;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
            <SerialNoHeader
              style={{
                ...headerStyle,
                width: 56,
                textAlign: "center",
              }}
            />
            {(readOnly ? TABLE_COLUMNS.slice(0, 8) : TABLE_COLUMNS).map((col) => (
              <th
                key={col}
                style={{
                  ...headerStyle,
                  ...(CENTERED_COLUMNS.has(col) ? { textAlign: "center" } : {}),
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr>
              <td
                colSpan={colCount}
                style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}
              >
                No students found
              </td>
            </tr>
          ) : (
            paginated.map((s, i) => (
              <tr
                key={s.id}
                style={{
                  background: i % 2 === 0 ? "#ffffff" : "#f8fafc",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <SerialNoCell
                  index={serialOffset + i}
                  style={{ padding: "16px 20px", textAlign: "center", color: "#94a3b8", fontWeight: 600 }}
                />
                <td style={cellStyle}>
                  <span
                    style={{
                      fontWeight: 500,
                      color: "#1e40af",
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                    }}
                    onClick={() => onViewDetails && onViewDetails(s)}
                  >
                    {s.name}
                  </span>
                </td>
                <td style={cellStyle}>{s.gender}</td>
                <td style={cellStyle}>{s.centre}</td>
                <td style={{ ...centerCellStyle, fontFamily: "monospace" }}>
                  {getCentreId(s.centre) ?? "—"}
                </td>
                <td style={{ ...cellStyle, fontFamily: "monospace" }}>
                  {s.studentId || s.enrollmentNo || s.id}
                </td>
                <td style={{ ...cellStyle, color: "#1e40af" }}>{s.email}</td>
                <td style={cellStyle}>{s.phone}</td>
                <td style={cellStyle}>
                  <CourseBadge course={s.course} />
                </td>
                {!readOnly ? (
                  <td style={centerCellStyle}>
                    <button
                      type="button"
                      onClick={() => onDeleteStudent?.(s)}
                      title="Delete student"
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: 4,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#dc2626";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#94a3b8";
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
