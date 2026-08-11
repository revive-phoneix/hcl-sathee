import { useMemo } from "react";
import { SectionHeader } from "./SectionHeader";
import { getCourseExamProgress } from "../../utils/studentMetrics";

export function ExamProgress({ students = [], loading = false }) {
  const examProgress = useMemo(
    () => getCourseExamProgress(students),
    [students]
  );

  return (
    <div className="bg-[#ccd2dd] border border-[#3B82F6]/20 rounded-3xl p-6 flex flex-col overflow-visible">
      <SectionHeader title="Batch Exam Progress" />

      <div className="space-y-5 mt-4">
        {loading ? (
          <p className="text-sm text-slate-600 py-8 text-center">Loading exam progress…</p>
        ) : (
          examProgress.map((item) => (
            <div key={item.exam}>
              <div className="flex justify-between text-sm mb-2 gap-3">
                <span className="font-medium text-black">{item.exam}</span>
                <span
                  className="font-semibold shrink-0"
                  style={{ color: item.noStudents ? "#64748B" : item.color }}
                >
                  {item.noStudents ? "No Students" : `${item.progress}%`}
                </span>
              </div>
              <div className="h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${item.noStudents ? 0 : item.progress}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
