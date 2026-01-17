// Admin login serverless endpoint
import rateLimit from 'express-rate-limit';

// Simple in-memory rate limiting for serverless
const loginAttempts = new Map();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'effendi12344';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sahdbasdbhkajbaksd';

function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Simple rate limiting check
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || [];
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000); // 15 min window

    if (recentAttempts.length >= 5) {
        return res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again later.'
        });
    }

    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateToken();

        // Clear attempts on successful login
        loginAttempts.delete(ip);

        return res.json({
            success: true,
            message: 'Login successful',
            token
        });
    }

    // Record failed attempt
    recentAttempts.push(now);
    loginAttempts.set(ip, recentAttempts);

    return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
    });
}
