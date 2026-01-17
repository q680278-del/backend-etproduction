import express from 'express';
import systemMonitor from '../utils/systemMonitor.js';
import errorTracker from '../utils/errorTracker.js';
import { verifyAdminSession, logVisitor } from '../utils/analytics.js';
import { getClientIP, getGeolocation } from '../utils/geo.js';

const router = express.Router();

/**
 * Middleware to verify admin authentication
 */
const requireAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token || !verifyAdminSession(token)) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    next();
};

/**
 * GET /api/system/health
 * Get comprehensive system health metrics
 */
router.get('/health', requireAdmin, async (req, res) => {
    try {
        const health = await systemMonitor.getSystemHealth();

        if (!health) {
            return res.status(500).json({
                success: false,
                message: 'Failed to get system health'
            });
        }

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        console.error('System health error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * GET /api/system/quick-stats
 * Get quick stats (CPU, Memory only - for frequent polling)
 */
router.get('/quick-stats', requireAdmin, async (req, res) => {
    try {
        const stats = await systemMonitor.getQuickStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Quick stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * GET /api/system/errors
 * Get error logs with optional filters
 * Query params: type, severity, since, limit
 */
router.get('/errors', requireAdmin, (req, res) => {
    try {
        const { type, severity, since, limit } = req.query;

        const filters = {};
        if (type) filters.type = type;
        if (severity) filters.severity = severity;
        if (since) filters.since = since;
        if (limit) filters.limit = parseInt(limit);

        const errors = errorTracker.getErrors(filters);
        const stats = errorTracker.getStats();

        res.json({
            success: true,
            data: {
                errors,
                stats
            }
        });
    } catch (error) {
        console.error('Get errors error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * POST /api/system/errors
 * Log a new error (from frontend or API)
 * Body: { type, message, stack, url, line, column, userAgent, ... }
 */
router.post('/errors', (req, res) => {
    try {
        const { type, ...errorData } = req.body;

        let loggedError;

        switch (type) {
            case 'javascript':
                loggedError = errorTracker.logJavaScriptError(errorData);
                break;
            case 'api':
                loggedError = errorTracker.logApiError({
                    ...errorData,
                    ip: req.ip
                });
                break;
            case '404':
                loggedError = errorTracker.log404Error({
                    ...errorData,
                    ip: req.ip
                });
                break;
            default:
                loggedError = errorTracker.logError({
                    type: 'unknown',
                    ...errorData
                });
        }

        res.json({
            success: true,
            data: loggedError
        });
    } catch (error) {
        console.error('Log error error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to log error'
        });
    }
});

/**
 * DELETE /api/system/errors
 * Clear all errors
 */
router.delete('/errors', requireAdmin, (req, res) => {
    try {
        errorTracker.clearErrors();

        res.json({
            success: true,
            message: 'All errors cleared'
        });
    } catch (error) {
        console.error('Clear errors error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear errors'
        });
    }
});

/**
 * GET /api/system/stats
 * Get error statistics only
 */
router.get('/stats', requireAdmin, (req, res) => {
    try {
        const stats = errorTracker.getStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * POST /api/system/visit
 * Log a tracked visit from frontend
 */
router.post('/visit', async (req, res) => {
    try {
        const { path } = req.body;
        const ip = getClientIP(req);
        const userAgent = req.headers['user-agent'] || 'Unknown';

        // Fetch location
        const location = await getGeolocation(ip);

        const visitorData = {
            ip,
            userAgent,
            path: path || '/',
            location,
            timestamp: new Date().toISOString()
        };

        logVisitor(visitorData);

        // Emit real-time visitor update
        const io = req.app.get('io');
        if (io) {
            io.emit('visitor:new', visitorData);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Visit log error:', error);
        res.status(500).json({ success: false });
    }
});

export default router;

