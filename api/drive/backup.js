export default function handler(_req, res) {
  res.status(503).json({ error: "Google Drive backup is not configured. No remote backup was created." });
}
