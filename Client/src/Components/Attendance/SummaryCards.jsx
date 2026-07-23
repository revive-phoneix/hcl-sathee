export default function SummaryCards({ activeTab }) {
  const cards = [
    {
      label: "Average Attendance",
      value: activeTab === "daily" ? "86.6%" : activeTab === "weekly" ? "88.1%" : "89.0%",
      sub: "Centre-wide",
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: "📊",
    },
    {
      label: "Highest",
      value: activeTab === "daily" ? "92% — Thu" : activeTab === "weekly" ? "93% — Wk 8" : "91% — Feb",
      sub: "Best performing",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      icon: "🏆",
    },
    {
      label: "Lowest",
      value: activeTab === "daily" ? "79% — Sun" : activeTab === "weekly" ? "84% — Wk 9" : "87% — Mar",
      sub: "Needs attention",
      color: "text-amber-600",
      bg: "bg-amber-50",
      icon: "⚠️",
    },
    {
      label: "Records",
      value: activeTab === "daily" ? "7" : activeTab === "weekly" ? "10" : "5",
      sub: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} entries`,
      color: "text-gray-700",
      bg: "bg-gray-50",
      icon: "📋",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-[rgba(0,0,0,0.06)] px-4 py-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">{card.label}</p>
              <p className={`text-base font-semibold ${card.color}`}>{card.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
            </div>
            <span className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center text-base`}>
              {card.icon}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}