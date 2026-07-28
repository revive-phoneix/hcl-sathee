import { useState } from "react";
import { Plus, Eye } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import Schedule from "./Schedule";
import TimeTable from "./TimeTable";

export function QuickActions({
  onViewStudents,
  onViewAttendance,
  readOnly = false,
  portalName = "",
}) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);

  const quickActions = [
    {
      icon: readOnly ? Eye : Plus,
      label: readOnly ? "View Students" : "Add Students",
      color: "text-blue-400",
      bg: "hover:bg-blue-500/10 hover:border-blue-500/30",
      onClick: onViewStudents,
    },
    {
      icon: Eye,
      label: "View Attendance",
      color: "text-emerald-400",
      bg: "hover:bg-emerald-500/10 hover:border-emerald-500/30",
      onClick: onViewAttendance,
    },
    {
      icon: Eye,
      label: "View Timetable",
      color: "text-violet-400",
      bg: "hover:bg-violet-500/10 hover:border-violet-500/30",
      onClick: () => setIsTimetableOpen(true),
    },
    {
      icon: Eye,
      label: "View Schedule",
      color: "text-pink-400",
      bg: "hover:bg-pink-500/10 hover:border-pink-500/30",
      onClick: () => setIsScheduleOpen(true),
    },
  ];

  return (
    <>
      <div className="bg-[#ccd2dd] border border-[#3B82F6]/20 rounded-3xl px-6 py-5 w-fit mx-auto">
        <SectionHeader title="Quick Actions" />

        <div className="grid grid-cols-4 gap-3 mt-5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`w-25 h-25 flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#040b15] bg-[#82adea] hover:border-[#3B82F6]/40 transition-all duration-200 group ${action.bg}`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#0F172A] group-hover:scale-110 transition-transform">
                <action.icon size={20} className={action.color} />
              </div>
              <span className="text-sm font-medium text-black text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isScheduleOpen && (
        <Schedule
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          readOnly={readOnly}
          portalName={portalName}
        />
      )}

      {isTimetableOpen && (
        <TimeTable
          isOpen={isTimetableOpen}
          onClose={() => setIsTimetableOpen(false)}
          readOnly={readOnly}
          portalName={portalName}
        />
      )}
    </>
  );
}
