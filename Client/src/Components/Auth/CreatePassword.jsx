import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../../config/api";
import { getAuthErrorMessage, postWithColdStartRetry } from "../../utils/apiRequest";

export default function CreatePassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setStatusText("");

    if (!form.name || !form.email) {
      setError("The invite link is missing user details.");
      return;
    }

    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await postWithColdStartRetry(
        `${API_URL}/api/auth/create-password`,
        {
          name: form.name,
          email: form.email,
          password: form.password,
        },
        {
          onStatus: (status) => {
            setStatusText(
              status === "waking"
                ? "Waking up server, please wait…"
                : "Creating password…"
            );
          },
        }
      );

      setStatusText("");
      setMessage("Password created successfully. You can now sign in.");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setStatusText("");
      setError(getAuthErrorMessage(err, "Unable to create password right now."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-slate-900">Create Your Password</h2>
        <p className="mt-2 text-sm text-slate-600">
          Set a password for your HCL SATHEE portal account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={form.name}
              readOnly
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none cursor-not-allowed"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              readOnly
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none cursor-not-allowed"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Create Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
              required
            />
          </div>

          {statusText ? (
            <p className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">{statusText}</p>
          ) : null}
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? statusText || "Creating Password..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
