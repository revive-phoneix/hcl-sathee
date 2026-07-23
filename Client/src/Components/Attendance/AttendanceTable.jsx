import { getPercentColor, getBarWidth } from "./utils";

export default function AttendanceTable({ filtered, columnLabel }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px]">
        <thead>
          <tr className="bg-[#CCD2DD]">
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">#</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{columnLabel}</th>
            <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Attendance (%)</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Progress</th>
            <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                No records match your search.
              </td>
            </tr>
          ) : (
            filtered.map((row, i) => {
              const num = parseInt(row.value);
              const isEven = i % 2 === 0;
              const statusLabel = num >= 90 ? "Excellent" : num >= 85 ? "Good" : num >= 80 ? "Average" : "Low";
              const statusStyle =
                num >= 90
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : num >= 85
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : num >= 80
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-600 border-red-200";

              return (
                <tr
                  key={row.label}
                  className={`group transition-colors duration-100 ${isEven ? "bg-white" : "bg-[#f8f9fb]"} hover:bg-blue-50/40`}
                >
                  <td className="px-6 py-4 text-xs text-gray-400 tabular-nums">{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{row.label}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-semibold tabular-nums ${getPercentColor(row.value)}`}>
                      {row.value}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#e5e7eb] rounded-full overflow-hidden min-w-[80px]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            num >= 90 ? "bg-emerald-500" : num >= 85 ? "bg-blue-500" : num >= 80 ? "bg-amber-400" : "bg-red-400"
                          }`}
                          style={{ width: getBarWidth(row.value) }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle}`}>
                      {statusLabel}
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