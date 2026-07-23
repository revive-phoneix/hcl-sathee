import { Search, RefreshCw, UserPlus, ChevronDown } from "lucide-react";

export default function StudentToolbar({ 
  search, 
  onSearch, 
  courseFilter, 
  onCourseChange, 
  onRefresh,
  onAddStudent,
}) {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 10, 
      padding: "16px 20px", 
      borderBottom: "1px solid #e2e8f0", 
      flexWrap: "wrap", 
      background: "#fff" 
    }}>
      
      {/* Search Input */}
      <div style={{ position: "relative", flex: "1 1 260px", minWidth: 200 }}>
        <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          type="text"
          placeholder="Search by student name, Centre or Course..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ 
            width: "100%", 
            paddingLeft: 36, 
            paddingRight: 12, 
            paddingTop: 9, 
            paddingBottom: 9, 
            borderRadius: 8, 
            border: "1px solid #e2e8f0", 
            background: "#f8fafc", 
            fontSize: 13, 
            color: "#000000",
            outline: "none" 
          }}
        />
      </div>

      {/* Course Dropdown */}
      <div style={{ position: "relative" }}>
        <select 
          value={courseFilter} 
          onChange={(e) => onCourseChange(e.target.value)} 
          style={{ 
            appearance: "none", 
            padding: "9px 32px 9px 12px", 
            borderRadius: 8, 
            border: "1px solid #e2e8f0", 
            background: "#f8fafc", 
            fontSize: 13, 
            color: "#000000",
            cursor: "pointer" 
          }}
        >
          <option>All Courses</option>
          {["JEE-Exams","NEET","SSC","CLAT","IBPS","ICAR","CUET","RRB"].map(c => 
            <option key={c}>{c}</option>
          )}
        </select>
        <ChevronDown 
          size={14} 
          color="#94a3b8" 
          style={{ 
            position: "absolute", 
            right: 10, 
            top: "50%", 
            transform: "translateY(-50%)", 
            pointerEvents: "none" 
          }} 
        />
      </div>

      {/* Refresh Button */}
      <button 
        onClick={onRefresh} 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 6, 
          padding: "9px 14px", 
          borderRadius: 8, 
          border: "1px solid #e2e8f0", 
          background: "#f8fafc", 
          color: "#000000",
          fontSize: 13, 
          cursor: "pointer" 
        }}
      >
        <RefreshCw size={14} /> Refresh
      </button>

      {/* Add Student Button */}
      <button
        type="button"
        onClick={onAddStudent}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "9px 16px",
          borderRadius: 8,
          border: "none",
          background: "linear-gradient(135deg,#1e40af,#3b82f6)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          marginLeft: "auto",
          cursor: "pointer",
        }}
      >
        <UserPlus size={15} />
        Add Student
      </button>
    </div>
  );
}