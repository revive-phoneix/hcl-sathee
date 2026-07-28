export default function StatusBanner({ meta, topicCount, months, isDirty }) {
  if (!meta) return null;
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
      <p className="font-semibold text-blue-800 truncate">{meta.lastFile || meta.name}</p>
      <p className="text-xs text-blue-600 mt-0.5">
        {topicCount} topic{topicCount === 1 ? "" : "s"} · {months.join(", ") || "No months"}
        {isDirty ? " · Unsaved changes — click Save" : " · Saved"}
      </p>
    </div>
  );
}
