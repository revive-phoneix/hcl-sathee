const UserFilter = ({ filters, activeFilter, setActiveFilter, roleCount }) => {
  return (
    <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200/80 inline-flex flex-wrap gap-1">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => setActiveFilter(f)}
          className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-150
            ${
              activeFilter === f
                ? "bg-blue-600 text-white shadow-md shadow-blue-400/30"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
        >
          {f}
          <span
            className={`ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full
              ${activeFilter === f ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}
          >
            {roleCount(f)}
          </span>
        </button>
      ))}
    </div>
  );
};

export default UserFilter;