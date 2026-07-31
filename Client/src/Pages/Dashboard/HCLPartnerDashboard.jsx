import AdminDashboard from "./AdminDashboard";

export default function HCLPartnerDashboard(props) {
  return (
    <AdminDashboard
      {...props}
      readOnly
      roleLabel="Partner Portal"
      studentsNavIndex={3}
      attendanceNavIndex={1}
    />
  );
}
