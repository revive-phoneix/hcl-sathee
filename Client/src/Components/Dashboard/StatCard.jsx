export function StatCard({ icon: Icon, label, value, iconBg, iconColor, loading = false }) {
  return (
    <div className="bg-[#ccd2dd] border border-black rounded-2xl p-5 flex flex-col gap-4 hover:border-[#3B82F6]/40 hover:shadow-xl hover:shadow-[#3B82F6]/10 transition-all duration-300">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <p className="text-[#000000] text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-black text-3xl font-bold tracking-tight">{loading ? "…" : value}</p>
      </div>
    </div>
  );
}
