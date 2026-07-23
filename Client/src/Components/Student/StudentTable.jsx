import CourseBadge from './CourseBadge';

export default function StudentTable({ paginated, onViewDetails }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
            {["Student Full Name", "Gender", "Centre", "Student ID", "Email Address", "Phone Number", "Course Enrolled"].map(col => (
              <th 
                key={col} 
                style={{ 
                  padding: "14px 20px", 
                  textAlign: "left", 
                  fontSize: 13, 
                  fontWeight: 700, 
                  color: "#374151", 
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>No students found</td></tr>
          ) : (
            paginated.map((s, i) => (
              <tr 
                key={s.id} 
                style={{ 
                  background: i % 2 === 0 ? "#ffffff" : "#f8fafc",
                  borderBottom: "1px solid #f1f5f9"
                }}
              >
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: "50%", 
                      background: s.avatarColor, 
                      color: "#ffffff", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontWeight: 700,
                      fontSize: 14
                    }}>
                      {s.initials}
                    </div>
                    <span 
                      style={{ 
                        fontWeight: 500, 
                        color: "#1e40af", 
                        cursor: "pointer",
                        textDecoration: "underline",
                        textUnderlineOffset: "2px"
                      }}
                      onClick={() => onViewDetails && onViewDetails(s)}
                    >
                      {s.name}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "16px 20px", color: "#374151" }}>{s.gender}</td>
                <td style={{ padding: "16px 20px", color: "#374151" }}>{s.centre}</td>
                <td style={{ padding: "16px 20px", color: "#374151", fontFamily: "monospace" }}>{s.studentId || s.enrollmentNo || s.id}</td>
                <td style={{ padding: "16px 20px", color: "#1e40af" }}>{s.email}</td>
                <td style={{ padding: "16px 20px", color: "#374151" }}>{s.phone}</td>
                <td style={{ padding: "16px 20px" }}>
                  <CourseBadge course={s.course} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}