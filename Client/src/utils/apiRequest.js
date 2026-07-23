import axios from "axios";

/** Render free tier cold starts often need 30–60s; keep room for that. */
const DEFAULT_TIMEOUT_MS = 90000;
const RETRY_DELAY_MS = 2500;

const isRetryableNetworkError = (err) => {
  const code = err.code || "";

  // True network-level failures (no response ever received)
  const isNetworkLevel =
    !err.response &&
    (code === "ECONNABORTED" ||
      code === "ERR_NETWORK" ||
      code === "ETIMEDOUT" ||
      err.message?.toLowerCase().includes("timeout") ||
      err.message?.toLowerCase().includes("network"));

  // Render's proxy can return a gateway error page (non-JSON) while
  // the app is still cold-starting. This still counts as "server waking up".
  const isGatewayColdStart =
    err.response && [502, 503, 504].includes(err.response.status);

  return isNetworkLevel || isGatewayColdStart;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST with long timeout + automatic retries for Render cold starts.
 * @param {string} url
 * @param {object} data
 * @param {{ onStatus?: (status: 'requesting' | 'waking') => void, timeout?: number, maxRetries?: number }} [options]
 */
export async function postWithColdStartRetry(url, data, options = {}) {
  const { onStatus, timeout = DEFAULT_TIMEOUT_MS, maxRetries = 3 } = options;

  onStatus?.("requesting");

  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await axios.post(url, data, { timeout });
    } catch (err) {
      lastErr = err;
      if (!isRetryableNetworkError(err) || attempt === maxRetries) throw err;

      onStatus?.("waking");
      await wait(RETRY_DELAY_MS);
    }
  }
  throw lastErr;
}

export function getAuthErrorMessage(err, fallback = "Request failed. Please try again.") {
  const status = err.response?.status;
  const data = err.response?.data;

  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (status && [502, 503, 504].includes(status)) {
    return "Server is waking up from inactivity — please try again in a few seconds.";
  }
  if (!err.response) {
    return "Server is still waking up. Please wait a moment and try again.";
  }
  return fallback;
}