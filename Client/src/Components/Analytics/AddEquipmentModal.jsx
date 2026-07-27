import { useState } from "react";
import { X } from "lucide-react";
import { getCentreValueFromPortal } from "../../utils/portalMapping";

const WARRANTY_STATUSES = [
  "Under Warranty",
  "Out of Warranty",
  "Expired",
  "Not Applicable",
];

const inputClass =
  "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors";

export default function AddEquipmentModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  portalName,
}) {
  const defaultCentre = getCentreValueFromPortal(portalName) || "HCL RAJASTHAN";

  const [form, setForm] = useState({
    name: "",
    description: "",
    warrantyStatus: "",
    quantity: "",
    expiryDate: "",
    serialNumber: "",
  });
  const [error, setError] = useState("");

  if (!open) return null;

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.description.trim()) {
      setError("Equipment name and description are required");
      return;
    }
    if (form.name.trim().length > 100) {
      setError("Equipment name must be at most 100 characters");
      return;
    }
    if (form.description.trim().length > 250) {
      setError("Equipment description must be at most 250 characters");
      return;
    }
    if (!form.warrantyStatus) {
      setError("Warranty status is required");
      return;
    }
    if (!form.quantity || Number(form.quantity) < 1) {
      setError("Enter a valid quantity");
      return;
    }
    if (!form.expiryDate) {
      setError("Date of expiry is required");
      return;
    }

    setError("");
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        warrantyStatus: form.warrantyStatus,
        quantity: Number(form.quantity),
        expiryDate: form.expiryDate,
        serialNumber: form.serialNumber.trim() || null,
        centre: defaultCentre,
      });
      setForm({
        name: "",
        description: "",
        warrantyStatus: "",
        quantity: "",
        expiryDate: "",
        serialNumber: "",
      });
    } catch (submitError) {
      setError(submitError.message || "Unable to add equipment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Add Equipment</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Equipment Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              maxLength={100}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
              placeholder="Enter Equipment Name"
              required
            />
            <p className="mt-1 text-xs text-red-500">Maximum Characters: 100</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Equipment Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              maxLength={250}
              rows={3}
              onChange={(e) => update("description", e.target.value)}
              className={`${inputClass} resize-y min-h-[88px]`}
              placeholder="Enter Equipment Description"
              required
            />
            <p className="mt-1 text-xs text-red-500">Maximum Characters: 250</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Warranty Status <span className="text-red-500">*</span>
              </label>
              <select
                value={form.warrantyStatus}
                onChange={(e) => update("warrantyStatus", e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select</option>
                {WARRANTY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => update("quantity", e.target.value)}
                className={inputClass}
                placeholder="Enter Quantity of Equipment"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Date of Expiry <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => update("expiryDate", e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Serial Number
              </label>
              <input
                type="text"
                value={form.serialNumber}
                onChange={(e) => update("serialNumber", e.target.value)}
                className={inputClass}
                placeholder="Enter Serial Number"
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
