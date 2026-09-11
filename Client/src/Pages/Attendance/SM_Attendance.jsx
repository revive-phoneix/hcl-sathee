import AdminAttendance from "./AdminAttendance";

export default function SM_Attendance(props) {
  return (
    <AdminAttendance
      {...props}
      roleLabel="SATHEE MITRA PORTAL"
      showCentreFilter={false}
      showMitraTab
      mitraTabLabel="My Attendance"
      mitraSelfUpload
    />
  );
}
