import { useEffect, useMemo, useState } from "react";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";
import {
  isOptionalPhone10,
  isValidPhone10,
  sanitizePhoneInput,
} from "../../utils/phone";
import { average, parsePercentValue } from "../../utils/studentMetrics";
import { resolveEnrolledSubjects } from "../../utils/courseSubjects";

export default function StudentDetailsModal({ student, open, onClose, onSave, readOnly = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState("");
  useEscapeToClose(onClose, open);

  useEffect(() => {
    if (student) {
      const subjects = resolveEnrolledSubjects(student.course, student.subjects);
      const marks = {};
      const attendance = {};
      for (const subject of subjects) {
        marks[subject] = Number(student.marks?.[subject]) || 0;
        attendance[subject] = Number(student.attendance?.[subject]) || 0;
      }
      setFormData({
        ...student,
        subjects,
        parents: { ...(student.parents || {}) },
        marks,
        attendance,
        qualifications: { ...(student.qualifications || {}) },
      });
      setIsEditing(false);
      setError("");
    }
  }, [student]);

  const enrolledSubjects = useMemo(
    () =>
      formData
        ? resolveEnrolledSubjects(formData.course, formData.subjects)
        : [],
    [formData]
  );

  const overallAttendance = useMemo(() => {
    if (!formData) return null;
    const map = formData.attendance || {};
    const rates = enrolledSubjects
      .map((subject) => parsePercentValue(map[subject]))
      .filter((rate) => rate != null);
    const avg = average(rates);
    return avg == null ? null : Math.round(avg * 10) / 10;
  }, [formData, enrolledSubjects]);

  if (!open || !student || !formData) return null;

  const handleSave = () => {
    if (formData.phone && !isValidPhone10(formData.phone)) {
      setError("Student phone number must be exactly 10 digits");
      return;
    }
    if (
      !isOptionalPhone10(formData.parents?.fatherPhone) ||
      !isOptionalPhone10(formData.parents?.motherPhone)
    ) {
      setError("Parent phone numbers must be exactly 10 digits (or left blank)");
      return;
    }
    setError("");
    if (onSave) {
      onSave({
        ...formData,
        marks: student.marks || formData.marks,
        attendance: student.attendance || formData.attendance,
      });
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
                {student.studentId || student.enrollmentNo || student.id} • {student.course}
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
              <Field
                label="Student ID"
                value={formData.studentId || formData.enrollmentNo || ""}
                editable={isEditing}
                onChange={(value) => updateForm("studentId", value)}
              />
              <Field label="Gender" value={formData.gender} editable={isEditing} onChange={(value) => updateForm("gender", value)} />
              <Field label="Course" value={formData.course} editable={isEditing} onChange={(value) => updateForm("course", value)} />
              <Field label="Category (Caste)" value={formData.category} editable={isEditing} onChange={(value) => updateForm("category", value)} />
              <Field label="Email" value={formData.email} editable={isEditing} onChange={(value) => updateForm("email", value)} type="email" />
              <Field
                label="Phone"
                value={formData.phone}
                editable={isEditing}
                onChange={(value) => updateForm("phone", sanitizePhoneInput(value))}
                type="tel"
                maxLength={10}
              />
              <Field label="Centre" value={formData.centre} editable={isEditing} onChange={(value) => updateForm("centre", value)} />
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
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.parents?.fatherPhone || ""}
                      onChange={(e) =>
                        updateForm("fatherPhone", sanitizePhoneInput(e.target.value), "parents")
                      }
                      style={{ width: "100%", padding: "8px", marginTop: 6, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
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
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.parents?.motherPhone || ""}
                      onChange={(e) =>
                        updateForm("motherPhone", sanitizePhoneInput(e.target.value), "parents")
                      }
                      style={{ width: "100%", padding: "8px", marginTop: 6, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  ) : (
                    <div style={{ marginTop: 6 }}>{formData.parents?.motherPhone || "—"}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8, color: "#1a1f2e", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
              Current Performance (Marks)
            </h3>
            <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 13 }}>
              Auto-updated from tests/exams — not editable.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, color: "black" }}>
              {enrolledSubjects.length === 0 ? (
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>No subjects yet.</p>
              ) : (
                enrolledSubjects.map((subject) => (
                  <div key={subject} style={{ background: "#E0F2FE", padding: "12px 16px", borderRadius: 8 }}>
                    <strong>{subject}</strong>
                    <div style={{ marginTop: 6 }}>{formData.marks?.[subject] ?? 0}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8, color: "#1a1f2e", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
              Attendance
            </h3>
            <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 13 }}>
              Auto-updated from daily class status — not editable.
            </p>
            <div
              style={{
                background: "#dbeafe",
                border: "1px solid #93c5fd",
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                color: "#0f172a",
              }}
            >
              <div>
                <strong style={{ fontSize: 15 }}>Overall Attendance</strong>
                <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                  Average of all subject attendance
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1e40af" }}>
                {overallAttendance == null ? "—" : `${overallAttendance}%`}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, color: "black" }}>
              {enrolledSubjects.length === 0 ? (
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>No subjects yet.</p>
              ) : (
                enrolledSubjects.map((cls) => {
                  const rate = formData.attendance?.[cls];
                  return (
                    <div key={cls} style={{ background: "#E0F2FE", padding: "12px 16px", borderRadius: 8 }}>
                      <strong>{cls}</strong>
                      <div style={{ marginTop: 6 }}>{typeof rate === "number" ? `${rate}%` : rate ?? "0%"}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            {error ? (
              <p style={{ color: "#b91c1c", marginBottom: 12, fontSize: 14 }}>{error}</p>
            ) : null}
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

function Field({ label, value, editable, onChange, type = "text", maxLength }) {
  return (
    <div>
      <strong>{label}</strong>
      {editable ? (
        <input
          type={type}
          inputMode={type === "tel" ? "numeric" : undefined}
          maxLength={maxLength}
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
