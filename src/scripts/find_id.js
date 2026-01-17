
async function getID() {
    const handle = '@EANDTPRODUCTIONOFFICIAL';
    console.log(`Resolving ID for ${handle}...`);
    try {
        const res = await fetch(`https://www.youtube.com/${handle}`);
        const html = await res.text();

        // Look for channelId in various places
        const patterns = [
            /"channelId":"(UC[\w-]+)"/,
            /"externalId":"(UC[\w-]+)"/,
            /meta itemprop="channelId" content="(UC[\w-]+)"/,
            /data-channel-id="(UC[\w-]+)"/
        ];

        for (let p of patterns) {
            const m = html.match(p);
            if (m && m[1]) {
                console.log(`FOUND ID: ${m[1]}`);
                return;
            }
        }
        console.log("ID NOT FOUND in HTML. dumping snippet...");
        console.log(html.substring(0, 1000));
    } catch (e) {
        console.error(e);
    }
}

getID();
