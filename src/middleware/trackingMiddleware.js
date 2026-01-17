import { logVisitor } from '../utils/analytics.js';
import { getClientIP, getGeolocation } from '../utils/geo.js';

/**
 * Tracking middleware - logs all requests
 */
export async function trackingMiddleware(req, res, next) {
    // Skip tracking for admin and API endpoints to avoid clutter
    if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/youtube') || req.path.startsWith('/api/system')) {
        return next();
    }

    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const path = req.path;

    // Fetch location asynchronously (don't block the request)
    getGeolocation(ip).then(location => {
        const visitorData = {
            ip,
            userAgent,
            path,
            location,
            timestamp: new Date().toISOString()
        };

        logVisitor(visitorData);

        // Emit real-time visitor update via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('visitor:new', visitorData);
        }
    }).catch(err => {
        // Log without location if geolocation fails
        const visitorData = {
            ip,
            userAgent,
            path,
            location: { city: 'Error', region: 'Error', country: 'Error' },
            timestamp: new Date().toISOString()
        };

        logVisitor(visitorData);

        // Still emit the event even on geolocation error
        const io = req.app.get('io');
        if (io) {
            io.emit('visitor:new', visitorData);
        }
    });

    next();
}
