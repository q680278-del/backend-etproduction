import express from 'express';
import notificationStore from '../utils/notificationStore.js';
import { verifyAdminSession } from '../utils/analytics.js';

const router = express.Router();

// Middleware to verify admin session
const isAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyAdminSession(token)) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Admin access required'
        });
    }
    next();
};

/**
 * GET /api/notifications
 * Public endpoint to get active notifications
 */
router.get('/', (req, res) => {
    try {
        const notifications = notificationStore.getActive();
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

/**
 * GET /api/notifications/all
 * Admin endpoint to get ALL notifications (including inactive)
 */
router.get('/all', isAdmin, (req, res) => {
    try {
        const notifications = notificationStore.getAll();
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

/**
 * POST /api/notifications
 * Admin endpoint to create a notification
 */
router.post('/', isAdmin, (req, res) => {
    try {
        const { title, message, type, isActive } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        const newNotification = notificationStore.add({ title, message, type, isActive });

        // Emit socket event if io is available
        const io = req.app.get('io');
        if (io && newNotification.isActive) {
            io.emit('notification:new', newNotification);
        }

        res.status(201).json({
            success: true,
            data: newNotification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create notification'
        });
    }
});

/**
 * PUT /api/notifications/:id
 * Admin endpoint to update a notification
 */
router.put('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedNotification = notificationStore.update(id, updates);

        if (!updatedNotification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Emit socket event for update
        const io = req.app.get('io');
        if (io) {
            io.emit('notification:update', updatedNotification);
        }

        res.json({
            success: true,
            data: updatedNotification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update notification'
        });
    }
});

/**
 * DELETE /api/notifications/:id
 * Admin endpoint to delete a notification
 */
router.delete('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const deleted = notificationStore.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Emit socket event for delete
        const io = req.app.get('io');
        if (io) {
            io.emit('notification:delete', { id });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
});

export default router;
