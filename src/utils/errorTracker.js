/**
 * Error Tracker Utility
 * Tracks and stores JavaScript errors, API errors, and 404 pages
 */

class ErrorTracker {
    constructor() {
        // In-memory storage (last 100 errors)
        this.errors = [];
        this.maxErrors = 100;

        // Error statistics
        this.stats = {
            totalErrors: 0,
            jsErrors: 0,
            apiErrors: 0,
            notFoundErrors: 0,
            lastReset: new Date()
        };
    }

    /**
     * Log a new error
     * @param {Object} errorData - Error information
     */
    logError(errorData) {
        const error = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            ...errorData
        };

        // Add to errors array
        this.errors.unshift(error);

        // Keep only last maxErrors
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }

        // Update statistics
        this.stats.totalErrors++;

        switch (error.type) {
            case 'javascript':
                this.stats.jsErrors++;
                break;
            case 'api':
                this.stats.apiErrors++;
                break;
            case '404':
                this.stats.notFoundErrors++;
                break;
        }

        console.error(`[ERROR TRACKER] ${error.type}:`, error.message);

        return error;
    }

    /**
     * Log a JavaScript error from frontend
     * @param {Object} jsError - JS error details
     */
    logJavaScriptError({ message, stack, url, line, column, userAgent }) {
        return this.logError({
            type: 'javascript',
            message,
            stack,
            url,
            line,
            column,
            userAgent,
            severity: 'error'
        });
    }

    /**
     * Log an API error
     * @param {Object} apiError - API error details
     */
    logApiError({ method, endpoint, statusCode, message, ip }) {
        return this.logError({
            type: 'api',
            method,
            endpoint,
            statusCode,
            message,
            ip,
            severity: statusCode >= 500 ? 'critical' : 'warning'
        });
    }

    /**
     * Log a 404 not found error
     * @param {Object} notFoundData - 404 details
     */
    log404Error({ path, method, referrer, ip, userAgent }) {
        return this.logError({
            type: '404',
            message: `Page not found: ${path}`,
            path,
            method,
            referrer,
            ip,
            userAgent,
            severity: 'info'
        });
    }

    /**
     * Get all errors
     * @param {Object} filters - Optional filters
     * @returns {Array} Filtered errors
     */
    getErrors(filters = {}) {
        let filteredErrors = [...this.errors];

        // Filter by type
        if (filters.type) {
            filteredErrors = filteredErrors.filter(e => e.type === filters.type);
        }

        // Filter by severity
        if (filters.severity) {
            filteredErrors = filteredErrors.filter(e => e.severity === filters.severity);
        }

        // Filter by time range
        if (filters.since) {
            const sinceDate = new Date(filters.since);
            filteredErrors = filteredErrors.filter(e => new Date(e.timestamp) >= sinceDate);
        }

        // Limit results
        const limit = filters.limit || 50;
        return filteredErrors.slice(0, limit);
    }

    /**
     * Get error statistics
     * @returns {Object} Error stats
     */
    getStats() {
        // Calculate errors in last 24 hours
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recent = this.errors.filter(e => new Date(e.timestamp) >= last24h);

        return {
            ...this.stats,
            last24h: {
                total: recent.length,
                jsErrors: recent.filter(e => e.type === 'javascript').length,
                apiErrors: recent.filter(e => e.type === 'api').length,
                notFoundErrors: recent.filter(e => e.type === '404').length
            },
            recentErrors: this.errors.slice(0, 5) // Last 5 errors
        };
    }

    /**
     * Clear all errors
     */
    clearErrors() {
        this.errors = [];
        this.stats = {
            totalErrors: 0,
            jsErrors: 0,
            apiErrors: 0,
            notFoundErrors: 0,
            lastReset: new Date()
        };
    }

    /**
     * Clear old errors (older than specified days)
     * @param {number} days - Days to keep
     */
    clearOldErrors(days = 7) {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const beforeCount = this.errors.length;

        this.errors = this.errors.filter(e => new Date(e.timestamp) >= cutoffDate);

        const removed = beforeCount - this.errors.length;
        console.log(`[ERROR TRACKER] Cleared ${removed} old errors`);

        return removed;
    }
}

// Export singleton instance
const errorTracker = new ErrorTracker();

// Auto-cleanup old errors every 24 hours
setInterval(() => {
    errorTracker.clearOldErrors(7);
}, 24 * 60 * 60 * 1000);

export default errorTracker;

