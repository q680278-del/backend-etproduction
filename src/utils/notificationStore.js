import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'notifications.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let notifications = [];

// Load notifications from file
try {
    if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        notifications = JSON.parse(fileContent);
    }
} catch (error) {
    console.error('Error loading notifications:', error);
    notifications = [];
}

const saveNotifications = () => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(notifications, null, 2));
    } catch (error) {
        console.error('Error saving notifications:', error);
    }
};

export const notificationStore = {
    getAll: () => {
        return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getActive: () => {
        return notifications
            .filter(n => n.isActive)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    add: (data) => {
        const newNotification = {
            id: Date.now().toString(),
            title: data.title,
            message: data.message,
            type: data.type || 'info', // info, success, warning, error
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: new Date().toISOString()
        };
        notifications.push(newNotification);
        saveNotifications();
        return newNotification;
    },

    update: (id, data) => {
        const index = notifications.findIndex(n => n.id === id);
        if (index === -1) return null;

        notifications[index] = {
            ...notifications[index],
            ...data,
            updatedAt: new Date().toISOString()
        };
        saveNotifications();
        return notifications[index];
    },

    delete: (id) => {
        const initialLength = notifications.length;
        notifications = notifications.filter(n => n.id !== id);
        if (notifications.length !== initialLength) {
            saveNotifications();
            return true;
        }
        return false;
    }
};

export default notificationStore;
