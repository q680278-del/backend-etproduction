// Notifications GET endpoint (serverless)
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    try {
        // Get notifications from Vercel KV
        const notifications = await kv.get('notifications') || [];

        // Filter only active notifications
        const activeNotifications = notifications.filter(n => n.is_active);

        res.json({
            success: true,
            notifications: activeNotifications
        });
    } catch (error) {
        console.error('Notifications fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
}
