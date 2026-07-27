import { WEEKDAYS } from "../../utils/availableDays";

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

function DayToggles({
  mentor,
  disabled = false,
  saving = false,
  onToggleDay,
}) {
  const selected = Array.isArray(mentor.availableDays)
    ? mentor.availableDays
    : [];

  return (
    <div className="flex flex-wrap gap-1.5 min-w-[220px]">
      {WEEKDAYS.map((day) => {
        const active = selected.includes(day);
        return (
          <button
            key={day}
            type="button"
            disabled={disabled || saving}
            title={day}
            onClick={() => onToggleDay?.(mentor, day)}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
              active
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {day.slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
}

export default function TeachersTab({
  mentors = [],
  vishists = [],
  onViewMentor,
  onToggleAvailableDay,
  loading = false,
  error = "",
  readOnly = false,
  savingMentorId = null,
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
          <p className="text-sm text-gray-500">
            Toggle days when each Sathee Mitra (Vishist) is available for special lectures
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#CCD2DD" }}>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">Mentor</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Email</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Centre</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">Days Available</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                    Loading schedule…
                  </td>
                </tr>
              ) : vishists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                    No Sathee Vishist scheduled for this centre.
                  </td>
                </tr>
              ) : (
                vishists.map((mentor, i) => (
                  <tr key={mentor.id} className={`hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-5 py-4">
                      <span
                        className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer underline underline-offset-2"
                        onClick={() => onViewMentor && onViewMentor(mentor)}
                      >
                        {mentor.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-xs">{mentor.email || "—"}</td>
                    <td className="px-4 py-4 font-medium text-gray-700">{mentor.centre}</td>
                    <td className="px-4 py-4 text-gray-700">{mentor.phone || "—"}</td>
                    <td className="px-5 py-4">
                      <DayToggles
                        mentor={mentor}
                        disabled={readOnly}
                        saving={String(savingMentorId) === String(mentor.id)}
                        onToggleDay={onToggleAvailableDay}
                      />
                    </td>
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
