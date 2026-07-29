import AdminAnnouncements from "./AdminAnnouncements";

/** Sathee Mitra announcements — view only (no create/edit/delete). */
export default function SatheeMitraAnnouncements(props) {
  return <AdminAnnouncements {...props} readOnly roleLabel="Sathee Mitra Portal" />;
}
