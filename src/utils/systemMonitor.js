import si from 'systeminformation';
import os from 'os';

/**
 * System Monitor Utility
 * Provides real-time system health metrics
 */

class SystemMonitor {
    constructor() {
        this.startTime = Date.now();
    }

    /**
     * Get current CPU usage
     * @returns {Promise<number>} CPU usage percentage (0-100)
     */
    async getCpuUsage() {
        try {
            const cpuLoad = await si.currentLoad();
            return Math.round(cpuLoad.currentLoad);
        } catch (error) {
            console.error('Error getting CPU usage:', error);
            return 0;
        }
    }

    /**
     * Get memory (RAM) usage
     * @returns {Promise<Object>} Memory stats
     */
    async getMemoryUsage() {
        try {
            const mem = await si.mem();
            return {
                total: Math.round(mem.total / 1024 / 1024 / 1024 * 10) / 10, // GB
                used: Math.round(mem.used / 1024 / 1024 / 1024 * 10) / 10, // GB
                free: Math.round(mem.free / 1024 / 1024 / 1024 * 10) / 10, // GB
                usagePercent: Math.round((mem.used / mem.total) * 100)
            };
        } catch (error) {
            console.error('Error getting memory usage:', error);
            return { total: 0, used: 0, free: 0, usagePercent: 0 };
        }
    }

    /**
     * Get disk usage
     * @returns {Promise<Object>} Disk stats
     */
    async getDiskUsage() {
        try {
            const fsSize = await si.fsSize();
            // Get primary disk (usually C: on Windows or / on Linux)
            const primaryDisk = fsSize[0];

            return {
                total: Math.round(primaryDisk.size / 1024 / 1024 / 1024), // GB
                used: Math.round(primaryDisk.used / 1024 / 1024 / 1024), // GB
                free: Math.round((primaryDisk.size - primaryDisk.used) / 1024 / 1024 / 1024), // GB
                usagePercent: Math.round(primaryDisk.use),
                mount: primaryDisk.mount
            };
        } catch (error) {
            console.error('Error getting disk usage:', error);
            return { total: 0, used: 0, free: 0, usagePercent: 0, mount: '/' };
        }
    }

    /**
     * Get system uptime
     * @returns {Object} Uptime in various formats
     */
    getUptime() {
        const uptimeSeconds = os.uptime();
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        return {
            seconds: uptimeSeconds,
            formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
            days,
            hours,
            minutes
        };
    }

    /**
     * Get process uptime (how long the Node.js process has been running)
     * @returns {Object} Process uptime
     */
    getProcessUptime() {
        const uptimeSeconds = process.uptime();
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        return {
            seconds: uptimeSeconds,
            formatted: `${days}d ${hours}h ${minutes}m`,
            days,
            hours,
            minutes
        };
    }

    /**
     * Get comprehensive system health
     * @returns {Promise<Object>} All system metrics
     */
    async getSystemHealth() {
        try {
            const [cpu, memory, disk] = await Promise.all([
                this.getCpuUsage(),
                this.getMemoryUsage(),
                this.getDiskUsage()
            ]);

            const uptime = this.getUptime();
            const processUptime = this.getProcessUptime();

            return {
                cpu: {
                    usage: cpu,
                    cores: os.cpus().length,
                    model: os.cpus()[0]?.model || 'Unknown'
                },
                memory,
                disk,
                uptime,
                processUptime,
                platform: os.platform(),
                hostname: os.hostname(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting system health:', error);
            return null;
        }
    }

    /**
     * Get quick stats (for frequent polling)
     * @returns {Promise<Object>} Essential metrics only
     */
    async getQuickStats() {
        try {
            const [cpu, memory] = await Promise.all([
                this.getCpuUsage(),
                this.getMemoryUsage()
            ]);

            return {
                cpu: cpu,
                memoryPercent: memory.usagePercent,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error getting quick stats:', error);
            return { cpu: 0, memoryPercent: 0, timestamp: Date.now() };
        }
    }
}

// Export singleton instance
const systemMonitor = new SystemMonitor();

export default systemMonitor;

