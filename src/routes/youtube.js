import express from 'express';
import { XMLParser } from 'fast-xml-parser';

const router = express.Router();

router.get('/latest', async (req, res) => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY;
        // Hardcoded ID for E & T PRODUCTION OFFICIAL as primary fallback
        const channelId = process.env.YOUTUBE_CHANNEL_ID || 'UCjzXFaKyIpKwO7CmH9YqXeQ';

        // Method 1: Official API (Priority if Key exists)
        if (apiKey) {
            try {
                const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&order=date&maxResults=6&type=video&channelId=${channelId}&key=${apiKey}`;
                const videosRes = await fetch(videosUrl);
                const videosData = await videosRes.json();

                if (videosData.items && videosData.items.length > 0) {
                    // Fetch Stats
                    const videoIds = videosData.items.map(v => v.id.videoId).join(',');
                    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`;
                    const statsRes = await fetch(statsUrl);
                    const statsData = await statsRes.json();
                    const statsMap = {};
                    (statsData.items || []).forEach(item => statsMap[item.id] = item.statistics);

                    const enrichedItems = videosData.items.map(item => ({
                        id: item.id.videoId,
                        snippet: item.snippet,
                        statistics: statsMap[item.id.videoId] || {}
                    }));
                    return res.json({ items: enrichedItems });
                }
            } catch (apiErr) {
                console.warn('YouTube Official API failed, switching to RSS fallback:', apiErr.message);
            }
        }

        // Method 2: RSS Feed (Fallback)
        console.log(`Using YouTube RSS Fallback for Channel ID: ${channelId}`);
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

        try {
            const rssRes = await fetch(rssUrl);

            if (!rssRes.ok) {
                console.error(`RSS Fetch Failed: ${rssRes.status} ${rssRes.statusText}`);
                return res.json({ items: [] });
            }

            const xmlData = await rssRes.text();
            const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
            const parsed = parser.parse(xmlData);

            const entries = parsed.feed?.entry || [];
            const list = Array.isArray(entries) ? entries : [entries];

            const mappedItems = list.slice(0, 6).map(entry => ({
                id: entry["yt:videoId"],
                snippet: {
                    title: entry.title,
                    description: entry["media:group"]?.["media:description"] || '',
                    thumbnails: {
                        high: { url: entry["media:group"]?.["media:thumbnail"]?.["@_url"] }
                    },
                    publishedAt: entry.published
                },
                statistics: {
                    viewCount: entry["media:group"]?.["media:community"]?.["media:statistics"]?.["@_views"] || '0',
                    likeCount: entry["media:group"]?.["media:community"]?.["media:starRating"]?.["@_count"] || '0'
                }
            }));

            res.json({ items: mappedItems });
        } catch (rssError) {
            console.error('YouTube RSS Fallback Error:', rssError.message);
            // Return empty array instead of crashing
            res.json({ items: [] });
        }

    } catch (error) {
        console.error('YouTube Fetch Error:', error);
        // Ensure we send a response even on critical errors
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to fetch YouTube videos', details: error.message });
        }
    }
});

export default router;
