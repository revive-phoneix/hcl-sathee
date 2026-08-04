import AdminAttendance from "./AdminAttendance";

export default function HCLPartnerAttendance(props) {
  return (
    <AdminAttendance
      {...props}
      readOnly
      roleLabel="Partner Portal"
      showCentreFilter={false}
      showMitraTab={false}
    />
  );
}
