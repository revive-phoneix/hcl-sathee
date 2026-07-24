import { useEffect, useState } from "react";
import { updateUser } from "../../services/users";
import { WEEKDAYS, formatAvailableDays } from "../../utils/availableDays";

export default function MentorDetailsModal({
  mentor,
  open,
  onClose,
  readOnly = false,
  onUpdated,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(mentor || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData(mentor || {});
    setIsEditing(false);
    setError("");
  }, [mentor, open]);

  if (!open || !mentor) return null;

  const toggleDay = (day) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.availableDays) ? prev.availableDays : [];
      const has = current.includes(day);
      return {
        ...prev,
        availableDays: has
          ? current.filter((d) => d !== day)
          : [...current, day],
      };
    });
  };

  const handleSave = async () => {
    const days = Array.isArray(formData.availableDays)
      ? formData.availableDays
      : [];

    if (days.length === 0) {
      setError("Select at least one available day");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await updateUser(mentor.id, {
        availableDays: days,
        phone: formData.phone || mentor.phone,
      });
      onUpdated?.({
        ...mentor,
        availableDays: updated.availableDays || days,
        phone: updated.phone || formData.phone,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Update mentor error:", err);
      setError(err.response?.data?.message || "Unable to save mentor details");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e, field) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const initial =
    String(mentor.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .pop()?.[0]
      ?.toUpperCase() || "?";

  const displayDays = isEditing
    ? formData.availableDays
    : mentor.availableDays;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "90%",
          maxWidth: "780px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            color: "#fff",
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#3b82f6",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {initial}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 26 }}>{mentor.name}</h2>
              <p style={{ margin: "6px 0 0", opacity: 0.9 }}>
                {mentor.qualification || "Sathee Mitra"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              fontSize: 32,
              color: "#fff",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "28px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: 17,
                  marginBottom: 12,
                  color: "#1a1f2e",
                  borderBottom: "2px solid #e2e8f0",
                  paddingBottom: 8,
                }}
              >
                Contact & Location
              </h3>
              <p style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Email:</strong> {mentor.email || "—"}
              </p>

              <p style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Phone:</strong>{" "}
                {isEditing ? (
                  <input
                    value={formData.phone || ""}
                    onChange={(e) => handleChange(e, "phone")}
                    style={{
                      width: "100%",
                      padding: "6px",
                      borderRadius: 4,
                      border: "1px solid #d1d5db",
                    }}
                  />
                ) : (
                  mentor.phone || "—"
                )}
              </p>

              <p style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Centre:</strong> {mentor.centre || "—"}
              </p>

              <p style={{ color: "#1f2937" }}>
                <strong>Address:</strong> {mentor.address || "—"}
              </p>
            </div>

            <div>
              <h3
                style={{
                  fontSize: 17,
                  marginBottom: 12,
                  color: "#1a1f2e",
                  borderBottom: "2px solid #e2e8f0",
                  paddingBottom: 8,
                }}
              >
                Professional Details
              </h3>
              <p style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Role:</strong> {mentor.qualification || "Sathee Mitra"}
              </p>
              <p style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Attendance (7d):</strong>{" "}
                {mentor.attendance == null ? "—" : `${mentor.attendance}%`}
              </p>
              <div style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Days Available:</strong>
                {isEditing ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    {WEEKDAYS.map((day) => {
                      const selected = (formData.availableDays || []).includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: selected
                              ? "1px solid #059669"
                              : "1px solid #e5e7eb",
                            background: selected ? "#059669" : "#fff",
                            color: selected ? "#fff" : "#374151",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ marginLeft: 6 }}>
                    {formatAvailableDays(displayDays)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {error ? (
            <p
              style={{
                marginTop: 16,
                color: "#b91c1c",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
              }}
            >
              {error}
            </p>
          ) : null}

          <div style={{ textAlign: "center", marginTop: 32 }}>
            {!readOnly ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setError("");
                    setFormData(mentor || {});
                  }}
                  disabled={saving}
                  style={{
                    background: isEditing ? "#ef4444" : "#1e40af",
                    color: "#fff",
                    padding: "12px 32px",
                    borderRadius: 8,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {isEditing ? "Cancel" : "Edit Days Available"}
                </button>

                {isEditing && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      background: "#10b981",
                      color: "#fff",
                      padding: "12px 28px",
                      borderRadius: 8,
                      fontWeight: 600,
                      marginLeft: 12,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onClose}
                style={{
                  background: "#1e40af",
                  color: "#fff",
                  padding: "12px 32px",
                  borderRadius: 8,
                  fontWeight: 600,
                  border: "none",
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
