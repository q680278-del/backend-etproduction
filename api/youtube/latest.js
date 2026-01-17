// YouTube RSS feed serverless endpoint
import { XMLParser } from 'fast-xml-parser';

const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCjzXFaKyIpKwO7CmH9YqXeQ';

export default async function handler(req, res) {
    console.log('YouTube Endpoint Hit');
    console.log('API Key Present:', !!process.env.YOUTUBE_API_KEY);

    try {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

        const response = await fetch(rssUrl);
        const xmlText = await response.text();

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_'
        });

        const result = parser.parse(xmlText);
        const entries = result.feed?.entry || [];
        const videos = Array.isArray(entries) ? entries : [entries];

        const items = videos.slice(0, 6).map(entry => ({
            id: entry['yt:videoId'],
            title: entry.title,
            description: entry['media:group']?.['media:description'] || '',
            thumbnail: entry['media:group']?.['media:thumbnail']?.['@_url'] || '',
            published: entry.published,
            link: entry.link?.['@_href'] || `https://www.youtube.com/watch?v=${entry['yt:videoId']}`,
            views: 0,
            likes: 0
        }));

        // Fetch statistics if API Key is available
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (apiKey && items.length > 0) {
            try {
                const ids = items.map(i => i.id).join(',');
                const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${apiKey}`;

                const statsRes = await fetch(statsUrl);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    const statsMap = {};

                    if (statsData.items) {
                        statsData.items.forEach(item => {
                            statsMap[item.id] = {
                                views: item.statistics?.viewCount || 0,
                                likes: item.statistics?.likeCount || 0
                            };
                        });

                        // Merge stats
                        items.forEach(item => {
                            if (statsMap[item.id]) {
                                item.views = Number(statsMap[item.id].views);
                                item.likes = Number(statsMap[item.id].likes);
                            }
                        });
                    }
                }
            } catch (statsErr) {
                console.error('Failed to fetch YouTube stats:', statsErr);
                // Continue without stats if this fails
            }
        }

        res.json({ items });
    } catch (error) {
        console.error('YouTube fetch error:', error);
        res.status(500).json({ items: [], error: 'Failed to fetch videos' });
    }
}
