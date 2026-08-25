import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthAlerts,
  AuthCard,
  Field,
  PasswordField,
  PasswordRequirements,
  authPost,
  btnPrimaryClass,
  btnSecondaryClass,
  getAuthErrorMessage,
  inputClass,
} from "./authUi";
import { validatePasswordPolicy } from "../../utils/passwordPolicy";

export default function ForgetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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

  const handleRequestOtp = (e) => {
    e.preventDefault();
    resetAlerts();
    if (!email.trim()) return setError("Enter your email address.");

    run(async () => {
      await authPost(
        "/api/auth/forgot-password/request-otp",
        { email: email.trim() },
        setStatusText,
        "Sending verification code…"
      );
      setStatusText("");
      setStep("otp");
      setResendCooldown(30);
    });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    resetAlerts();
    if (!otp.trim()) return setError("Enter your 6-digit verification code.");
    if (!/^\d{6}$/.test(otp.trim())) return setError("Verification code must be 6 digits.");

    run(async () => {
      const { data } = await authPost(
        "/api/auth/forgot-password/verify-otp",
        { email: email.trim(), otp: otp.trim() },
        setStatusText,
        "Verifying code…"
      );
      setStatusText("");
      setResetToken(data?.resetToken || "");
      setStep("reset");
    });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    resetAlerts();
    const policy = validatePasswordPolicy(password);
    if (!policy.valid) return setError(policy.message);
    if (password !== confirmPassword) return setError("Passwords do not match.");

    run(async () => {
      await authPost(
        "/api/auth/forgot-password/reset",
        { resetToken, password },
        setStatusText,
        "Updating password…"
      );
      setStatusText("");
      setMessage("Password updated successfully. You can now sign in.");
      setTimeout(
        () =>
          navigate("/", {
            replace: true,
            state: {
              loginPrefill: { email: email.trim().toLowerCase() },
            },
          }),
        1200
      );
    });
  };

  const handleResendOtp = (e) => {
    e.preventDefault();
    if (resendCooldown > 0) return;
    resetAlerts();

    run(async () => {
      await authPost(
        "/api/auth/forgot-password/request-otp",
        { email: email.trim() },
        setStatusText,
        "Resending verification code…"
      );
      setStatusText("");
      setResendCooldown(30);
    });
  };

  return (
    <AuthCard
      title="Forgot Password"
      subtitle={
        step === "email"
          ? "Enter your account email to continue."
          : step === "otp"
          ? "Enter the 6-digit code sent to your email."
          : "Create a new password."
      }
    >
      {step === "email" ? (
        <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="name@example.com"
              required
            />
          </Field>
          <AuthAlerts statusText={statusText} error={error} />
          <button type="submit" disabled={loading} className={btnPrimaryClass}>
            {loading ? statusText || "Sending…" : "Continue"}
          </button>
          <button type="button" onClick={() => navigate("/")} className={btnSecondaryClass}>
            Back to Sign In
          </button>
        </form>
      ) : step === "otp" ? (
        <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
          <Field label="Verification Code">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={inputClass}
              placeholder="000000"
              maxLength="6"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              We sent a 6-digit code to {email}. This code expires in 10 minutes.
            </p>
          </Field>
          <AuthAlerts statusText={statusText} error={error} />
          <button type="submit" disabled={loading} className={btnPrimaryClass}>
            {loading ? statusText || "Verifying…" : "Verify Code"}
          </button>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || loading}
            className={`w-full py-2 px-4 text-center rounded-lg font-medium transition ${
              resendCooldown > 0 || loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
              setEmail("");
              resetAlerts();
            }}
            className={btnSecondaryClass}
          >
            Use a different email
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
          <Field label="New Password">
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
            />
            <PasswordRequirements password={password} />
          </Field>
          <Field label="Confirm New Password">
            <PasswordField
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Field>
          <AuthAlerts statusText={statusText} error={error} message={message} />
          <button type="submit" disabled={loading} className={btnPrimaryClass}>
            {loading ? statusText || "Updating…" : "Update Password"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setEmail("");
              setOtp("");
              setPassword("");
              setConfirmPassword("");
              setResetToken("");
              resetAlerts();
            }}
            className={btnSecondaryClass}
          >
            Back to Email
          </button>
        </form>
      )}
    </AuthCard>
  );
}
