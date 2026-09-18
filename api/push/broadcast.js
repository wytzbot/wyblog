import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAdminApp } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const expected = process.env.WYBLOG_PUSH_SECRET;
  if (!expected || req.headers.authorization !== `Bearer ${expected}`) return res.status(401).json({ error: "Unauthorized notification request." });
  const { title, body, url = "/" } = req.body || {};
  if (typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "title is required" });
  const app = getAdminApp();
  if (!app) return res.status(503).json({ error: "Firebase Admin credentials are not configured." });
  try {
    const snap = await getFirestore(app).collectionGroup("pushTokens").get();
    const tokens = [...new Set(snap.docs.map(d => d.data()?.token).filter(Boolean))];
    if (!tokens.length) return res.status(200).json({ sent: 0, failed: 0, message: "No registered notification tokens." });
    let sent = 0, failed = 0;
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      const result = await getMessaging(app).sendEachForMulticast({ tokens: batch, notification: { title: title.trim(), body: typeof body === "string" ? body : "" }, data: { url: String(url) } });
      sent += result.successCount; failed += result.failureCount;
    }
    return res.status(200).json({ sent, failed });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "FCM broadcast failed." });
  }
}
