const AUTH_TOKEN_KEY = "hcl_sathee_auth_token";

export const getAuthToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
};

export const clearAuthToken = () => setAuthToken("");

export const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
