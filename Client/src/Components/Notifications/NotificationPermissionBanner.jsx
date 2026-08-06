import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { requestNotificationPermission, listenForForegroundMessages } from "../../firebase";
import { registerDeviceToken } from "../../services/notifications";

const DISMISS_KEY = "sathee_notif_banner_dismissed";

const NotificationPermissionBanner = ({ showLeaveRequest = false }) => {
  const [visible, setVisible] = useState(false);

  // Decide whether to show the banner, or silently (re)register
  // the token if permission was already granted in an earlier visit.
  useEffect(() => {
    if (typeof Notification === "undefined") return;

    if (Notification.permission === "granted") {
      requestNotificationPermission()
        .then((token) => token && registerDeviceToken(token))
        .catch(() => {});
      return;
    }

    if (Notification.permission === "denied") return;

    if (localStorage.getItem(DISMISS_KEY) !== "1") {
      setVisible(true);
    }
  }, []);

  // Show a notification for messages that arrive while the tab is
  // open and focused (FCM doesn't auto-display these like background ones).
  useEffect(() => {
    listenForForegroundMessages((payload) => {
      const { title, body } = payload.notification || {};
      if (title && Notification.permission === "granted") {
        new Notification(title, { body: body || "", icon: "/favicon.svg" });
      }
    });
  }, []);

  const handleEnable = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) await registerDeviceToken(token);
    } catch (err) {
      console.error("Failed to enable notifications:", err);
    } finally {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <Bell size={18} className="shrink-0" />
        <p className="text-sm">
          Turn on notifications to get alerts for announcements{showLeaveRequest ? " and leave requests." : "."}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleEnable}
          className="text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
        >
          Enable
        </button>
        <button onClick={handleDismiss} aria-label="Dismiss" className="text-blue-400 hover:text-blue-600">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;