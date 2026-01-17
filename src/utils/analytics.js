import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSIONS_FILE = path.join(__dirname, '../../data/sessions.json');
const ANALYTICS_FILE = path.join(__dirname, '../../data/analytics.json');

// Ensure data directory exists
const dataDir = path.dirname(SESSIONS_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load sessions from disk
let sessions = new Map();
try {
    if (fs.existsSync(SESSIONS_FILE)) {
        const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
        const parsed = JSON.parse(data);
        sessions = new Map(Object.entries(parsed));
    }
} catch (error) {
    console.error('Failed to load sessions:', error);
}

// Load visitors from disk (simple persistence for analytics too)
let visitors = [];
try {
    if (fs.existsSync(ANALYTICS_FILE)) {
        const data = fs.readFileSync(ANALYTICS_FILE, 'utf8');
        visitors = JSON.parse(data);
    }
} catch (error) {
    console.error('Failed to load analytics:', error);
}

function saveSessions() {
    try {
        const obj = Object.fromEntries(sessions);
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2));
    } catch (error) {
        console.error('Failed to save sessions:', error);
    }
}

function saveAnalytics() {
    try {
        fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(visitors, null, 2));
    } catch (error) {
        console.error('Failed to save analytics:', error);
    }
}

/**
 * Log a new visitor
 * @param {Object} visitorData - { ip, userAgent, location, timestamp, path }
 */
export function logVisitor(visitorData) {
    const existingIndex = visitors.findIndex(v => v.ip === visitorData.ip);

    if (existingIndex !== -1) {
        // Update existing visitor: move to end (most recent) and update details
        const existing = visitors[existingIndex];
        visitors.splice(existingIndex, 1); // Remove from current position
        visitors.push({
            ...existing,
            ...visitorData,
            timestamp: visitorData.timestamp || new Date().toISOString()
        });
    } else {
        // New visitor
        visitors.push({
            id: Date.now().toString(), // Ensure unique string ID
            ...visitorData,
            timestamp: visitorData.timestamp || new Date().toISOString()
        });
    }

    // Limit analytics file size (keep last 1000 unique IPs)
    if (visitors.length > 1000) visitors = visitors.slice(-1000);
    saveAnalytics();
}

/**
 * Get all visitor analytics
 * @returns {Object} Analytics data
 */
export function getAnalytics() {
    const uniqueIPs = new Set(visitors.map(v => v.ip)).size;
    const totalVisits = visitors.length;

    // Group by IP to get visit count per IP
    const ipCounts = {};
    visitors.forEach(v => {
        ipCounts[v.ip] = (ipCounts[v.ip] || 0) + 1;
    });

    return {
        totalVisits,
        uniqueVisitors: uniqueIPs,
        visitors: visitors.slice().reverse(), // Most recent first
        topIPs: Object.entries(ipCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ip, count]) => ({ ip, count }))
    };
}

/**
 * Create admin session
 * @param {string} username 
 * @returns {string} sessionToken
 */
export function createAdminSession(username) {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessions.set(token, {
        username,
        createdAt: new Date().toISOString()
    });
    saveSessions();
    return token;
}

/**
 * Verify admin session
 * @param {string} token 
 * @returns {boolean}
 */
export function verifyAdminSession(token) {
    return sessions.has(token);
}

/**
 * Delete admin session
 * @param {string} token 
 * @returns {boolean}
 */
export function deleteAdminSession(token) {
    const deleted = sessions.delete(token);
    if (deleted) saveSessions();
    return deleted;
}
