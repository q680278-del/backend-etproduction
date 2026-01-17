
async function test() {
    // 1. Previous ID (24 chars)
    // 2. New ID (from canonical regex, might be truncated?)

    // Let's verify the Canonical one again from my visual check of previous step:
    // Output was: UCjzXFaKyIpKwO7CmH9YqXeQ

    const candidates = [
        'UCjzXFaKyIpKwwO7CmH9YqXeQ', // Double w
        'UCjzXFaKyIpKwO7CmH9YqXeQ'   // Single w
    ];

    for (const id of candidates) {
        console.log(`Checking ${id}...`);
        const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
        console.log(`Status: ${res.status}`);
    }
}

test();
