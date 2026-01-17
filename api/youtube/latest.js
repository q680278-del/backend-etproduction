// YouTube RSS feed serverless endpoint
import { XMLParser } from 'fast-xml-parser';

const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCjzXFaKyIpKwO7CmH9YqXeQ';

export default async function handler(req, res) {
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
            link: entry.link?.['@_href'] || `https://www.youtube.com/watch?v=${entry['yt:videoId']}`
        }));

        res.json({ items });
    } catch (error) {
        console.error('YouTube fetch error:', error);
        res.status(500).json({ items: [], error: 'Failed to fetch videos' });
    }
}
