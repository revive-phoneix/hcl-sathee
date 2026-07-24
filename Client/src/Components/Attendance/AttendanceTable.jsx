import { getPercentColor, getBarWidth } from "./utils";

const STATUS_STYLES = {
  excellent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  good: "bg-blue-50 text-blue-700 border-blue-200",
  average: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-600 border-red-200",
  none: "bg-slate-50 text-slate-500 border-slate-200",
};

const barColor = (num) => {
  if (num == null) return "bg-slate-300";
  if (num >= 90) return "bg-emerald-500";
  if (num >= 85) return "bg-blue-500";
  if (num >= 80) return "bg-amber-400";
  return "bg-red-400";
};

export default function AttendanceTable({
  filtered = [],
  columnLabel = "Day",
  loading = false,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px]">
        <thead>
          <tr className="bg-[#CCD2DD]">
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
              #
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              {columnLabel}
            </th>
            <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Attendance (%)
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Progress
            </th>
            <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                Loading attendance…
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                No attendance records for this period.
              </td>
            </tr>
          ) : (
            filtered.map((row, i) => {
              const num = row.percent;
              const isEven = i % 2 === 0;
              const statusKey = (row.statusKey || "none").toLowerCase();
              const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.none;
              const displayPercent =
                num == null || Number.isNaN(num) ? "—" : `${Math.round(num)}%`;

              return (
                <tr
                  key={row.id || row.label}
                  className={`group transition-colors duration-100 ${
                    isEven ? "bg-white" : "bg-[#f8f9fb]"
                  } hover:bg-blue-50/40`}
                >
                  <td className="px-6 py-4 text-xs text-gray-400 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {row.label}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        num == null ? "text-slate-400" : getPercentColor(`${num}%`)
                      }`}
                    >
                      {displayPercent}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#e5e7eb] rounded-full overflow-hidden min-w-[80px]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor(num)}`}
                          style={{
                            width: num == null ? "0%" : getBarWidth(`${num}%`),
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle}`}
                    >
                      {row.statusLabel || "—"}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
