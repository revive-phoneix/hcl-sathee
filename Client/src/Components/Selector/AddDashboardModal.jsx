import { useState } from "react";
import { X } from "lucide-react";

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function AddDashboardModal({ open, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleClose = () => {
    setName("");
    setUrl("");
    setError("");
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    if (!isValidUrl(url.trim())) return setError("Enter a valid URL, e.g. https://example.com");

    onAdd({ title: name.trim(), url: url.trim() });
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Add a website</h2>
          <button onClick={handleClose} className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full rounded border border-slate-400 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Zoom"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-700">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              placeholder="https://example.com"
            />
          </div>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded bg-slate-200 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300"
            >
              Add
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded bg-slate-200 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}