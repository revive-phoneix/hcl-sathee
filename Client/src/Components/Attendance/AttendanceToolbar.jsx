import { Search, Calendar, RefreshCw } from "lucide-react";
import ExportDropdown from "../common/ExportDropdown";

const DATE_TABS = new Set(["daily", "weekly", "monthly", "sathee-mitra"]);

export default function AttendanceToolbar({
  search,
  setSearch,
  activeTab,
  selectedDate,
  onDateChange,
  onExportXlsx,
  onExportSvg,
  onRefresh,
  exporting = false,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search attendance records…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-[#f5f6f8] rounded-lg text-sm text-gray-700 placeholder-gray-400 border border-transparent focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        {DATE_TABS.has(activeTab) && (
          <label className="relative inline-flex items-center cursor-pointer">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange?.(e.target.value)}
              className="pl-8 pr-3 py-2 bg-[#f5f6f8] rounded-lg text-sm text-gray-600 border border-transparent focus:outline-none focus:border-blue-400 focus:bg-white transition-colors cursor-pointer min-w-[160px]"
              aria-label="Select attendance date"
            />
          </label>
        )}

        <ExportDropdown
          exporting={exporting}
          onExportXlsx={onExportXlsx}
          onExportSvg={onExportSvg}
        />

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f5f6f8] text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
    </div>
  );
}
