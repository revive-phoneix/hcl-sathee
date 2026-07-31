import AdminAttendance from "./AdminAttendance";

export default function SM_Attendance(props) {
  return (
    <AdminAttendance
      {...props}
      roleLabel="Sathee Mitra Portal"
      showCentreFilter={false}
      showMitraTab
      mitraTabLabel="My Attendance"
      mitraSelfUpload
    />
  );
}
