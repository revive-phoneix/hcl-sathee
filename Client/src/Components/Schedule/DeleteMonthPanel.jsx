import FilterSelect from "./FilterSelect";

export default function DeleteMonthPanel({
  months,
  value,
  onChange,
  onConfirm,
  onCancel,
}) {
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
