import api from "./apiClient";

export const registerPushSubscription = async (subscription) => {
  if (!subscription?.endpoint) return;
  await api.patch("/api/users/me/push-subscription", { subscription });
};

export const unregisterPushSubscription = async (subscription) => {
  if (!subscription?.endpoint) return;
  await api.delete("/api/users/me/push-subscription", {
    data: { endpoint: subscription.endpoint },
  });
};
