import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

const todayInput = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function ApplyLeaveModal({
  onClose,
  onSubmit,
  submitting = false,
  userName = "",
}) {
  const [form, setForm] = useState({
    fromDate: todayInput(),
    toDate: todayInput(),
    reason: "",
  });
  const [error, setError] = useState("");
  useEscapeToClose(onClose);

  const dayCount = useMemo(() => {
    if (!form.fromDate || !form.toDate || form.toDate < form.fromDate) return null;
    const start = new Date(`${form.fromDate}T00:00:00`);
    const end = new Date(`${form.toDate}T00:00:00`);
    const days =
      Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return days;
  }, [form.fromDate, form.toDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");

    if (!form.fromDate || !form.toDate) {
      setError("Select leave period (from and to dates).");
      return;
    }
    if (form.toDate < form.fromDate) {
      setError("End date cannot be before start date.");
      return;
    }
    if (!form.reason.trim()) {
      setError("Please enter a reason for leave.");
      return;
    }

    onSubmit({
      fromDate: form.fromDate,
      toDate: form.toDate,
      reason: form.reason.trim(),
      name: userName || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white text-black rounded-3xl w-full max-w-lg shadow-2xl border border-sky-100 max-h-[92vh] overflow-auto">
        <div className="p-6 sm:p-8 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-sky-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 flex items-center justify-center shrink-0">
              <CalendarDays size={22} className="text-sky-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Apply Leave</h2>
              <p className="text-sm text-slate-500 truncate">
                {userName ? `${userName} · leave request` : "Submit leave period and reason"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-3xl leading-none text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                From date
              </label>
              <input
                type="date"
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:border-sky-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                To date
              </label>
              <input
                type="date"
                value={form.toDate}
                min={form.fromDate || undefined}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:border-sky-500 outline-none"
                required
              />
            </div>
          </div>

          {dayCount != null ? (
            <p className="text-xs font-medium text-slate-500">
              Leave duration: {dayCount} day{dayCount === 1 ? "" : "s"}
            </p>
          ) : null}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:border-sky-500 outline-none resize-y min-h-[110px]"
              placeholder="Briefly explain why you need leave…"
              required
            />
            <p className="mt-1 text-xs text-slate-400 text-right">
              {form.reason.length}/1000
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit leave"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
