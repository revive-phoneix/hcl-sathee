import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { getCentreValueFromPortal } from "../../utils/portalMapping";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

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
  useEscapeToClose(onClose, open);

  if (!open) return null;

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(await onSubmit?.(form))) return;
    setForm(createEmptyForm(defaultCentre));
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
        {/* Header */}
        <div
          style={{
            padding: "28px 36px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            background:
              "linear-gradient(90deg,#eef2ff 0%,#4f6df5 100%)",
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
              <h2
                style={{
                  margin: 0,
                  fontSize: 38,
                  fontWeight: 700,
                }}
              >
                Add New Student
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#64748b",
                  fontSize: 18,
                }}
              >
                Fill in the student details below
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
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
          {/* First + Last */}
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

          {/* Gender + Course */}
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

          {/* Category (Caste) */}
          <div style={{ marginBottom: 24 }}>
            <SelectField
              label="Category (Caste)"
              value={form.category}
              options={casteCategories}
              onChange={(v) => handleChange("category", v)}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 24 }}>
            <Field
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(v) => handleChange("email", v)}
              placeholder="student@example.com"
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 24 }}>
            <Field
              label="Phone Number"
              value={form.phone}
              onChange={(v) => handleChange("phone", v)}
              placeholder="Enter phone number"
            />
          </div>

          {/* Parents */}
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

          {/* Student ID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 24,
              marginBottom: 36,
            }}
          >
            <Field
              label="Student ID"
              value={form.studentId}
              onChange={(v) => handleChange("studentId", v)}
              placeholder="Enter student ID"
            />
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 16,
            }}
          >
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
                background:
                  "linear-gradient(135deg,#1e40af,#3b82f6)",
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