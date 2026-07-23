export default function CourseBadge({ course }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: "#f0f9ff",
        color: "#1e40af",
        border: "1px solid #bae6fd",
        fontFamily: "Inter, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {course}
    </span>
  );
}