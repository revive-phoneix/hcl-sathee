import { useState } from "react";
import { SectionHeader } from "./SectionHeader";

const averageAttendanceByPeriod = {
  daily: 84.2,
  weekly: 82.6,
  monthly: 83.4,
};

const periodOptions = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

export function AttendanceChart() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const averageAttendance = averageAttendanceByPeriod[selectedPeriod];

  return (
    <div className="bg-[#ccd2dd] border border-black rounded-3xl p-6 h-[420px] flex flex-col overflow-hidden">

      <SectionHeader
        title="Average Attendance - Centre"
      />

      <div className="mt-5 flex flex-wrap gap-2">
        {periodOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setSelectedPeriod(option.key)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${selectedPeriod === option.key
                ? "border-blue-500/60 bg-blue-500/15 text-red-500"
                : "border-[#334155] bg-[#ccd2dd] text-black hover:border-[#3B82F6]/40 hover:text-white"
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[#3B82F6]/20 bg-[#b6caf1] p-6 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-black">
          {selectedPeriod} average attendance
        </p>
        <p className="mt-3 text-5xl font-bold tracking-tight text-black">
          {averageAttendance}%
        </p>
        <p className="mt-2 text-sm text-black">
          Whole centre attendance average for the selected period.
        </p>
      </div>
    </div>
  );
}
