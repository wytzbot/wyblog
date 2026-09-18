import { getFirestore } from "firebase-admin/firestore";
import { requireUser, getAdminApp } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const user = await requireUser(req);
    const app = getAdminApp();
    const snap = await getFirestore(app).doc(`users/${user.uid}`).get();
    const billing = snap.exists ? (snap.data()?.billing || {}) : {};
    const activeUntil = billing.activeUntil?.toDate?.() || (billing.activeUntil ? new Date(billing.activeUntil) : null);
    const active = billing.status === "active" && activeUntil && activeUntil.getTime() > Date.now();
    return res.status(200).json({ plan: active ? "pro" : "free", status: active ? "active" : (billing.status || "inactive"), activeUntil: activeUntil?.toISOString() || null });
  } catch (error) {
    return res.status(401).json({ error: error instanceof Error ? error.message : "Could not read subscription status." });
  }
}
