
import fetch from 'node-fetch';

async function test() {
    try {
        const res = await fetch('http://localhost:4000/api/notifications');
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
