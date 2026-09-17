import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import { getMessaging, getToken, isSupported as messagingSupported, type Messaging } from "firebase/messaging";

// Firebase Web configuration is public client configuration.
// Admin/service-account credentials must remain server-side.
const firebaseConfig = {
  apiKey: "AIzaSyCYI8tN924j65vdbn1p-Yzk1d976e4EXwM",
  authDomain: "wyblog1.firebaseapp.com",
  projectId: "wyblog1",
  storageBucket: "wyblog1.firebasestorage.app",
  messagingSenderId: "336657144866",
  appId: "1:336657144866:web:1a02a0b711649104db3e7b",
  measurementId: "G-WM113Z61H2"
};

export const WYBLOG_FIREBASE_VAPID_KEY =
  "BH1T__qtyPE-_lKDnp5brBwF6Z4HW8q_24BP1R1HBfqb_lbE-rKmPwcAy-LAe9i3p-ZQE9NcJ2kFCbn9UBSeRGI";

export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

export async function initializeWyBlogAnalytics() {
  if (typeof window === "undefined") return null;
  try {
    if (!(await analyticsSupported())) return null;
    return getAnalytics(firebaseApp);
  } catch {
    return null;
  }
}

export async function getWyBlogMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  try {
    if (!(await messagingSupported())) return null;
    return getMessaging(firebaseApp);
  } catch {
    return null;
  }
}

/**
 * Requests notification permission and registers this browser for WyBlog FCM.
 * The resulting token can be sent to the server later for targeted notifications.
 */
export async function enableWyBlogNotifications(): Promise<{
  token: string | null;
  reason?: string;
}> {
  if (typeof window === "undefined") return { token: null, reason: "browser-only" };
  if (!("Notification" in window)) return { token: null, reason: "notifications-unsupported" };
  if (!("serviceWorker" in navigator)) return { token: null, reason: "service-worker-unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { token: null, reason: `permission-${permission}` };

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const messaging = await getWyBlogMessaging();
  if (!messaging) return { token: null, reason: "messaging-unsupported" };

  const token = await getToken(messaging, {
    vapidKey: WYBLOG_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration
  });

  if (!token) return { token: null, reason: "token-unavailable" };
  localStorage.setItem("wyblog_fcm_token", token);
  return { token };
}
