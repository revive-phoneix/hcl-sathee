import AdminAttendance from "./AdminAttendance";

/** HCL Partner attendance — view & export only (no Mitra photo uploads). */
export default function HCLPartnerAttendance(props) {
  return <AdminAttendance {...props} readOnly roleLabel="Partner Portal" />;
}
