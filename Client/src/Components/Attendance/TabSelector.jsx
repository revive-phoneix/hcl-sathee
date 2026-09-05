import { useEffect, useState } from "react";
import { fetchCentres } from "../../services/centres";

const DEFAULT_CENTRE_OPTIONS = [
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
  `px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${active
    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
    : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
  }`;

export default function TabSelector({
  activeTab,
  setActiveTab,
  selectedCentre = "",
  setSelectedCentre,
  selectedRole = "",
  setSelectedRole,
  showCentreFilter = false,
  showMitraTab = true,
  mitraTabLabel = "Sathee Mitra",
  onGo,
  canGo = false,
}) {
  const [centreOptions, setCentreOptions] = useState(DEFAULT_CENTRE_OPTIONS);

  useEffect(() => {
    if (!showCentreFilter) return undefined;
    let cancelled = false;
    fetchCentres()
      .then((centres) => {
        if (cancelled) return;
        const names = centres.map((c) => c.name).filter(Boolean);
        if (names.length) setCentreOptions(names);
      })
      .catch((error) => console.error("Fetch Centres Error:", error));
    return () => {
      cancelled = true;
    };
  }, [showCentreFilter]);

  const typeValue = TYPE_OPTIONS.some((opt) => opt.value === activeTab)
    ? activeTab
    : "";

  const roleOptions = [
    { value: "student", label: "Student" },
    { value: "sathee-mitra", label: mitraTabLabel },
    ...(typeValue === "daily" || !typeValue
      ? [{ value: "sathee-vishist", label: "Sathee Vishist" }]
      : []),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <select
        value={typeValue}
        onChange={(e) => {
          const nextType = e.target.value || "";
          setActiveTab(nextType);
          if (nextType === "weekly" || nextType === "monthly") {
            setSelectedRole?.((currentRole) =>
              currentRole === "sathee-vishist" ? "" : currentRole
            );
          }
        }}
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
          {centreOptions.map((centre) => (
            <option key={centre} value={centre}>
              {centre}
            </option>
          ))}
        </select>
      ) : null}

      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole?.(e.target.value || "")}
        className={selectClass}
        aria-label="Select role"
      >
        <option value="">Select Role</option>
        {roleOptions.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>

      {showMitraTab ? (
        <button
          type="button"
          onClick={() => setActiveTab("sathee-mitra")}
          className={pillClass(activeTab === "sathee-mitra")}
        >
          {mitraTabLabel}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onGo}
        disabled={!canGo}
        className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Go
      </button>
    </div>
  );
}
