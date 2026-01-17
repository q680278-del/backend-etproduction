// Simple ping endpoint for health checks
export default function handler(req, res) {
  res.status(200).send('Server is alive!');
}
