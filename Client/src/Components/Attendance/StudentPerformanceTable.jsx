export default function StudentPerformanceTable({ students }) {
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
              <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">Student</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">Course</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">Subject</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">Marks</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  No performance records available.
                </td>
              </tr>
            ) : (
              students.flatMap((student) => {
                const performanceRows = student.performances?.map((perf) => ({
                  type: "performance",
                  student,
                  subject: perf.subject,
                  marks: `${perf.marks}/${perf.maxMarks}`,
                  attendance: "—",
                })) || [];

                const attendanceRows = student.attendances?.map((att) => ({
                  type: "attendance",
                  student,
                  subject: att.subject,
                  marks: "—",
                  attendance: `D ${att.dailyAttendancePercentage ?? 0}% · W ${att.weeklyAttendancePercentage ?? 0}% · M ${att.monthlyAttendancePercentage ?? 0}% (${att.classesAttended}/${att.totalClasses})`,
                })) || [];

                return [...performanceRows, ...attendanceRows];
              }).map((row, index) => (
                <tr
                  key={`${row.student.id}-${row.type}-${row.subject}-${index}`}
                  className={index % 2 === 0 ? "bg-white" : "bg-[#f8f9fb]"}
                >
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
