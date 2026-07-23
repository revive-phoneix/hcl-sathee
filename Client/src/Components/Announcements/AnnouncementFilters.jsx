export default function AnnouncementFilters({
  search,
  setSearch,
  filterCategory,
  setFilterCategory,
  categoryOptions,
}) {
  return (
    <div className="bg-white text-black border border-sky-100 rounded-3xl p-5 mb-8 flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-[280px] relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search announcements..."
          className="w-full pl-12 pr-5 py-4 border border-slate-200 rounded-2xl focus:border-sky-500 outline-none"
        />
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
      </div>

      <select
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
        className="px-6 py-4 border border-slate-200 rounded-2xl bg-white text-sm font-medium focus:border-sky-500 outline-none"
      >
        {categoryOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
