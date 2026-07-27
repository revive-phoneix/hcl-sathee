import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthAlerts,
  AuthCard,
  Field,
  PasswordRequirements,
  authPost,
  btnPrimaryClass,
  btnSecondaryClass,
  getAuthErrorMessage,
  inputClass,
  lockedInputClass,
} from "./authUi";
import { validatePasswordPolicy } from "../../utils/passwordPolicy";

export default function ForgetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("lookup");
  const [lookupEmail, setLookupEmail] = useState("");
  const [account, setAccount] = useState({ name: "", email: "", role: "" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetAlerts = () => {
    setError("");
    setMessage("");
    setStatusText("");
  };

  const run = async (fn) => {
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setStatusText("");
      setError(getAuthErrorMessage(err, "Request failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = (e) => {
    e.preventDefault();
    resetAlerts();
    if (!lookupEmail.trim()) return setError("Enter your email address.");

    run(async () => {
      const { data } = await authPost(
        "/api/auth/forgot-password/lookup",
        { email: lookupEmail.trim() },
        setStatusText,
        "Looking up account…"
      );
      const user = data?.user;
      setAccount({
        name: user?.name || "",
        email: user?.email || lookupEmail.trim().toLowerCase(),
        role: user?.role || "",
      });
      setStep("reset");
      setStatusText("");
    });
  };

  const handleReset = (e) => {
    e.preventDefault();
    resetAlerts();
    const policy = validatePasswordPolicy(password);
    if (!policy.valid) return setError(policy.message);
    if (password !== confirmPassword) return setError("Passwords do not match.");

    run(async () => {
      await authPost(
        "/api/auth/forgot-password/reset",
        { ...account, password },
        setStatusText,
        "Updating password…"
      );
      setStatusText("");
      setMessage("Password updated successfully. You can now sign in.");
      setTimeout(() => navigate("/"), 1200);
    });
  };

  return (
    <AuthCard
      title="Forgot Password"
      subtitle={
        step === "lookup"
          ? "Enter your account email to continue."
          : "Confirm your account details and set a new password."
      }
    >
      {step === "lookup" ? (
        <form onSubmit={handleLookup} className="mt-6 space-y-4">
          <Field label="Email">
            <input
              type="email"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              className={inputClass}
              placeholder="name@example.com"
              required
            />
          </Field>
          <AuthAlerts statusText={statusText} error={error} />
          <button type="submit" disabled={loading} className={btnPrimaryClass}>
            {loading ? statusText || "Finding account…" : "Continue"}
          </button>
          <button type="button" onClick={() => navigate("/")} className={btnSecondaryClass}>
            Back to Sign In
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="mt-6 space-y-4">
          {[
            ["Name", account.name],
            ["Email", account.email],
            ["Role", account.role],
          ].map(([label, value]) => (
            <Field key={label} label={label}>
              <input type="text" value={value} readOnly className={lockedInputClass} />
            </Field>
          ))}
          <Field label="New Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Create a strong password"
              required
            />
            <PasswordRequirements password={password} />
          </Field>
          <Field label="Confirm New Password">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <AuthAlerts statusText={statusText} error={error} message={message} />
          <button type="submit" disabled={loading} className={btnPrimaryClass}>
            {loading ? statusText || "Updating Password…" : "Update Password"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("lookup");
              setPassword("");
              setConfirmPassword("");
              resetAlerts();
            }}
            className={btnSecondaryClass}
          >
            Use a different email
          </button>
        </form>
      )}
    </AuthCard>
  );
}
