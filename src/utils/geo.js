
/**
 * Get client IP address
 */
export function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'unknown';
}

/**
 * Fetch geolocation data for an IP
 */
export async function getGeolocation(ip) {
    // Skip for localhost/private IPs
    if (ip === 'unknown' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return {
            city: 'Local',
            region: 'Local',
            country: 'Local',
            timezone: 'Local'
        };
    }

    try {
        // Using ip-api.com (free, no key required, 45 req/min limit)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,timezone,isp`);
        const data = await response.json();

        if (data.status === 'success') {
            return {
                city: data.city || 'Unknown',
                region: data.regionName || 'Unknown',
                country: data.country || 'Unknown',
                countryCode: data.countryCode || 'Unknown',
                timezone: data.timezone || 'Unknown',
                isp: data.isp || 'Unknown'
            };
        }
    } catch (error) {
        console.error('Geolocation fetch error:', error);
    }

    return {
        city: 'Unknown',
        region: 'Unknown',
        country: 'Unknown',
        timezone: 'Unknown'
    };
}
