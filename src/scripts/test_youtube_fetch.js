import { XMLParser } from 'fast-xml-parser';

async function testYoutube() {
    console.log("Starting test...");
    // HARDCODED ID
    const channelId = 'UCjzXFaKyIpKwwO7CmH9YqXeQ';

    console.log(`Step 1: Fetching RSS for ${channelId}`);
    try {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const rssRes = await fetch(rssUrl);
        if (!rssRes.ok) {
            console.error(`FAILED: RSS Fetch failed status ${rssRes.status}`);
            return;
        }
        const xmlData = await rssRes.text();
        console.log(`SUCCESS: Fetched XML (Length: ${xmlData.length})`);

        console.log("Snippet:", xmlData.substring(0, 200));

        console.log("Step 2: Parsing XML");
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
        const parsed = parser.parse(xmlData);

        const entries = parsed.feed?.entry || [];
        const count = Array.isArray(entries) ? entries.length : (entries ? 1 : 0);
        console.log(`SUCCESS: Found ${count} entries`);

        if (count === 0) {
            console.log("WARNING: entries is empty. Feed might be empty or private?");
            console.log("Feed keys:", Object.keys(parsed.feed || {}));
        }

    } catch (e) {
        console.error('FAILED: RSS/XML Error:', e);
    }
}

testYoutube();
