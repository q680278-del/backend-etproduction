
async function getCanonical() {
    const handle = '@EANDTPRODUCTIONOFFICIAL';
    console.log(`Fetching ${handle}...`);
    try {
        const res = await fetch(`https://www.youtube.com/${handle}`);
        const html = await res.text();

        // <link rel="canonical" href="https://www.youtube.com/channel/UC..."
        const match = html.match(/link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]+)"/);

        if (match && match[1]) {
            console.log(`FOUND CANONICAL ID: ${match[1]}`);
        } else {
            console.log("Canonical ID NOT FOUND.");
            // Dump title or other meta to see if we even got the page
            const title = html.match(/<title>(.*?)<\/title>/);
            console.log("Page Title:", title ? title[1] : "Unknown");
        }
    } catch (e) {
        console.error(e);
    }
}

getCanonical();
