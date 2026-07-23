export default function TabSelector({ activeTab, setActiveTab }) {
  const tabs = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "sathee-mitra", label: "Sathee Mitra" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeTab === tab.key
              ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
              : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
