export default function handler(_req, res) { res.status(503).json({ error: "Google OAuth callback is not configured. No Blogger session was created." }); }
