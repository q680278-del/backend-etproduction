
async function testEndpoint() {
    try {
        const res = await fetch('http://localhost:4000/api/youtube/latest');
        console.log('Status:', res.status);
        if (!res.ok) {
            console.log('Text:', await res.text());
            return;
        }
        const data = await res.json();
        console.log('Data Items Length:', data.items?.length);
        if (data.items?.length > 0) {
            console.log('First Item:', JSON.stringify(data.items[0], null, 2));
        } else {
            console.log('Full Response:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testEndpoint();
