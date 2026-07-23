import { useState } from "react";

export default function MentorDetailsModal({ mentor, open, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(mentor || {});

  if (!open || !mentor) return null;

  const handleSave = () => {
    console.log("Saving mentor details:", formData);
    setIsEditing(false);
  };

  const handleChange = (e, field) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, fontFamily: "Inter, sans-serif"
    }}>
      <div style={{
        background: "#fff", 
        borderRadius: 12, 
        width: "90%", 
        maxWidth: "780px",
        maxHeight: "90vh", 
        overflow: "auto", 
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
          color: "#fff", 
          padding: "24px 28px",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          borderTopLeftRadius: 12, 
          borderTopRightRadius: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#3b82f6", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, fontWeight: 700
            }}>
              {mentor.name.split(" ").pop()[0]}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 26 }}>{mentor.name}</h2>
              <p style={{ margin: "6px 0 0", opacity: 0.9 }}>{mentor.qualification}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ fontSize: 32, color: "#fff", background: "none", border: "none", cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            
            {/* Contact & Location */}
            <div>
              <h3 style={{ 
                fontSize: 17, 
                marginBottom: 12, 
                color: "#1a1f2e", 
                borderBottom: "2px solid #e2e8f0", 
                paddingBottom: 8 
              }}>
                Contact & Location
              </h3>
              <p style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Email:</strong> {isEditing ? (
                  <input 
                    value={formData.email} 
                    onChange={(e) => handleChange(e, 'email')} 
                    style={{width:"100%", padding:"6px", borderRadius:4, border: "1px solid #d1d5db"}} 
                  />
                ) : mentor.email}
              </p>

              <p style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Phone:</strong> {isEditing ? (
                  <input 
                    value={formData.phone} 
                    onChange={(e) => handleChange(e, 'phone')} 
                    style={{width:"100%", padding:"6px", borderRadius:4, border: "1px solid #d1d5db"}} 
                  />
                ) : mentor.phone}
              </p>

              <p style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Centre:</strong> {mentor.centre}
              </p>

              <p style={{ color: "#1f2937" }}>
                <strong>Address:</strong> {isEditing ? (
                  <input 
                    value={formData.address} 
                    onChange={(e) => handleChange(e, 'address')} 
                    style={{width:"100%", padding:"6px", borderRadius:4, border: "1px solid #d1d5db"}} 
                  />
                ) : mentor.address}
              </p>
            </div>

            {/* Professional Details */}
            <div>
              <h3 style={{ 
                fontSize: 17, 
                marginBottom: 12, 
                color: "#1a1f2e", 
                borderBottom: "2px solid #e2e8f0", 
                paddingBottom: 8 
              }}>
                Professional Details
              </h3>
              <p style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Qualification:</strong> {mentor.qualification}
              </p>
              <p style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Experience:</strong> {isEditing ? (
                  <input 
                    value={formData.experience} 
                    onChange={(e) => handleChange(e, 'experience')} 
                    style={{width:"100%", padding:"6px", borderRadius:4, border: "1px solid #d1d5db"}} 
                  />
                ) : mentor.experience}
              </p>
              <p style={{ color: "#1f2937", marginBottom: 8 }}>
                <strong>Specialization:</strong> {mentor.specialization}
              </p>
              <p style={{ color: "#1f2937" }}>
                <strong>Join Date:</strong> {mentor.joinDate}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              style={{ 
                background: isEditing ? "#ef4444" : "#1e40af", 
                color: "#fff", 
                padding: "12px 32px", 
                borderRadius: 8, 
                fontWeight: 600,
                border: "none",
                cursor: "pointer"
              }}
            >
              {isEditing ? "Cancel" : "Add / Edit Details"}
            </button>
            
            {isEditing && (
              <button 
                onClick={handleSave} 
                style={{ 
                  background: "#10b981", 
                  color: "#fff", 
                  padding: "12px 28px", 
                  borderRadius: 8, 
                  fontWeight: 600, 
                  marginLeft: 12,
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}