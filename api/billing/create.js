export default function handler(_req, res) {
  res.status(503).json({ error: "Flutterwave server checkout is not configured. No payment was created." });
}
