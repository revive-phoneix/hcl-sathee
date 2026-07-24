import AdminAnnouncements from "./AdminAnnouncements";

/** HCL Partner announcements — view only (no create/edit/delete). */
export default function HCLPartnerAnnouncements(props) {
  return <AdminAnnouncements {...props} readOnly roleLabel="Partner Portal" />;
}
