export default function ProgressBar({ value, status }) {
  const done = status === "Completed";
  const progress = status === "In Progress";
  const bar = done ? "bg-emerald-500" : progress ? "bg-blue-500" : "bg-gray-300";
  const track = done ? "bg-emerald-100" : progress ? "bg-blue-100" : "bg-gray-200";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className={`flex-1 h-1.5 rounded-full ${track} overflow-hidden`}>
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{value}%</span>
    </div>
  );
}
