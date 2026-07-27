import { WEEKDAYS } from "../../utils/availableDays";
import TableStatusRow from "../common/TableStatusRow";
import {
  attendanceBadge,
  mentorInitial,
  tableHeadRowClass,
  zebraRowClass,
} from "./analyticsUi";

function DayToggles({ mentor, disabled = false, saving = false, onToggleDay }) {
  const selected = Array.isArray(mentor.availableDays) ? mentor.availableDays : [];

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

function MentorNameLink({ mentor, onViewMentor, withAvatar = false }) {
  const name = (
    <span
      className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer underline underline-offset-2"
      onClick={() => onViewMentor?.(mentor)}
    >
      {mentor.name}
    </span>
  );

  if (!withAvatar) return name;

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
        {mentorInitial(mentor.name)}
      </div>
      {name}
    </div>
  );
}

function MentorTableSection({ title, subtitle, headers, colSpan, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={tableHeadRowClass}>
              {headers.map(({ label, className }) => (
                <th key={label} className={className}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children({ colSpan })}</tbody>
        </table>
      </div>
    </div>
  );
}

const OVERVIEW_HEADERS = [
  { label: "Mentor", className: "text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase" },
  { label: "Role", className: "text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase" },
  { label: "Centre", className: "text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase" },
  { label: "Email", className: "text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase" },
  { label: "Attendance (7d)", className: "text-center px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase" },
];

const VISHIST_HEADERS = [
  { label: "Mentor", className: "text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase" },
  { label: "Email", className: "text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase" },
  { label: "Centre", className: "text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase" },
  { label: "Phone", className: "text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase" },
  { label: "Days Available", className: "text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase" },
];

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
      <MentorTableSection
        title="Mentors Overview"
        subtitle="Sathee Mitra directory with last 7 days attendance"
        headers={OVERVIEW_HEADERS}
        colSpan={5}
      >
        {({ colSpan }) =>
          loading ? (
            <TableStatusRow colSpan={colSpan}>Loading mentors…</TableStatusRow>
          ) : error ? (
            <TableStatusRow colSpan={colSpan} className="px-5 py-10 text-center text-sm text-red-500">
              {error}
            </TableStatusRow>
          ) : mentors.length === 0 ? (
            <TableStatusRow colSpan={colSpan}>
              No Sathee Mitra found for this centre.
            </TableStatusRow>
          ) : (
            mentors.map((mentor, i) => (
              <tr key={mentor.id} className={zebraRowClass(i)}>
                <td className="px-5 py-4">
                  <MentorNameLink mentor={mentor} onViewMentor={onViewMentor} withAvatar />
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
          )
        }
      </MentorTableSection>

      <MentorTableSection
        title="SATHEE Vishist Schedule"
        subtitle="Toggle days when each Sathee Mitra (Vishist) is available for special lectures"
        headers={VISHIST_HEADERS}
        colSpan={5}
      >
        {({ colSpan }) =>
          loading ? (
            <TableStatusRow colSpan={colSpan}>Loading schedule…</TableStatusRow>
          ) : vishists.length === 0 ? (
            <TableStatusRow colSpan={colSpan}>
              No Sathee Vishist scheduled for this centre.
            </TableStatusRow>
          ) : (
            vishists.map((mentor, i) => (
              <tr key={mentor.id} className={zebraRowClass(i)}>
                <td className="px-5 py-4">
                  <MentorNameLink mentor={mentor} onViewMentor={onViewMentor} />
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
          )
        }
      </MentorTableSection>
    </div>
  );
}
