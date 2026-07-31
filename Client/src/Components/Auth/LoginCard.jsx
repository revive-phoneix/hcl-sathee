import { useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { getAuthErrorMessage, postWithColdStartRetry } from "../../utils/apiRequest";
import { setAuthToken } from "../../utils/authToken";
import { setSession } from "../../utils/authSession";

const REMEMBER_ME_KEY = "hcl_sathee_remember_me";
const fieldClass =
  "h-12 w-full rounded-2xl bg-white/10 px-5 outline-none placeholder:text-white/50 focus:bg-white/20";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const encodeSecret = (value) => {
  try {
    return btoa(unescape(encodeURIComponent(String(value || ""))));
  } catch {
    return String(value || "");
  }
};

const decodeSecret = (value) => {
  if (!value) return "";
  try {
    return decodeURIComponent(escape(atob(String(value))));
  } catch {
    // Backward compatible with older plain-text saves
    return String(value);
  }
};

const readRemembered = () => {
  try {
    const raw = localStorage.getItem(REMEMBER_ME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      name: parsed.name || "",
      email: parsed.email || "",
      password: decodeSecret(parsed.passwordEnc ?? parsed.password ?? ""),
    };
  } catch {
    return null;
  }
};

const writeRemembered = ({ name, email, password }) => {
  localStorage.setItem(
    REMEMBER_ME_KEY,
    JSON.stringify({
      name: name || "",
      email: email || "",
      passwordEnc: encodeSecret(password || ""),
    })
  );
};

export default function AdminLoginCard({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    const prefill = location.state?.loginPrefill;
    if (prefill?.name || prefill?.email) {
      setFormData({
        name: String(prefill.name || "").trim(),
        email: String(prefill.email || "").trim().toLowerCase(),
        password: "",
      });
      setRememberMe(false);
      // Drop one-shot prefill so a later refresh uses Remember me as usual.
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      const saved = readRemembered();
      if (saved) {
        setFormData(saved);
        setRememberMe(true);
      }
    }
    setHydrated(true);
    // Only hydrate once on mount from navigation state or Remember me.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep storage in sync whenever Remember me is on and fields change.
  useEffect(() => {
    if (!hydrated) return;
    if (!rememberMe) return;
    writeRemembered(formData);
  }, [formData, rememberMe, hydrated]);

  const setField = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const focusField = (id) => {
    const el = document.getElementById(id);
    if (el) el.focus();
  };

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    setError("");
    setStatusText("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!name) {
      setError("Full name is required.");
      focusField("login-name");
      return;
    }
    if (!email) {
      setError("Email address is required.");
      focusField("login-email");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      focusField("login-email");
      return;
    }
    if (!password) {
      setError("Password is required.");
      focusField("login-password");
      return;
    }

    setLoading(true);

    try {
      const response = await postWithColdStartRetry(
        `${API_URL}/api/auth/login`,
        { name, email, password },
        {
          onStatus: (status) =>
            setStatusText(
              status === "waking"
                ? "Waking up server, please wait…"
                : "Signing in…"
            ),
        }
      );

      if (rememberMe) writeRemembered({ name, email, password });
      else localStorage.removeItem(REMEMBER_ME_KEY);

      const user = response.data?.user || {};
      if (response.data?.token) setAuthToken(response.data.token);

      const sessionUser = {
        id: user.id ?? null,
        name: user.name || name,
        email: user.email || email,
        role: user.role || "",
        centre: user.centre || null,
      };
      setSession({ ...sessionUser, portal: "" });
      onLoginSuccess?.(sessionUser);
      navigate("/");
    } catch (err) {
      console.error(err.response?.data || err);
      setStatusText("");
      setError(getAuthErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleFieldEnter = (currentKey) => (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (currentKey === "name") {
      if (!name) return setError("Full name is required.");
      setError("");
      focusField("login-email");
      return;
    }

    if (currentKey === "email") {
      if (!email) return setError("Email address is required.");
      if (!isValidEmail(email)) return setError("Enter a valid email address.");
      setError("");
      focusField("login-password");
      return;
    }

    if (currentKey === "password") {
      if (!name || !email || !password) {
        if (!name) return focusField("login-name");
        if (!email) return focusField("login-email");
        return setError("Password is required.");
      }
      handleLogin(e);
    }
  };

  if (!hydrated) {
    return (
      <div className="max-w-md rounded-3xl bg-[#1e40af] p-8 shadow-2xl lg:max-w-lg lg:p-10 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
        <p className="text-sm opacity-90">Loading saved login…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-3xl bg-[#1e40af] p-8 shadow-2xl lg:max-w-lg lg:p-10 text-white">
      <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
      <p className="text-sm opacity-90 mb-8">
        Sign in to access the HCL SATHEE Admin Dashboard.
      </p>

      <form
        className="space-y-6"
        onSubmit={handleLogin}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore="true"
      >
        {[
          ["FULL NAME", "name", "text", "Enter your full name", "login-name"],
          ["EMAIL ADDRESS", "email", "email", "Enter your email address", "login-email"],
        ].map(([label, key, type, placeholder, id]) => (
          <div key={key}>
            <label className="text-xs font-semibold tracking-widest opacity-75 block mb-2">
              {label}
            </label>
            <input
              id={id}
              name={key}
              type={type}
              value={formData[key]}
              onChange={setField(key)}
              onKeyDown={handleFieldEnter(key)}
              placeholder={placeholder}
              className={fieldClass}
              required
              autoComplete="off"
            />
          </div>
        ))}

        <div>
          <label className="text-xs font-semibold tracking-widest opacity-75 block mb-2">
            PASSWORD
          </label>
          <div className="relative">
            <input
              id="login-password"
              name="login-password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={setField("password")}
              onKeyDown={handleFieldEnter("password")}
              placeholder="Enter your password"
              className={`${fieldClass} pr-12`}
              required
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => {
                const checked = e.target.checked;
                setRememberMe(checked);
                if (checked) writeRemembered(formData);
                else localStorage.removeItem(REMEMBER_ME_KEY);
              }}
              className="h-4 w-4 rounded border-white/40 bg-white/10 accent-[#fbbf24]"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-sm text-white/90 underline underline-offset-2 hover:text-white"
          >
            Forgot password?
          </button>
        </div>

        {statusText ? (
          <p className="rounded-2xl bg-white/15 px-4 py-2 text-sm text-white/95">{statusText}</p>
        ) : null}
        {error ? (
          <p className="rounded-2xl bg-red-500/25 px-4 py-2 text-sm text-red-100">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-2xl bg-white text-[#1e40af] font-semibold text-lg flex items-center justify-center gap-2 hover:bg-white/90 transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? statusText || "Signing In…" : "Sign In"}
          {!loading ? <ArrowRight size={22} /> : null}
        </button>
      </form>

    </div>
  );
}
