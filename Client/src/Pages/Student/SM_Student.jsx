import Student from "./Student";

/** Sathee Mitra students — same capabilities as admin. */
export default function SM_Student(props) {
  return <Student {...props} roleLabel="Sathee Mitra Portal" />;
}
