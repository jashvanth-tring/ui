
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD7f53qpVhLjuBvskMLPYMxRY2rUHVBR5c",
  authDomain: "ta-tracker-e5c39.firebaseapp.com",
  projectId: "ta-tracker-e5c39",
  messagingSenderId: "157739526372",
  appId: "1:157739526372:web:025deed39185e9587a64f1",
});

const messaging = firebase.messaging();

/**
 * Resolve the app logo as an absolute URL so the OS notification centre
 * can fetch the image regardless of the service-worker scope.
 */
function getLogoUrl() {
  return (self.registration.scope || self.location.origin + "/") + "Logos/Logo.png";
}

/**
 * Background message handler — only fires when no visible client is open.
 * Shows a desktop notification with the app logo (like Gmail's sender avatar).
 */
messaging.onBackgroundMessage((payload) => {
  if (!self.clients || !self.clients.matchAll) return;

  self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      const isAppOpen = clients.some(
        (client) => client.visibilityState === "visible"
      );

      // Only show desktop notification when no visible tab exists
      if (!isAppOpen) {
        const title = payload.data?.title || "TA Tracker";
        const notificationId = payload.data?.notificationId || "";
        const logoUrl = getLogoUrl();

        self.registration.showNotification(title, {
          body: payload.data?.body || "You have a new notification",
          icon: logoUrl,
          badge: logoUrl,
          tag: "ta-notif-" + notificationId,   // prevents duplicate notifications
          timestamp: Date.now(),
          data: {
            route: payload.data?.route || "/dashboard",
            notificationId: notificationId,
          },
        });
      }

      // Notify ALL clients (including hidden tabs) so the bell badge
      // can update its count in real-time without waiting for tab focus.
      clients.forEach((client) => {
        client.postMessage({
          type: "NEW_NOTIFICATION",
          notificationId: payload.data?.notificationId || "",
          title: payload.data?.title || "",
          body: payload.data?.body || "",
        });
      });
    });
});

/**
 * Handle notification click — navigate to the correct page.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const route = event.notification.data?.route || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Try to reuse an existing tab
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(route);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(route);
        }
      })
  );
});
