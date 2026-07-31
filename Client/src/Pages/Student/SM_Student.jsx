import Student from "./Student";

export default function SM_Student(props) {
  return (
    <Student
      {...props}
      roleLabel="Sathee Mitra Portal"
      detailsReadOnly
    />
  );
}
