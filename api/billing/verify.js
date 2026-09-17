export default function handler(_req, res) { res.status(503).json({ error: "Flutterwave verification is not configured. No subscription was activated." }); }
