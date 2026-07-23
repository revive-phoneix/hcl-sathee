import { ChevronRight } from "lucide-react";

export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-black font-semibold text-lg">{title}</h2>
      {action && (
        <button className="text-[#3B82F6] hover:text-blue-400 text-sm font-medium flex items-center gap-1 transition-colors">
          {action} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
