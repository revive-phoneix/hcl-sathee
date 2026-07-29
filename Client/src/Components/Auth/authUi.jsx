import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { API_URL } from "../../config/api";
import { getAuthErrorMessage, postWithColdStartRetry } from "../../utils/apiRequest";
import { getPasswordRuleStatus } from "../../utils/passwordPolicy";

export const inputClass =
  "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500";
export const lockedInputClass =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none cursor-not-allowed";
export const btnPrimaryClass =
  "w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70";
export const btnSecondaryClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50";

export const coldStartStatus = (busyLabel) => (status) =>
  status === "waking" ? "Waking up server, please wait…" : busyLabel;

export async function authPost(path, body, setStatus, busyLabel) {
  return postWithColdStartRetry(`${API_URL}${path}`, body, {
    onStatus: (status) => setStatus?.(coldStartStatus(busyLabel)(status)),
  });
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

export function PasswordField({
  value,
  onChange,
  placeholder = "",
  required = false,
  autoComplete = "new-password",
  className = inputClass,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        className={`${className} pr-11`}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function AuthAlerts({ statusText, error, message }) {
  return (
    <>
      {statusText ? (
        <p className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">{statusText}</p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
    </>
  );
}

export function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export function PasswordRequirements({ password }) {
  const rules = getPasswordRuleStatus(password);
  if (!password) return null;

  return (
    <ul className="space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
      {rules.map((rule) => (
        <li key={rule.id} className={rule.met ? "text-emerald-700" : "text-slate-500"}>
          {rule.met ? "✓" : "•"} {rule.label}
        </li>
      ))}
    </ul>
  );
}

export { getAuthErrorMessage };
