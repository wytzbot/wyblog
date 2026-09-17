export default function handler(_req, res) { res.status(503).json({ error: "Flutterwave webhook handling is not configured. No payment state was changed." }); }
