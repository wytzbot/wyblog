import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { requireUser, getAdminApp } from "../_auth.js";

const expected = { NGN: 1000, USD: 1 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const user = await requireUser(req);
    const transactionId = String(req.body?.transactionId || "");
    if (!transactionId) return res.status(400).json({ error: "transactionId is required." });
    const secret = process.env.FLW_SECRET_KEY;
    if (!secret) return res.status(503).json({ error: "Flutterwave secret key is not configured on the server." });
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, { headers: { Authorization: `Bearer ${secret}` } });
    const data = await response.json().catch(() => ({}));
    const payment = data?.data;
    const amountOk = payment && Number(payment.amount) >= Number(expected[payment.currency]);
    const metaUser = payment?.meta?.userId;
    if (!response.ok || data.status !== "success" || payment?.status !== "successful" || !amountOk || (metaUser && metaUser !== user.uid)) return res.status(400).json({ error: "Payment could not be verified. Pro was not activated." });
    const app = getAdminApp();
    await getFirestore(app).doc(`users/${user.uid}`).set({ billing: { status: "active", plan: "pro", currency: payment.currency, amount: payment.amount, transactionId: String(payment.id), activeUntil: Timestamp.fromDate(new Date(Date.now() + 31*24*60*60*1000)), updatedAt: Timestamp.now() } }, { merge: true });
    return res.status(200).json({ plan: "pro" });
  } catch (error) {
    return res.status(error?.message === "Authentication required." ? 401 : 500).json({ error: error instanceof Error ? error.message : "Payment verification failed." });
  }
}
