import { useState } from "react";
import { X } from "lucide-react";

export default function AddCentreModal({
  open,
  onClose,
  onAdd,
  submitting = false,
  error = "",
}) {
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState("");

  if (!open) return null;

  const handleClose = () => {
    setName("");
    setLocalError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim()) return setLocalError("Centre name is required");

    setLocalError("");
    await onAdd(name.trim());
  };

  const shownError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Add a Centre</h2>
          <button onClick={handleClose} className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-700">Centre Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full rounded border border-slate-400 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              placeholder="e.g. HCL Uttar Pradesh"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Saved in the standard format, e.g. "HCL UTTAR PRADESH".
            </p>
          </div>

          {shownError ? <p className="text-xs text-red-600">{shownError}</p> : null}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 rounded bg-slate-200 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
