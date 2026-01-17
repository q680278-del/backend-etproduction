// Analytics endpoint (Vercel KV)
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    try {
        const analytics = await kv.get('analytics') || {
            visitors: [],
            pageViews: 0,
            uniqueVisitors: 0
        };

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Analytics fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics'
        });
    }
}
