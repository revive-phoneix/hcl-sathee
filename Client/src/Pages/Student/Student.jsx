import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "../../Components/MainLayout";
import { matchesPortalCentre } from "../../utils/portalMapping";

import StudentToolbar from "../../Components/Student/StudentToolbar";
import StudentTable from "../../Components/Student/StudentTable";
import NewStudent from "../../Components/Student/NewStudent";
import StudentDetailsModal from "../../Components/Student/StudentDetailsModal";
import { fetchStudents, createStudent, removeStudent } from "../../services/students";
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
  detailsReadOnly = false,
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
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [studentsError, setStudentsError] = useState("");

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
        address: student.address?.trim() || "",
        parents: {
          father: student.fatherName?.trim() || "",
          fatherPhone: student.fatherPhone?.trim() || "",
          mother: student.motherName?.trim() || "",
          motherPhone: student.motherPhone?.trim() || "",
        },
        subjects: student.subjects || [],
        marks: student.marks || {},
        attendance: student.attendance || {},
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

  const handleDeleteStudent = (student) => {
    setStudentsError("");
    setStudentToDelete(student);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    setDeletingStudent(true);
    setStudentsError("");

    try {
      await removeStudent(studentToDelete.id);
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
      if (selectedStudent?.id === studentToDelete.id) {
        setShowStudentDetails(false);
        setSelectedStudent(null);
      }
      setStudentToDelete(null);
    } catch (error) {
      console.error("Delete Student Error:", error);
      setStudentsError(getApiErrorMessage(error, "Unable to delete the student right now"));
      setStudentToDelete(null);
    } finally {
      setDeletingStudent(false);
    }
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

  const totalStudents = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startCount = totalStudents === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endCount = Math.min(currentPage * PAGE_SIZE, totalStudents);

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
            onAddStudent={() => setShowNewStudent(true)}
            readOnly={readOnly}
          />

          {studentsError ? (
            <div
              style={{
                margin: "0 20px 12px",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: 14,
              }}
            >
              {studentsError}
            </div>
          ) : null}

          <StudentTable
            paginated={paginated}
            readOnly={readOnly}
            serialOffset={(currentPage - 1) * PAGE_SIZE}
            onViewDetails={(student) => {
              setSelectedStudent(student);
              setShowStudentDetails(true);
            }}
            onDeleteStudent={readOnly ? undefined : handleDeleteStudent}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "14px 20px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
              flexWrap: "wrap",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              Showing {startCount}-{endCount} of {totalStudents} students
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                style={{
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: currentPage <= 1 ? "#94a3b8" : "#334155",
                  background: "#fff",
                  cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                  opacity: currentPage <= 1 ? 0.6 : 1,
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                style={{
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: currentPage >= totalPages ? "#94a3b8" : "#334155",
                  background: "#fff",
                  cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                  opacity: currentPage >= totalPages ? 0.6 : 1,
                }}
              >
                Next
              </button>
            </div>
          </div>
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
          readOnly={readOnly || detailsReadOnly}
          onSave={readOnly || detailsReadOnly ? undefined : handleUpdateStudent}
          onClose={() => {
            setShowStudentDetails(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {studentToDelete ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 24,
              background: "#fff",
              padding: 32,
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
              Delete Student?
            </h3>
            <p style={{ margin: "12px 0 0", fontSize: 14, color: "#64748b" }}>
              Are you sure you want to delete the student{" "}
              <strong style={{ color: "#0f172a" }}>{studentToDelete.name}</strong>?
            </p>
            <div
              style={{
                marginTop: 28,
                display: "flex",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                disabled={deletingStudent}
                style={{
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  padding: "10px 22px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#334155",
                  background: "#fff",
                  cursor: deletingStudent ? "not-allowed" : "pointer",
                  opacity: deletingStudent ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                disabled={deletingStudent}
                style={{
                  borderRadius: 16,
                  border: "none",
                  padding: "10px 22px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  background: "#dc2626",
                  cursor: deletingStudent ? "not-allowed" : "pointer",
                  opacity: deletingStudent ? 0.6 : 1,
                }}
              >
                {deletingStudent ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}
