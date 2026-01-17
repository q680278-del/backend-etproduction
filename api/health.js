// Health check endpoint
export default function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    message: 'E & T PRODUCTION Backend is running (Vercel Serverless)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}
