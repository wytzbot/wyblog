/* WyBlog Firebase Cloud Messaging service worker. */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCYI8tN924j65vdbn1p-Yzk1d976e4EXwM",
  authDomain: "wyblog1.firebaseapp.com",
  projectId: "wyblog1",
  storageBucket: "wyblog1.firebasestorage.app",
  messagingSenderId: "336657144866",
  appId: "1:336657144866:web:1a02a0b711649104db3e7b",
  measurementId: "G-WM113Z61H2"
};

try {
  importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js");

  firebase.initializeApp(FIREBASE_CONFIG);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || payload?.data?.title || "WyBlog";
    const body = payload?.notification?.body || payload?.data?.body || "Your blog has an update.";
    const url = payload?.fcmOptions?.link || payload?.data?.url || "/";

    self.registration.showNotification(title, {
      body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url }
    });
  });
} catch {
  // Never prevent the service worker from installing if Firebase is unavailable.
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
