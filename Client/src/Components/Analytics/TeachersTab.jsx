function attendanceBadge(val) {
  if (val >= 95) return "bg-green-100 text-green-700 border border-green-200";
  if (val >= 85) return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  return "bg-red-100 text-red-700 border border-red-200";
}

export default function TeachersTab({ mentors = [], onViewMentor }) {
  return (
    <div className="space-y-8">
      {/* Mentors Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Mentors Overview</h2>
          <p className="text-sm text-gray-500">Faculty directory with attendance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#CCD2DD" }}>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">Mentor</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Subject</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Centre</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Email</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {mentors.map((mentor, i) => (
                <tr key={mentor.id} className={`hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {mentor.name.split(" ").pop()[0]}
                      </div>
                      <span 
                        className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer underline underline-offset-2"
                        onClick={() => onViewMentor && onViewMentor(mentor)}
                      >
                        {mentor.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-blue-700">{mentor.subject}</td>
                  <td className="px-4 py-4 font-medium text-gray-700">{mentor.centre}</td>
                  <td className="px-4 py-4 text-gray-500 text-xs">{mentor.email}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${attendanceBadge(mentor.attendance)}`}>
                      {mentor.attendance}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SATHEE Vishist Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">SATHEE Vishist Schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#CCD2DD" }}>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">Mentor</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Subject</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Centre</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Days</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">Time</th>
              </tr>
            </thead>
            <tbody>
              {mentors.map((mentor, i) => (
                <tr key={mentor.id} className={`hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-5 py-4">
                    <span 
                      className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer underline underline-offset-2"
                      onClick={() => onViewMentor && onViewMentor(mentor)}
                    >
                      {mentor.name}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-medium text-blue-700">{mentor.subject}</td>
                  <td className="px-4 py-4 font-medium text-gray-700">{mentor.centre}</td>
                  <td className="px-4 py-4 text-blue-700 font-bold">Mon, Wed, Fri</td>
                  <td className="px-5 py-4 whitespace-nowrap text-blue-700 font-bold">10:00 AM – 1:00 PM</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}