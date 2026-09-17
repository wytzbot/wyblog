export default function handler(_req, res) {
  res.status(503).json({ error: "Site-wide diagnosis backend is not configured. No diagnosis credit was consumed." });
}
