import { useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { getAuthErrorMessage, postWithColdStartRetry } from "../../utils/apiRequest";
import { setAuthToken } from "../../utils/authToken";

const REMEMBER_ME_KEY = "hcl_sathee_remember_me";
const fieldClass =
  "h-12 w-full rounded-2xl bg-white/10 px-5 outline-none placeholder:text-white/50 focus:bg-white/20";

export default function AdminLoginCard({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_ME_KEY);
      if (!saved) return;
      setFormData((prev) => ({ ...prev, ...JSON.parse(saved) }));
      setRememberMe(true);
    } catch (err) {
      console.error("Unable to load saved login details", err);
    }
  }, []);

  const setField = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleLogin = async () => {
    setError("");
    setStatusText("");
    setLoading(true);

    try {
      const response = await postWithColdStartRetry(
        `${API_URL}/api/auth/login`,
        formData,
        {
          onStatus: (status) =>
            setStatusText(
              status === "waking"
                ? "Waking up server, please wait…"
                : "Signing in…"
            ),
        }
      );

      if (rememberMe) localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(formData));
      else localStorage.removeItem(REMEMBER_ME_KEY);

      const user = response.data?.user || {};
      if (response.data?.token) setAuthToken(response.data.token);
      onLoginSuccess?.({
        name: user.name || formData.name,
        role: user.role || "",
        centre: user.centre || null,
      });
      navigate("/");
    } catch (err) {
      console.error(err.response?.data || err);
      setStatusText("");
      setError(getAuthErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md rounded-3xl bg-[#1e40af] p-8 shadow-2xl lg:max-w-lg lg:p-10 text-white">
      <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
      <p className="text-sm opacity-90 mb-8">
        Sign in to access the HCL SATHEE Admin Dashboard.
      </p>

      <div className="space-y-6">
        {[
          ["FULL NAME", "name", "text", "Enter your full name"],
          ["EMAIL ADDRESS", "email", "email", "Enter your email address"],
        ].map(([label, key, type, placeholder]) => (
          <div key={key}>
            <label className="text-xs font-semibold tracking-widest opacity-75 block mb-2">
              {label}
            </label>
            <input
              type={type}
              value={formData[key]}
              onChange={setField(key)}
              placeholder={placeholder}
              className={fieldClass}
            />
          </div>
        ))}

        <div>
          <label className="text-xs font-semibold tracking-widest opacity-75 block mb-2">
            PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={setField("password")}
              placeholder="Enter your password"
              className={`${fieldClass} pr-12`}
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
                if (checked) localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(formData));
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
          onClick={handleLogin}
          disabled={loading}
          className="h-12 w-full rounded-2xl bg-white text-[#1e40af] font-semibold text-lg flex items-center justify-center gap-2 hover:bg-white/90 transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? statusText || "Signing In…" : "Sign In"}
          {!loading ? <ArrowRight size={22} /> : null}
        </button>
      </div>

      <p className="mt-8 text-center text-sm opacity-75">
        Having trouble? <span className="underline cursor-pointer">Contact IT Support</span>
      </p>
    </div>
  );
}
