import { getAuthToken, clearAuthToken } from "./authToken";

const SESSION_KEY = "hcl_sathee_session";

// Drop any old persistent session so browser reopen always starts at login.
try {
  localStorage.removeItem(SESSION_KEY);
} catch {
  // ignore
}

export const getSession = () => {
  try {
    if (!getAuthToken()) return null;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || typeof session !== "object") return null;
    return {
      name: session.name || "",
      email: session.email || "",
      id: session.id ?? null,
      role: session.role || "",
      centre: session.centre ?? null,
      portal: session.portal || "",
    };
  } catch {
    return null;
  }
};

export const setSession = (session) => {
  try {
    if (!session) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        name: session.name || "",
        email: session.email || "",
        id: session.id ?? null,
        role: session.role || "",
        centre: session.centre ?? null,
        portal: session.portal || "",
      })
    );
  } catch {
    // ignore storage errors
  }
};

export const updateSession = (patch) => {
  const current = getSession() || {
    name: "",
    email: "",
    id: null,
    role: "",
    centre: null,
    portal: "",
  };
  setSession({ ...current, ...patch });
};

export const clearSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  clearAuthToken();
};
