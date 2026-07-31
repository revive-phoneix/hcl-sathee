import AdminDashboard from "./AdminDashboard";

export default function SatheeMitraDashboard(props) {
  return (
    <AdminDashboard
      {...props}
      roleLabel="Sathee Mitra Portal"
      studentsNavIndex={3}
      attendanceNavIndex={1}
    />
  );
}
