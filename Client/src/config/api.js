const resolvedApiUrl = String(import.meta.env.VITE_API_URL || "").trim();
export const API_URL = (resolvedApiUrl || "https://hcl-sathee-tsgk.onrender.com").replace(/\/$/, "");
