export default function handler(_req, res) { res.status(503).json({ error: "Google OAuth is not configured. No account connection was created." }); }
