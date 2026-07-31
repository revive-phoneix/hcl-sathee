const AUTH_TOKEN_KEY = "hcl_sathee_auth_token";

// Drop any old persistent login so browser reopen always starts at login.
try {
  localStorage.removeItem(AUTH_TOKEN_KEY);
} catch {
  // ignore
}

export const getAuthToken = () => {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    else sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
};

export const clearAuthToken = () => setAuthToken("");

export const getAuthPayload = () => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    if (!payload || typeof payload !== "object") return null;
    return {
      id: payload.id ?? null,
      email: payload.email || "",
      role: payload.role || "",
      centre: payload.centre ?? null,
    };
  } catch {
    return null;
  }
};

export const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
