import AdminDashboard from "./AdminDashboard";

/** Sathee Mitra dashboard — admin layout without Users; can edit schedule/timetable. */
export default function SatheeMitraDashboard(props) {
  return (
    <AdminDashboard
      {...props}
      readOnly={false}
      roleLabel="Sathee Mitra Portal"
      studentsNavIndex={3}
      attendanceNavIndex={1}
    />
  );
}
