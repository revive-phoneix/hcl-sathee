import { useEffect, useState } from "react";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

export default function StudentDetailsModal({ student, open, onClose, onSave, readOnly = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  useEscapeToClose(onClose, open);

  useEffect(() => {
    if (student) {
      setFormData({
        ...student,
        parents: { ...(student.parents || {}) },
        marks: { ...(student.marks || {}) },
        attendance: { ...(student.attendance || {}) },
        qualifications: { ...(student.qualifications || {}) },
      });
      setIsEditing(false);
    }
  }, [student]);

  if (!open || !student || !formData) return null;

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
    setIsEditing(false);
  };

  const updateForm = (field, value, section = null) => {
    setFormData((prev) =>
      section
        ? { ...prev, [section]: { ...prev[section], [field]: value } }
        : { ...prev, [field]: value }
    );
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      fontFamily: "Inter, sans-serif"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        width: "90%",
        maxWidth: "820px",
        maxHeight: "92vh",
        overflow: "auto",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
          color: "#fff",
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: student.avatarColor, color: "#ffffff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 22
            }}>
              {student.initials}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24 }}>{student.name}</h2>
              <p style={{ margin: "4px 0 0", opacity: 0.9 }}>
                {student.id || student.Student_ID || student.enrollmentNo} • {student.course}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#fff", fontSize: 28, cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "28px" }}>
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16, color: "#1a1f2e", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
              Basic Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, color: "black" }}>
              <Field label="Name" value={formData.name} editable={isEditing} onChange={(value) => updateForm("name", value)} />
              <Field label="Student ID" value={formData.id || formData.Student_ID || formData.enrollmentNo} editable={isEditing} onChange={(value) => updateForm("id", value)} />
              <Field label="Gender" value={formData.gender} editable={isEditing} onChange={(value) => updateForm("gender", value)} />
              <Field label="Course" value={formData.course} editable={isEditing} onChange={(value) => updateForm("course", value)} />
              <Field label="Category (Caste)" value={formData.category} editable={isEditing} onChange={(value) => updateForm("category", value)} />
              <Field label="Email" value={formData.email} editable={isEditing} onChange={(value) => updateForm("email", value)} type="email" />
              <Field label="Phone" value={formData.phone} editable={isEditing} onChange={(value) => updateForm("phone", value)} type="tel" />
              <Field label="Centre" value={formData.centre} editable={isEditing} onChange={(value) => updateForm("centre", value)} />
              <Field label="Student ID" value={formData.Student_ID} editable={isEditing} onChange={(value) => updateForm("Student_ID", value)} />
              <Field label="Address" value={formData.address} editable={isEditing} onChange={(value) => updateForm("address", value)} />
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16, color: "#1a1f2e", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
              Parents Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, color: "black" }}>
              <div>
                <strong>Father</strong>
                {isEditing ? (
                  <input type="text" value={formData.parents?.father || ""} onChange={(e) => updateForm("father", e.target.value, "parents")} style={{ width: "100%", padding: "8px", marginTop: 6, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                ) : (
                  <div style={{ marginTop: 6 }}>{formData.parents?.father || "—"}</div>
                )}
                <div style={{ marginTop: 10 }}>
                  <strong>Phone</strong>
                  {isEditing ? (
                    <input type="tel" value={formData.parents?.fatherPhone || ""} onChange={(e) => updateForm("fatherPhone", e.target.value, "parents")} style={{ width: "100%", padding: "8px", marginTop: 6, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  ) : (
                    <div style={{ marginTop: 6 }}>{formData.parents?.fatherPhone || "—"}</div>
                  )}
                </div>
              </div>
              <div>
                <strong>Mother</strong>
                {isEditing ? (
                  <input type="text" value={formData.parents?.mother || ""} onChange={(e) => updateForm("mother", e.target.value, "parents")} style={{ width: "100%", padding: "8px", marginTop: 6, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                ) : (
                  <div style={{ marginTop: 6 }}>{formData.parents?.mother || "—"}</div>
                )}
                <div style={{ marginTop: 10 }}>
                  <strong>Phone</strong>
                  {isEditing ? (
                    <input type="tel" value={formData.parents?.motherPhone || ""} onChange={(e) => updateForm("motherPhone", e.target.value, "parents")} style={{ width: "100%", padding: "8px", marginTop: 6, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  ) : (
                    <div style={{ marginTop: 6 }}>{formData.parents?.motherPhone || "—"}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16, color: "#1a1f2e", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
              Current Performance (Marks)
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, color: "black" }}>
              {Object.entries(formData.marks || {}).map(([subject, score]) => (
                <div key={subject} style={{ background: "#E0F2FE", padding: "12px 16px", borderRadius: 8 }}>
                  <strong>{subject}</strong>
                  {isEditing ? (
                    <input type="text" value={score} onChange={(e) => updateForm(subject, e.target.value, "marks")} style={{ width: "100%", padding: "8px", marginTop: 6, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  ) : (
                    <div style={{ marginTop: 6 }}>{score}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16, color: "#1a1f2e", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
              Attendance
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, color: "black" }}>
              {Object.entries(formData.attendance || {}).map(([cls, rate]) => (
                <div key={cls} style={{ background: "#E0F2FE", padding: "12px 16px", borderRadius: 8 }}>
                  <strong>{cls}</strong>
                  {isEditing ? (
                    <input type="text" value={rate} onChange={(e) => updateForm(cls, e.target.value, "attendance")} style={{ width: "100%", padding: "8px", marginTop: 6, borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  ) : (
                    <div style={{ marginTop: 6 }}>{rate}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            {!readOnly ? (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    background: isEditing ? "#ef4444" : "#1e40af",
                    color: "#fff",
                    border: "none",
                    padding: "12px 32px",
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginRight: 12
                  }}
                >
                  {isEditing ? "Cancel" : "Edit Details"}
                </button>

                {isEditing && (
                  <button
                    onClick={handleSave}
                    style={{
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      padding: "12px 28px",
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Save Changes
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onClose}
                style={{
                  background: "#1e40af",
                  color: "#fff",
                  border: "none",
                  padding: "12px 32px",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, editable, onChange, type = "text" }) {
  return (
    <div>
      <strong>{label}</strong>
      {editable ? (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: 6, borderRadius: 6, border: "1px solid #cbd5e1" }}
        />
      ) : (
        <div style={{ marginTop: 6 }}>{value || "—"}</div>
      )}
    </div>
  );
}
