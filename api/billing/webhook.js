import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAdminApp } from "../_auth.js";

const amounts = { NGN: 1000, USD: 1 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const expectedHash = process.env.FLW_WEBHOOK_SECRET_HASH;
  if (!expectedHash || req.headers["verif-hash"] !== expectedHash) return res.status(401).end();
  try {
    const payload = req.body || {};
    const data = payload.data || {};
    const userId = data.meta?.userId;
    const currency = data.currency;
    const validShape = data.status === "successful" && userId && amounts[currency] && Number(data.amount) >= amounts[currency] && String(data.tx_ref || "").includes(String(userId));
    let verified = false;
    if (validShape && data.id && process.env.FLW_SECRET_KEY) {
      const check = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(data.id)}/verify`, { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } });
      const checked = await check.json().catch(() => ({}));
      const payment = checked?.data;
      verified = check.ok && checked.status === "success" && payment?.status === "successful" && payment.currency === currency && Number(payment.amount) >= amounts[currency] && String(payment.tx_ref || "") === String(data.tx_ref || "");
    }
    const app = getAdminApp();
    if (verified && app) {
      const ref = getFirestore(app).doc(`users/${userId}`);
      if (payload.id || data.id) {
        const eventRef = getFirestore(app).doc(`paymentEvents/${String(payload.id || data.id)}`);
        const seen = await eventRef.get();
        if (!seen.exists) {
          await eventRef.set({ receivedAt: Timestamp.now(), type: payload.event || payload.type || "charge.completed" });
          await ref.set({ billing: { status: "active", plan: "pro", currency, amount: data.amount, transactionId: String(data.id), activeUntil: Timestamp.fromDate(new Date(Date.now() + 31*24*60*60*1000)), updatedAt: Timestamp.now() } }, { merge: true });
        }
      }
    } else if (userId && app && (data.status === "failed" || data.status === "cancelled")) {
      await getFirestore(app).doc(`users/${userId}`).set({ billing: { status: "inactive", plan: "free", updatedAt: Timestamp.now() } }, { merge: true });
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Webhook processing failed." });
  }
}
