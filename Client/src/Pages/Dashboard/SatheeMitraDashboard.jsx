import AdminDashboard from "./AdminDashboard";

export default function SatheeMitraDashboard(props) {
  return (
    <AdminDashboard
      {...props}
      roleLabel="SATHEE MITRA PORTAL"
      studentsNavIndex={3}
      attendanceNavIndex={1}
      notificationMessage="Get notified about Announcements by Admins."
    />
  );
}
