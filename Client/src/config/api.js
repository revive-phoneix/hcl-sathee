/** Backend API base URL (no trailing slash). */
export const API_URL = (
  import.meta.env.VITE_API_URL || "https://hcl-sathee-backend.onrender.com"
).replace(/\/$/, "");
