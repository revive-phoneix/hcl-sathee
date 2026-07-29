const CENTRE_OPTIONS = [
  "HCL RAJASTHAN",
  "HCL JHARKHAND",
  "HCL MADHYA PRADESH",
];

const TYPE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const selectClass =
  "min-w-[160px] px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors";

const pillClass = (active) =>
  `px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
    active
      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
      : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
  }`;

/** Shared attendance filters. Centre dropdown is admin-only. */
export default function TabSelector({
  activeTab,
  setActiveTab,
  selectedCentre = "",
  setSelectedCentre,
  showCentreFilter = false,
}) {
  const typeValue = TYPE_OPTIONS.some((opt) => opt.value === activeTab)
    ? activeTab
    : "";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <select
        value={typeValue}
        onChange={(e) => setActiveTab(e.target.value || "")}
        className={selectClass}
        aria-label="Select attendance type"
      >
        <option value="">Select Type</option>
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {showCentreFilter ? (
        <select
          value={selectedCentre}
          onChange={(e) => setSelectedCentre?.(e.target.value)}
          className={selectClass}
          aria-label="Select centre"
        >
          <option value="">Select Centre</option>
          {CENTRE_OPTIONS.map((centre) => (
            <option key={centre} value={centre}>
              {centre}
            </option>
          ))}
        </select>
      ) : null}

      <button
        type="button"
        onClick={() => setActiveTab("sathee-mitra")}
        className={pillClass(activeTab === "sathee-mitra")}
      >
        Sathee Mitra
      </button>
    </div>
  );
}
