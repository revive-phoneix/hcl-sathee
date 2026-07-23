function attendanceBadge(val) {
  if (val == null) return "bg-gray-100 text-gray-600 border border-gray-200";
  if (val >= 95) return "bg-green-100 text-green-700 border border-green-200";
  if (val >= 85) return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  return "bg-red-100 text-red-700 border border-red-200";
}

const mentorInitial = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts[parts.length - 1][0].toUpperCase();
};

export default function TeachersTab({
  mentors = [],
  onViewMentor,
  loading = false,
  error = "",
}) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Mentors Overview</h2>
          <p className="text-sm text-gray-500">
            Sathee Mitra directory with last 7 days attendance
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#CCD2DD" }}>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">Mentor</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Role</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Centre</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Email</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">Attendance (7d)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                    Loading mentors…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : mentors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                    No Sathee Mitra found for this centre.
                  </td>
                </tr>
              ) : (
                mentors.map((mentor, i) => (
                  <tr key={mentor.id} className={`hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                          {mentorInitial(mentor.name)}
                        </div>
                        <span
                          className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer underline underline-offset-2"
                          onClick={() => onViewMentor && onViewMentor(mentor)}
                        >
                          {mentor.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-blue-700">{mentor.subject || "Sathee Mitra"}</td>
                    <td className="px-4 py-4 font-medium text-gray-700">{mentor.centre}</td>
                    <td className="px-4 py-4 text-gray-500 text-xs">{mentor.email}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${attendanceBadge(mentor.attendance)}`}>
                        {mentor.attendance == null ? "—" : `${mentor.attendance}%`}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">SATHEE Vishist Schedule</h2>
          <p className="text-sm text-gray-500">Mentors assigned to this centre</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#CCD2DD" }}>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">Mentor</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Role</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Centre</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                    Loading schedule…
                  </td>
                </tr>
              ) : mentors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                    No mentors scheduled for this centre.
                  </td>
                </tr>
              ) : (
                mentors.map((mentor, i) => (
                  <tr key={mentor.id} className={`hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-5 py-4">
                      <span
                        className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer underline underline-offset-2"
                        onClick={() => onViewMentor && onViewMentor(mentor)}
                      >
                        {mentor.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-blue-700">{mentor.subject || "Sathee Mitra"}</td>
                    <td className="px-4 py-4 font-medium text-gray-700">{mentor.centre}</td>
                    <td className="px-4 py-4 text-gray-700">{mentor.phone || "—"}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-700">{mentor.joinDate || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
