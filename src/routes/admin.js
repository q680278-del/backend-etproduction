import express from 'express';
import { getAnalytics, createAdminSession, verifyAdminSession, deleteAdminSession } from '../utils/analytics.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Admin credentials from environment variables (SECURE)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'effendi12344';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sahdbasdbhkajbaksd';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP per 15 min
    message: { success: false, message: 'Too many login attempts, please try again later.' }
});

/**
 * POST /api/admin/login
 * Admin login endpoint
 */
router.post('/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = createAdminSession(username);
        return res.json({
            success: true,
            token,
            message: 'Login successful'
        });
    }

    return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
    });
});

/**
 * GET /api/admin/analytics
 * Get visitor analytics (protected)
 */
router.get('/analytics', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token || !verifyAdminSession(token)) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    const analytics = getAnalytics();
    res.json({
        success: true,
        data: analytics
    });
});

/**
 * POST /api/admin/logout
 * Logout endpoint
 */
router.post('/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
        deleteAdminSession(token);
    }

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

export default router;
