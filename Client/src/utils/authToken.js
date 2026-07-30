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

export const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
