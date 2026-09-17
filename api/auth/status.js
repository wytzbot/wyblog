export default function handler(_req, res) {
  // The real implementation must validate the server-side Blogger OAuth session.
  // Returning false is safer than treating a client flag as authentication.
  res.status(200).json({ connected: false });
}
