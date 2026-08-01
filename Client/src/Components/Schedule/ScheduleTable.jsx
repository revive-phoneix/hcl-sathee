import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";
import { SerialNoCell, SerialNoHeader } from "../common/tableSerial";

const COLUMNS = [
  "Topic",
  "Planned Days",
  "Start Date",
  "End Date",
  "Faculty",
  "Completion",
  "Status",
];

export default function ScheduleTable({ rows }) {
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <p className="text-base font-bold text-gray-800">No topics for this filter</p>
        <p className="text-sm text-gray-500">Try another subject or month.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 flex-1" style={{ minHeight: 0 }}>
      <table className="w-full text-sm border-collapse" style={{ minWidth: "720px" }}>
        <thead>
          <tr style={{ background: "#ccd2dd" }}>
            <SerialNoHeader
              className="px-4 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap rounded-tl-2xl"
            />
            {COLUMNS.map((col, i) => (
              <th
                key={col}
                className={`px-4 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap ${i === COLUMNS.length - 1 ? "rounded-tr-2xl" : ""}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.topic}-${i}`}
              className="border-t border-gray-100 hover:bg-blue-50/50"
              style={{ background: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}
            >
              <SerialNoCell
                index={i}
                className="px-4 py-3.5 text-gray-500 font-semibold tabular-nums whitespace-nowrap"
              />
              <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">{row.topic}</td>
              <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  {row.days} Days
                </span>
              </td>
              <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{row.start}</td>
              <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{row.end}</td>
              <td className="px-4 py-3.5 font-medium text-gray-700 whitespace-nowrap">{row.faculty}</td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <ProgressBar value={row.completion} status={row.status} />
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
