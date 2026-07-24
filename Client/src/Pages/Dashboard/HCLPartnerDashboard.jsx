import AdminDashboard from "./AdminDashboard";

/** HCL Partner dashboard — same as admin, view/export only. */
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
