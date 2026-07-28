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

export default function StatusBadge({ status }) {
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
