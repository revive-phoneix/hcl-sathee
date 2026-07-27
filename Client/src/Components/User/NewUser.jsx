import { useState } from "react";
import { X } from "lucide-react";
import { getCentreValueFromPortal } from "../../utils/portalMapping";

export default function NewUser({ onClose, onAddUser, submittingUser, portalName }) {
  const defaultCentre = getCentreValueFromPortal(portalName) || "HCL RAJASTHAN";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "ADMIN",
    designation: "",
    centre: defaultCentre,
    isVishist: false,
  });

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.role) {
      setError("All fields are required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone)) {
      setError("Please enter a valid phone number");
      return;
    }

    setError("");

    try {
      await onAddUser({
        ...form,
        centre: form.centre || defaultCentre,
        isVishist: form.role === "SATHEE MITRA" ? Boolean(form.isVishist) : false,
      });
    } catch (submitError) {
      setError(submitError.message || "Unable to add user");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900">Add New User</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-5 text-black">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="name@school.edu"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                    centre: prev.centre || defaultCentre,
                    isVishist:
                      e.target.value === "SATHEE MITRA" ? prev.isVishist : false,
                  }))
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="SATHEE MITRA">SATHEE MITRA</option>
                <option value="HCL PARTNER">HCL PARTNER</option>
              </select>
            </div>

            {form.role === "SATHEE MITRA" ? (
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.isVishist)}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isVishist: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Is Vishist?
                </span>
              </label>
            ) : null}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-4 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={submittingUser}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingUser}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-400/30"
            >
              {submittingUser ? "Saving..." : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
