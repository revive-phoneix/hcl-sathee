import { SectionHeader } from "./SectionHeader";

const examProgress = [
{ exam: "JEE Exams", progress: 78, color: "#22C55E" },
{ exam: "NEET", progress: 65, color: "#22C55E" },
{ exam: "SSC", progress: 92, color: "#15803D" },
{ exam: "CLAT", progress: 19, color: "#EF4444" },
{ exam: "IBPS", progress: 31, color: "#F97316" },
{ exam: "ICAR", progress: 41, color: "#FACC15" },
{ exam: "CUET", progress: 50, color: "#FACC15" },
{ exam: "RRB", progress: 18, color: "#EF4444" },
];

export function ExamProgress() {
  return (
    <div className="bg-[#ccd2dd] border border-[#3B82F6]/20 rounded-3xl p-6 h-[420px] flex flex-col overflow-hidden">

      <SectionHeader 
        title="Batch Exam Progress" 
      />

      <div className="flex-1 overflow-y-auto pr-2 space-y-5 mt-4 custom-scroll">
        {examProgress.map((item) => (
          <div key={item.exam}>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-black">{item.exam}</span>
              <span className="font-semibold" style={{ color: item.color }}>
                {item.progress}%
              </span>
            </div>
            <div className="h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${item.progress}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
