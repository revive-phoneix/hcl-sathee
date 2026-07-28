const STATUS_STYLE = {
  Completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "In Progress": "bg-blue-100 text-blue-700 border border-blue-200",
  Pending: "bg-gray-100 text-gray-500 border border-gray-200",
};

const STATUS_DOT = {
  Completed: "text-emerald-500",
  "In Progress": "text-blue-500",
  Pending: "text-gray-400",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[status] || STATUS_STYLE.Pending}`}
    >
      <span className={STATUS_DOT[status] || STATUS_DOT.Pending}>
        {status === "Pending" ? "○" : "●"}
      </span>
      {status}
    </span>
  );
}

export function ProgressBar({ value, status }) {
  const done = status === "Completed";
  const progress = status === "In Progress";
  const bar = done ? "bg-emerald-500" : progress ? "bg-blue-500" : "bg-gray-300";
  const track = done ? "bg-emerald-100" : progress ? "bg-blue-100" : "bg-gray-200";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className={`flex-1 h-1.5 rounded-full ${track} overflow-hidden`}>
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{value}%</span>
    </div>
  );
}

export function EmptySchedule({ readOnly, onUploadClick }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 gap-5">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl"
        style={{ background: "#ccd2dd" }}
      >
        📅
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800">No Schedule Available</p>
        <p className="text-sm text-gray-500 mt-1 max-w-xs leading-relaxed">
          {readOnly
            ? "No teaching schedule has been uploaded for this centre yet."
            : "Upload an Excel or CSV schedule, then Save. You can add more months later."}
        </p>
      </div>
      {!readOnly ? (
        <button
          type="button"
          onClick={onUploadClick}
          className="mt-1 px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
        >
          Upload Schedule
        </button>
      ) : null}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options }) {
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

export function StatusBanner({ meta, topicCount, months, isDirty }) {
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

export function DeleteMonthPanel({ months, value, onChange, onConfirm, onCancel }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 space-y-3">
      <p className="text-sm font-semibold text-red-800">Delete month schedule</p>
      <p className="text-xs text-red-700">
        Choose which month to remove. Other months will stay saved.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect label="Month" value={value} onChange={onChange} options={months} />
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
        >
          Delete Month
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const COLUMNS = [
  "Topic",
  "Planned Days",
  "Start Date",
  "End Date",
  "Faculty",
  "Completion",
  "Status",
];

export function ScheduleTable({ rows }) {
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <p className="text-base font-bold text-gray-800">No topics for this filter</p>
        <p className="text-sm text-gray-500">Try another subject or month.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 flex-1" style={{ minHeight: 0 }}>
      <table className="w-full text-sm border-collapse" style={{ minWidth: "720px" }}>
        <thead>
          <tr style={{ background: "#ccd2dd" }}>
            {COLUMNS.map((col, i) => (
              <th
                key={col}
                className={`px-4 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap ${i === 0 ? "rounded-tl-2xl" : ""} ${i === COLUMNS.length - 1 ? "rounded-tr-2xl" : ""}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.topic}-${i}`}
              className="border-t border-gray-100 hover:bg-blue-50/50"
              style={{ background: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}
            >
              <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">{row.topic}</td>
              <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  {row.days} Days
                </span>
              </td>
              <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{row.start}</td>
              <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{row.end}</td>
              <td className="px-4 py-3.5 font-medium text-gray-700 whitespace-nowrap">{row.faculty}</td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <ProgressBar value={row.completion} status={row.status} />
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
