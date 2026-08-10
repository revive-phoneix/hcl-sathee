import { useEffect, useMemo, useState } from "react";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";
import {
  isOptionalPhone10,
  isValidPhone10,
  sanitizePhoneInput,
} from "../../utils/phone";
import { average, parsePercentValue } from "../../utils/studentMetrics";
import { resolveEnrolledSubjects } from "../../utils/courseSubjects";
import StudentAnalyticsPanel from "./StudentAnalyticsPanel";

export default function StudentDetailsModal({ student, open, onClose, onSave, readOnly = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
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
      setShowAnalytics(false);
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

  const handleSave = async () => {
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
    if (!onSave) return;

    setSaving(true);
    try {
      const success = await onSave({
        ...formData,
        marks: student.marks || formData.marks,
        attendance: student.attendance || formData.attendance,
      });
      if (success) {
        setIsEditing(false);
      }
    } catch (saveError) {
      setError(saveError?.message || "Unable to save student details. Please try again.");
    } finally {
      setSaving(false);
    }
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
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setShowAnalytics(false)}
              style={{
                background: showAnalytics ? "#e2e8f0" : "#1e40af",
                color: showAnalytics ? "#0f172a" : "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Student Details
            </button>
            <button
              type="button"
              onClick={() => setShowAnalytics(true)}
              style={{
                background: showAnalytics ? "#1e40af" : "#e2e8f0",
                color: showAnalytics ? "#fff" : "#0f172a",
                border: "none",
                padding: "10px 18px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View Analytics
            </button>
          </div>

          {showAnalytics ? (
            <div style={{ marginBottom: 32 }}>
              <StudentAnalyticsPanel student={formData} />
            </div>
          ) : (
            <>
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
                
                {/* Overall Performance */}
                {formData.overallPercentage != null && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #86efac",
                      borderRadius: 10,
                      padding: "14px 18px",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      color: "#0f172a",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 15 }}>Overall Performance</strong>
                      <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                        Average of all subject test percentages
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#16a34a" }}>
                      {formData.overallPercentage.toFixed(1)}%
                    </div>
                  </div>
                )}

                {/* Subject-wise Percentages */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, color: "black" }}>
                  {enrolledSubjects.length === 0 ? (
                    <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>No subjects yet.</p>
                  ) : (
                    enrolledSubjects.map((subject) => {
                      const percentage = formData.subjectPercentages?.[subject];
                      const hasPercentage = percentage != null && percentage !== 0;
                      
                      return (
                        <div key={subject} style={{ 
                          background: hasPercentage ? "#E0F2FE" : "#f3f4f6", 
                          padding: "12px 16px", 
                          borderRadius: 8 
                        }}>
                          <strong>{subject}</strong>
                          <div style={{ marginTop: 6, fontSize: 14 }}>
                            {hasPercentage ? (
                              <>
                                <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                                  {percentage.toFixed(1)}%
                                </span>
                                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                  Test Performance
                                </div>
                              </>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>No test data</span>
                            )}
                          </div>
                        </div>
                      );
                    })
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
            </>
          )}

          <div style={{ textAlign: "center", marginTop: 32 }}>
            {error ? (
              <p style={{ color: "#b91c1c", marginBottom: 12, fontSize: 14 }}>{error}</p>
            ) : null}
            {showAnalytics ? (
              <button
                type="button"
                onClick={() => setShowAnalytics(false)}
                style={{
                  background: "#64748b",
                  color: "#fff",
                  border: "none",
                  padding: "12px 28px",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginRight: 12,
                }}
              >
                Back to Details
              </button>
            ) : !readOnly ? (
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
                    disabled={saving}
                    style={{
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      padding: "12px 28px",
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.75 : 1,
                    }}
                  >
                    {saving ? "Saving…" : "Save Changes"}
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
