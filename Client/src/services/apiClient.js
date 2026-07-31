import axios from "axios";
import { API_URL } from "../config/api";
import { getAuthToken } from "../utils/authToken";
import { clearSession } from "../utils/authSession";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  // Axios v1 uses AxiosHeaders — set() is reliable; object spread is not.
  if (token) {
    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
    }
    return Promise.reject(error);
  }
);

export default api;
