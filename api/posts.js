export default function handler(_req, res) {
  res.status(503).json({ error: "Blogger server integration is not configured. No post was read or changed." });
}
