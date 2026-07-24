import axios from "axios";
import { API_URL } from "../config/api";
import { authHeaders, clearAuthToken } from "../utils/authToken";

/** Shared axios instance — attaches JWT and clears it on 401. */
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const headers = authHeaders();
  config.headers = {
    ...config.headers,
    ...headers,
  };
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
    }
    return Promise.reject(error);
  }
);

export default api;
