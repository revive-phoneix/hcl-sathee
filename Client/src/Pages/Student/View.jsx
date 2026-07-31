import Student from "./Student";

export default function View(props) {
  return <Student {...props} readOnly roleLabel="Partner Portal" />;
}
