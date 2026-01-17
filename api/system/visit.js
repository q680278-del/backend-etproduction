import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Enable CORS for this specific function just in case
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { ip, city, country, userAgent, path } = req.body;
        const timestamp = new Date().toISOString();

        const visitData = {
            id: Date.now().toString(),
            ip: ip || req.headers['x-forwarded-for'] || 'unknown',
            city,
            country,
            userAgent,
            path,
            timestamp
        };

        // Store in KV: Add to 'visitors' list, keep last 100
        await kv.lpush('visitors', visitData);
        await kv.ltrim('visitors', 0, 99);

        // Update basic counter
        await kv.incr('total_visits');

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Visit log error:', error);
        // Don't fail the request significantly for logging
        res.status(200).json({ success: false, error: 'Logging failed but proceeding' });
    }
}
