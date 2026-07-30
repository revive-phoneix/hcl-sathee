import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AuthAlerts,
  AuthCard,
  Field,
  PasswordField,
  PasswordRequirements,
  authPost,
  btnPrimaryClass,
  getAuthErrorMessage,
  lockedInputClass,
} from "./authUi";
import { validatePasswordPolicy } from "../../utils/passwordPolicy";

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

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setStatusText("");

    if (!form.name || !form.email) {
      return setError("The invite link is missing user details.");
    }
    const policy = validatePasswordPolicy(form.password);
    if (!policy.valid) return setError(policy.message);
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      await authPost(
        "/api/auth/create-password",
        { name: form.name, email: form.email, password: form.password },
        setStatusText,
        "Creating password…"
      );
      setStatusText("");
      setMessage("Password created successfully. You can now sign in.");
      setTimeout(
        () =>
          navigate("/", {
            replace: true,
            state: {
              loginPrefill: {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
              },
            },
          }),
        1200
      );
    } catch (err) {
      setStatusText("");
      setError(getAuthErrorMessage(err, "Unable to create password right now."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create Your Password"
      subtitle="Set a password for your HCL SATHEE portal account."
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Name">
          <input type="text" value={form.name} readOnly className={lockedInputClass} required />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} readOnly className={lockedInputClass} required />
        </Field>
        <Field label="Create Password">
          <PasswordField
            value={form.password}
            onChange={set("password")}
            placeholder="Create a strong password"
            required
          />
          <PasswordRequirements password={form.password} />
        </Field>
        <Field label="Confirm Password">
          <PasswordField
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            required
          />
        </Field>
        <AuthAlerts statusText={statusText} error={error} message={message} />
        <button type="submit" disabled={loading} className={btnPrimaryClass}>
          {loading ? statusText || "Creating Password..." : "Submit"}
        </button>
      </form>
    </AuthCard>
  );
}
