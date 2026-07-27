import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "../../Components/MainLayout";
import { matchesPortalCentre } from "../../utils/portalMapping";

import StudentToolbar from "../../Components/Student/StudentToolbar";
import StudentTable from "../../Components/Student/StudentTable";
import NewStudent from "../../Components/Student/NewStudent";
import StudentDetailsModal from "../../Components/Student/StudentDetailsModal";
import { fetchStudents, createStudent } from "../../services/students";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { AVATAR_COLORS, getInitials } from "../../utils/studentMetrics";

const PAGE_SIZE = 8;

export default function Student({
  portalName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  readOnly = false,
  roleLabel = "Admin Portal",
}) {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [showNewStudent, setShowNewStudent] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [page, setPage] = useState(1);
  const [students, setStudents] = useState([]);
  const [submittingStudent, setSubmittingStudent] = useState(false);
  const [createStudentError, setCreateStudentError] = useState("");

  const handleAddStudent = async (student) => {
    setSubmittingStudent(true);
    setCreateStudentError("");

    const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();

    try {
      const created = await createStudent({
        studentId: student.studentId?.trim() || `STU${Date.now().toString().slice(-6)}`,
        enrollmentNo: student.enrollmentNo?.trim() || `ENR${Date.now().toString().slice(-6)}`,
        name: fullName || "New Student",
        gender: student.gender || "Male",
        email: student.email || "",
        phone: student.phone || "",
        centre: student.centreName || "Unknown Centre",
        course: student.course || "JEE",
        category: student.category || "General",
        address: "Added from admin portal",
        parents: {
          father: student.fatherName?.trim() || "",
          fatherPhone: student.fatherPhone?.trim() || "",
          mother: student.motherName?.trim() || "",
          motherPhone: student.motherPhone?.trim() || "",
        },
        marks: {},
        attendance: {},
        qualifications: {},
        avatarColor: AVATAR_COLORS[students.length % AVATAR_COLORS.length],
        initials: getInitials(fullName, "ST"),
      });

      setStudents((prev) => [created, ...prev]);
      setPage(1);
      return true;
    } catch (error) {
      console.error("Add Student Error:", error);
      setCreateStudentError(getApiErrorMessage(error, "Unable to add student"));
      return false;
    } finally {
      setSubmittingStudent(false);
    }
  };

  const handleUpdateStudent = (updatedStudent) => {
    setStudents((prev) =>
      prev.map((student) => (student.id === updatedStudent.id ? updatedStudent : student))
    );
    setSelectedStudent(updatedStudent);
  };

  const loadStudents = async () => {
    try {
      setStudents(await fetchStudents());
    } catch (error) {
      console.error("Fetch Students Error:", error);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((student) => {
      if (!matchesPortalCentre(student.centre, portalName)) return false;
      if (courseFilter !== "All Courses" && student.course !== courseFilter) return false;
      if (!search) return true;
      return (
        student.name.toLowerCase().includes(q) ||
        String(student.id || "").toLowerCase().includes(q) ||
        (student.enrollmentNo || "").toLowerCase().includes(q) ||
        (student.centre || "").toLowerCase().includes(q) ||
        (student.course || "").toLowerCase().includes(q)
      );
    });
  }, [search, courseFilter, students, portalName]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      roleLabel={roleLabel}
    >
      <div style={{ minHeight: "100vh", fontFamily: "Inter, sans-serif", background: "#f5f7fa", padding: "28px 28px 40px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1f2e", margin: 0 }}>Students</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            {readOnly
              ? "View student records, enrollment details, and assigned batches."
              : "Manage student records, enrollment details, and assigned batches."}
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <StudentToolbar
            search={search}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            courseFilter={courseFilter}
            onCourseChange={(val) => {
              setCourseFilter(val);
              setPage(1);
            }}
            onRefresh={() => {
              setSearch("");
              setCourseFilter("All Courses");
              setPage(1);
              loadStudents();
            }}
            onAddStudent={() => setShowNewStudent(true)}
            readOnly={readOnly}
          />

          <StudentTable paginated={paginated} onViewDetails={(student) => {
            setSelectedStudent(student);
            setShowStudentDetails(true);
          }} />
        </div>
      </div>

      {!readOnly ? (
        <NewStudent
          open={showNewStudent}
          onClose={() => {
            setShowNewStudent(false);
            setCreateStudentError("");
          }}
          onSubmit={handleAddStudent}
          error={createStudentError}
          submitting={submittingStudent}
          portalName={portalName}
        />
      ) : null}

      {showStudentDetails && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          open={showStudentDetails}
          readOnly={readOnly}
          onSave={readOnly ? undefined : handleUpdateStudent}
          onClose={() => {
            setShowStudentDetails(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </MainLayout>
  );
}
