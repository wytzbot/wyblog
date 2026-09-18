import { requireUser } from "../_auth.js";
import { randomUUID } from "node:crypto";

const PLANS = { NGN: "FLW_PAYMENT_PLAN_NGN", USD: "FLW_PAYMENT_PLAN_USD" };
const AMOUNTS = { NGN: 1000, USD: 1 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const user = await requireUser(req);
    const currency = req.body?.currency === "USD" ? "USD" : "NGN";
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "A valid billing email is required." });
    const secret = process.env.FLW_SECRET_KEY;
    const planId = process.env[PLANS[currency]];
    if (!secret) return res.status(503).json({ error: "Flutterwave secret key is not configured on the server." });
    if (!planId) return res.status(503).json({ error: `Flutterwave ${currency} monthly payment plan ID is not configured. Create a ${currency} plan for ${currency === "USD" ? "$1" : "₦1,000"}/month and set ${PLANS[currency]}.` });
    const tx_ref = `WYBLOG-PRO-${user.uid}-${randomUUID()}`;
    const origin = process.env.APP_URL || `https://${req.headers.host}`;
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        tx_ref, amount: AMOUNTS[currency], currency,
        redirect_url: `${origin}/?payment=return`,
        payment_plan: Number(planId),
        customer: { email },
        customizations: { title: "WyBlog Pro", description: "WyBlog Pro monthly subscription" },
        meta: { userId: user.uid, product: "wyblog-pro", currency, amount: AMOUNTS[currency] }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status !== "success" || !data.data?.link) {
      return res.status(502).json({ error: data.message || "Flutterwave could not create the checkout." });
    }
    return res.status(200).json({ checkoutUrl: data.data.link, txRef: tx_ref });
  } catch (error) {
    return res.status(error?.message === "Authentication required." ? 401 : 500).json({ error: error instanceof Error ? error.message : "Could not create checkout." });
  }
}
