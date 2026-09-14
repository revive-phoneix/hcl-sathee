import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { requestNotificationPermission } from "../../firebase";
import { registerDeviceToken, unregisterDeviceToken } from "../../services/notifications";

const PREF_KEY = "sathee_notifications_pref";

const readStoredPref = () => {
  try {
    return localStorage.getItem(PREF_KEY);
  } catch {
    return null;
  }
};

const writeStoredPref = (value) => {
  try {
    localStorage.setItem(PREF_KEY, value);
  } catch {
    // ignore storage errors
  }
};

export function NotificationSettingsBanner({
  message = "Get notified about announcements, leave requests, and query replies.",
}) {
  const [enabled, setEnabled] = useState(() => {
    const stored = readStoredPref();
    if (stored === "yes") return true;
    if (stored === "no") return false;
    return typeof Notification !== "undefined" && Notification.permission === "granted";
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // Keep the server-side device token fresh on every visit, unless the user
  // has explicitly opted out.
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted" && readStoredPref() !== "no") {
      requestNotificationPermission()
        .then((token) => token && registerDeviceToken(token))
        .catch(() => {});
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    if (typeof Notification === "undefined") {
      setStatus({ type: "error", text: "Notifications aren't supported in this browser." });
      setSaving(false);
      return;
    }

    if (enabled) {
      try {
        const token = await requestNotificationPermission();
        if (token) {
          await registerDeviceToken(token);
          writeStoredPref("yes");
          setStatus({ type: "success", text: "Notifications enabled." });
        } else if (Notification.permission === "denied") {
          setStatus({
            type: "error",
            text: "Your browser is blocking notifications for this site. Allow notifications in your browser's site settings, then click Save again.",
          });
        } else {
          setStatus({ type: "error", text: "Couldn't enable notifications. Please try again." });
        }
      } catch {
        setStatus({ type: "error", text: "Couldn't enable notifications. Please try again." });
      }
    } else {
      try {
        if (Notification.permission === "granted") {
          const token = await requestNotificationPermission().catch(() => null);
          if (token) await unregisterDeviceToken(token);
        }
      } finally {
        writeStoredPref("no");
        setStatus({ type: "success", text: "Notifications disabled." });
      }
    }

    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Bell size={18} className="mt-0.5 shrink-0" />
        <p className="text-sm">{message}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex overflow-hidden rounded-md border border-blue-300 text-sm font-medium">
          <button
            type="button"
            onClick={() => setEnabled(true)}
            className={`px-3 py-1.5 transition-colors ${
              enabled ? "bg-blue-600 text-white" : "bg-white text-blue-700 hover:bg-blue-100"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setEnabled(false)}
            className={`px-3 py-1.5 transition-colors ${
              !enabled ? "bg-blue-600 text-white" : "bg-white text-blue-700 hover:bg-blue-100"
            }`}
          >
            No
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {status && (
        <p
          className={`w-full text-xs ${
            status.type === "error" ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
