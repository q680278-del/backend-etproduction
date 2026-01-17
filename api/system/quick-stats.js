// Simplified system stats for serverless (no systeminformation)
export default function handler(req, res) {
    // Vercel serverless - can't access real system metrics
    // Return mock/minimal data
    const stats = {
        cpu: {
            usage: 0, // Not available in serverless
            cores: 1
        },
        memory: {
            used: process.memoryUsage().heapUsed / 1024 / 1024, // MB
            total: process.memoryUsage().heapTotal / 1024 / 1024,
            percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
        },
        uptime: process.uptime(), // Function uptime, not server
        timestamp: new Date().toISOString()
    };

    res.json({
        success: true,
        data: stats
    });
}
