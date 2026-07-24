import Student from "./Student";

/** HCL Partner students — view only (no add/edit). */
export default function View(props) {
  return <Student {...props} readOnly roleLabel="Partner Portal" />;
}
