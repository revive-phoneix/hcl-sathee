const PRIORITY_CONFIG = {
  High: { bg: "bg-red-100 text-red-700", label: "HIGH" },
  Medium: { bg: "bg-amber-100 text-amber-700", label: "MEDIUM" },
  Low: { bg: "bg-sky-100 text-sky-700", label: "LOW" },
};

const CATEGORY_ICONS = {
  Engineering: "⚙️",
  Medical: "🏥",
};

export default function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  onView,
  readOnly = false,
}) {
  const priority = PRIORITY_CONFIG[announcement.priority] || PRIORITY_CONFIG.Medium;
  const categoryIcon = CATEGORY_ICONS[announcement.category] || "📢";

  return (
    <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 flex gap-6 relative overflow-hidden hover:shadow-xl transition-all group">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-sky-500" />

      <div className="w-12 h-12 rounded-full bg-white border border-sky-200 flex items-center justify-center text-2xl flex-shrink-0">
        {categoryIcon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 flex-wrap">
          <h3 className="font-semibold text-lg text-slate-900 leading-tight">
            {announcement.title}
          </h3>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${priority.bg}`}>
            {priority.label}
          </span>
        </div>

        <p className="text-slate-600 text-sm mt-2 line-clamp-2">{announcement.description}</p>

        <div className="flex gap-6 text-xs mt-4 text-slate-500">
          <div>📅 {announcement.postedOn}</div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 w-36">
        <div className="space-y-2 w-full">
          <button
            onClick={() => onView(announcement.id)}
            className="w-full text-xs text-blue-600 font-medium bg-white border border-sky-200 hover:bg-sky-50 py-2 rounded-xl flex items-center justify-center gap-2"
          >
            View
          </button>
          {!readOnly ? (
            <>
              <button
                onClick={() => onEdit(announcement.id)}
                className="w-full text-xs text-black font-medium bg-white border border-blue-200 hover:bg-blue-50 py-2 rounded-xl flex items-center justify-center gap-2"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(announcement.id)}
                className="w-full text-xs font-medium bg-white border border-red-200 hover:bg-red-50 py-2 rounded-xl flex items-center justify-center gap-2 text-red-600"
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
