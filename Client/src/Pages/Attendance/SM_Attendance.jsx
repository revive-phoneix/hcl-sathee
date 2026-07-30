import AdminAttendance from "./AdminAttendance";

/**
 * Sathee Mitra attendance:
 * - Type filters for centre student attendance (no Select Centre)
 * - "My Attendance" for personal arrival/departure photo uploads
 */
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
