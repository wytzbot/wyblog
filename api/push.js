import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey) return null;
  return initializeApp({ credential: cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey }) });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = req.headers.authorization || "";
  const expected = process.env.WYBLOG_PUSH_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) return res.status(401).json({ error: "Unauthorized notification request." });
  const { token, title, body, url } = req.body || {};
  if (typeof token !== "string" || !token || typeof title !== "string" || !title) return res.status(400).json({ error: "token and title are required" });
  try {
    const app = getAdminApp();
    if (!app) return res.status(503).json({ error: "Firebase Admin credentials are not configured. No notification was sent." });
    const messageId = await getMessaging(app).send({ token, notification: { title, body: typeof body === "string" ? body : "" }, data: { url: typeof url === "string" ? url : "/" } });
    return res.status(200).json({ messageId });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "FCM delivery failed. No successful delivery was claimed." });
  }
}
