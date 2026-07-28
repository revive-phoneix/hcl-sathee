export default function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 pr-7 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer min-w-[140px]"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
          ▾
        </span>
      </div>
    </div>
  );
}
