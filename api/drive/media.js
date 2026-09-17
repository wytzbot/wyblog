export default function handler(_req, res) {
  res.status(503).json({ error: "Google Drive media upload is not configured. No media URL was created." });
}
