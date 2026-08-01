import TableStatusRow from "../common/TableStatusRow";
import { SerialNoCell, SerialNoHeader } from "../common/tableSerial";

const HEADERS = ["Student", "Course", "Subject", "Marks", "Attendance"];

const buildRows = (student) => [
  ...(student.performances?.map((perf) => ({
    type: "performance",
    student,
    subject: perf.subject,
    marks: `${perf.marks}/${perf.maxMarks}`,
    attendance: "—",
  })) || []),
  ...(student.attendances?.map((att) => ({
    type: "attendance",
    student,
    subject: att.subject,
    marks: "—",
    attendance: `D ${att.dailyAttendancePercentage ?? 0}% · W ${att.weeklyAttendancePercentage ?? 0}% · M ${att.monthlyAttendancePercentage ?? 0}% (${att.classesAttended}/${att.totalClasses})`,
  })) || []),
];

export default function StudentPerformanceTable({ students }) {
  const rows = students.flatMap(buildRows);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.05)] bg-[#f8fafc]">
        <h2 className="text-lg font-semibold text-gray-900">Student Performance</h2>
        <p className="text-sm text-gray-500 mt-1">Subject marks and attendance linked to each student.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="bg-white border-b border-[rgba(0,0,0,0.06)]">
              <SerialNoHeader className="px-6 py-4 text-xs font-semibold uppercase text-gray-500" />
              {HEADERS.map((header) => (
                <th
                  key={header}
                  className="px-6 py-4 text-xs font-semibold uppercase text-gray-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <TableStatusRow colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                No performance records available.
              </TableStatusRow>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={`${row.student.id}-${row.type}-${row.subject}-${index}`}
                  className={index % 2 === 0 ? "bg-white" : "bg-[#f8f9fb]"}
                >
                  <SerialNoCell index={index} className="px-6 py-4 text-gray-500 font-medium" />
                  <td className="px-6 py-4 font-medium text-gray-900">{row.student.name}</td>
                  <td className="px-6 py-4 text-gray-600">{row.student.course}</td>
                  <td className="px-6 py-4 text-gray-600">{row.subject}</td>
                  <td className="px-6 py-4 text-gray-600">{row.marks}</td>
                  <td className="px-6 py-4 text-gray-600">{row.attendance}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
