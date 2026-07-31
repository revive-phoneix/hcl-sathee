import { useEffect, useMemo, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { getCentreValueFromPortal } from "../../utils/portalMapping";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";
import {
  buildMarksAndAttendance,
  getCourseSubjectConfig,
  validateSubjectSelection,
} from "../../utils/courseSubjects";

const courses = ["JEE", "NEET", "CLAT", "SSC", "IBPS", "RRB", "ICAR", "CUET"];
const casteCategories = ["General", "OBC", "SC", "ST", "EWS"];

const createEmptyForm = (centre) => ({
  studentId: "",
  firstName: "",
  lastName: "",
  gender: "Male",
  email: "",
  phone: "",
  centreName: centre,
  centreId: centre,
  course: "JEE",
  category: "General",
  fatherName: "",
  fatherPhone: "",
  motherName: "",
  motherPhone: "",
});

export default function NewStudent({ open, onClose, onSubmit, error, submitting, portalName }) {
  const defaultCentre = getCentreValueFromPortal(portalName) || "HCL RAJASTHAN";
  const [form, setForm] = useState(() => createEmptyForm(defaultCentre));
  const [choiceSubjects, setChoiceSubjects] = useState([]);
  const [subjectError, setSubjectError] = useState("");
  useEscapeToClose(onClose, open);

  const subjectConfig = useMemo(() => getCourseSubjectConfig(form.course), [form.course]);

  useEffect(() => {
    setChoiceSubjects([]);
    setSubjectError("");
  }, [form.course]);

  const selectedSubjects = useMemo(() => {
    if (!subjectConfig) return [];
    return [...subjectConfig.compulsory, ...choiceSubjects];
  }, [subjectConfig, choiceSubjects]);

  const { marks, attendance } = useMemo(
    () => buildMarksAndAttendance(selectedSubjects),
    [selectedSubjects]
  );

  if (!open) return null;

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleChoiceSubject = (subject) => {
    if (!subjectConfig || subjectConfig.choiceMode === "none") return;

    setSubjectError("");
    setChoiceSubjects((prev) => {
      const isSelected = prev.includes(subject);

      if (subjectConfig.choiceMode === "exactlyOne") {
        return isSelected ? [] : [subject];
      }

      if (isSelected) {
        return prev.filter((item) => item !== subject);
      }

      if (prev.length >= subjectConfig.maxChoice) {
        setSubjectError(
          `You can select at most ${subjectConfig.maxChoice} optional subject${
            subjectConfig.maxChoice === 1 ? "" : "s"
          }.`
        );
        return prev;
      }

      return [...prev, subject];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateSubjectSelection(form.course, selectedSubjects);
    if (!validation.ok) {
      setSubjectError(validation.message);
      return;
    }

    const payload = {
      ...form,
      subjects: selectedSubjects,
      marks,
      attendance,
    };

    if (!(await onSubmit?.(payload))) return;
    setForm(createEmptyForm(defaultCentre));
    setChoiceSubjects([]);
    setSubjectError("");
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 25px 60px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            padding: "28px 36px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            background: "linear-gradient(90deg,#eef2ff 0%,#4f6df5 100%)",
          }}
        >
          <div style={{ display: "flex", gap: 18 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                background: "#dbeafe",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <UserPlus size={30} color="#1d4ed8" />
            </div>

            <div>
              <h2 style={{ margin: 0, fontSize: 38, fontWeight: 700 }}>Add New Student</h2>
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 18 }}>
                Fill in the student details below
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", cursor: "pointer" }}
          >
            <X size={30} color="#64748b" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="new-student-form" style={{ padding: 36 }}>
          <FormStyles />
          {error ? (
            <div
              style={{
                marginBottom: 24,
                padding: "16px 18px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: 12,
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <Field
              label="First Name"
              value={form.firstName}
              onChange={(v) => handleChange("firstName", v)}
              placeholder="Enter first name"
            />
            <Field
              label="Last Name"
              value={form.lastName}
              onChange={(v) => handleChange("lastName", v)}
              placeholder="Enter last name"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <SelectField
              label="Gender"
              value={form.gender}
              options={["Male", "Female", "Other"]}
              onChange={(v) => handleChange("gender", v)}
            />
            <SelectField
              label="Course Enrolled"
              value={form.course}
              options={courses}
              onChange={(v) => handleChange("course", v)}
            />
          </div>

          {subjectConfig ? (
            <div style={{ marginBottom: 28 }}>
              <SectionTitle>Subjects</SectionTitle>
              <p style={{ margin: "0 0 14px", color: "#64748b", fontSize: 14 }}>
                {subjectConfig.hint}
              </p>

              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Compulsory
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {subjectConfig.compulsory.map((subject) => (
                    <SubjectChip
                      key={subject}
                      label={subject}
                      checked
                      locked
                    />
                  ))}
                </div>
              </div>

              {subjectConfig.choice.length > 0 ? (
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#475569",
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    Choice{" "}
                    <span style={{ fontWeight: 500, textTransform: "none", color: "#64748b" }}>
                      ({choiceSubjects.length}
                      {subjectConfig.choiceMode === "exactlyOne"
                        ? "/1"
                        : `/${subjectConfig.maxChoice}`}{" "}
                      selected)
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {subjectConfig.choice.map((subject) => (
                      <SubjectChip
                        key={subject}
                        label={subject}
                        checked={choiceSubjects.includes(subject)}
                        onToggle={() => toggleChoiceSubject(subject)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {subjectError ? (
                <div
                  style={{
                    marginTop: 14,
                    padding: "12px 14px",
                    background: "#fff7ed",
                    color: "#9a3412",
                    borderRadius: 10,
                    border: "1px solid #fed7aa",
                    fontSize: 14,
                  }}
                >
                  {subjectError}
                </div>
              ) : null}
            </div>
          ) : null}

          <div style={{ marginBottom: 24 }}>
            <SelectField
              label="Category (Caste)"
              value={form.category}
              options={casteCategories}
              onChange={(v) => handleChange("category", v)}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Field
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(v) => handleChange("email", v)}
              placeholder="student@example.com"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Field
              label="Phone Number"
              value={form.phone}
              onChange={(v) => handleChange("phone", v)}
              placeholder="Enter phone number"
            />
          </div>

          <div
            style={{
              marginBottom: 16,
              fontWeight: 700,
              color: "#1e3a5f",
              fontSize: 16,
            }}
          >
            Parents Information
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <Field
              label="Father's Name"
              value={form.fatherName}
              onChange={(v) => handleChange("fatherName", v)}
              placeholder="Enter father's name"
            />
            <Field
              label="Father's Phone"
              value={form.fatherPhone}
              onChange={(v) => handleChange("fatherPhone", v)}
              placeholder="Enter father's phone"
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <Field
              label="Mother's Name"
              value={form.motherName}
              onChange={(v) => handleChange("motherName", v)}
              placeholder="Enter mother's name"
            />
            <Field
              label="Mother's Phone"
              value={form.motherPhone}
              onChange={(v) => handleChange("motherPhone", v)}
              placeholder="Enter mother's phone"
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <Field
              label="Student ID"
              value={form.studentId}
              onChange={(v) => handleChange("studentId", v)}
              placeholder="Enter student ID"
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <SectionTitle>Current Performance (Marks)</SectionTitle>
            {selectedSubjects.length === 0 ? (
              <EmptyHint text="Select a course (and optional subjects if required) to see marks fields." />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                {selectedSubjects.map((subject) => (
                  <MetricCard key={`marks-${subject}`} title={subject} value={`${marks[subject]}`} />
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 36 }}>
            <SectionTitle>Attendance</SectionTitle>
            {selectedSubjects.length === 0 ? (
              <EmptyHint text="Selected subjects will appear here with 0% attendance initially." />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                {selectedSubjects.map((subject) => (
                  <MetricCard
                    key={`att-${subject}`}
                    title={subject}
                    value={`${attendance[subject]}%`}
                  />
                ))}
              </div>
            )}
            <p style={{ margin: "12px 0 0", color: "#64748b", fontSize: 13 }}>
              Attendance starts at 0% and updates each day from class status.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 22px",
                borderRadius: 10,
                border: "1px solid #D1D5DB",
                background: "#FFFFFF",
                color: "#374151",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 26px",
                borderRadius: 10,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                color: "#fff",
                fontWeight: 600,
                opacity: submitting ? 0.7 : 1,
                background: "linear-gradient(135deg,#1e40af,#3b82f6)",
              }}
            >
              {submitting ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3
      style={{
        fontSize: 18,
        margin: "0 0 12px",
        color: "#1a1f2e",
        borderBottom: "2px solid #e2e8f0",
        paddingBottom: 8,
        fontWeight: 700,
      }}
    >
      {children}
    </h3>
  );
}

function EmptyHint({ text }) {
  return <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>{text}</p>;
}

function MetricCard({ title, value }) {
  return (
    <div style={{ background: "#E0F2FE", padding: "12px 16px", borderRadius: 8 }}>
      <strong style={{ color: "#0f172a" }}>{title}</strong>
      <div style={{ marginTop: 6, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function SubjectChip({ label, checked, locked = false, onToggle }) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 10,
        border: checked ? "1px solid #93c5fd" : "1px solid #dbe3ef",
        background: locked ? "#f1f5f9" : checked ? "#eff6ff" : "#fff",
        color: "#0f172a",
        cursor: locked ? "not-allowed" : "pointer",
        opacity: locked ? 0.95 : 1,
        userSelect: "none",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={() => onToggle?.()}
        style={{ width: 16, height: 16, cursor: locked ? "not-allowed" : "pointer" }}
      />
      {label}
      {locked ? (
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>(locked)</span>
      ) : null}
    </label>
  );
}

function FormStyles() {
  return (
    <style>{`
      .new-student-form input::placeholder { color: #000000; opacity: 1; }
      .new-student-form select, .new-student-form option { color: #000000; background: #ffffff; }
      .new-student-form input:focus, .new-student-form select:focus { outline: none; border-color: #3b82f6; }
    `}</style>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", readOnly = false }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 10, fontWeight: 600, color: "#1e3a5f" }}>
        {label}
      </label>
      <input
        type={type}
        readOnly={readOnly}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: "100%",
          padding: "14px 18px",
          borderRadius: 12,
          border: "1px solid #dbe3ef",
          background: readOnly ? "#f8fafc" : "#fff",
          color: "#000000",
          fontSize: 15,
          boxSizing: "border-box",
          outline: "none",
        }}
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 10, fontWeight: 600, color: "#1e3a5f" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "14px 18px",
          borderRadius: 12,
          border: "1px solid #dbe3ef",
          background: "#fff",
          fontSize: 15,
          boxSizing: "border-box",
        }}
      >
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}
