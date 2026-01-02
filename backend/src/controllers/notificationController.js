const Notification = require('../models/Notification');
const Project = require('../models/Project');

// Create an invitation
exports.createInvitation = async (req, res) => {
    try {
        const { recipientId, projectId } = req.body;
        const senderId = req.user.id; // Assumes auth middleware populates req.user

        const notification = new Notification({
            recipient: recipientId,
            sender: senderId,
            type: 'INVITATION',
            project: projectId,
            message: `Vous avez été invité à rejoindre le projet.`,
        });

        await notification.save();
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get notifications for a user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .populate('sender', 'name email')
            .populate('project', 'title')
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(
            id,
            { status: 'read' },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Respond to invitation
exports.respondToInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'accept' or 'decline'

        if (!['accept', 'decline'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (action === 'accept') {
            const project = await Project.findById(notification.project);
            if (project) {
                const fs = require('fs');
                try { fs.appendFileSync('debug.log', `[${new Date().toISOString()}] Project found. Adding member: ${req.user.id}\n`); } catch (e) { }
                // Check if already a member
                if (!project.members.some(m => m.toString() === req.user.id)) {
                    project.members.push(req.user.id);
                    await project.save();
                    try { fs.appendFileSync('debug.log', `[${new Date().toISOString()}] Member added to project\n`); } catch (e) { }
                } else {
                    try { fs.appendFileSync('debug.log', `[${new Date().toISOString()}] Member already in project\n`); } catch (e) { }
                }
            } else {
                try { fs.appendFileSync('debug.log', `[${new Date().toISOString()}] Project not found for invitation: ${notification.project}\n`); } catch (e) { }
            }
            notification.actionStatus = 'accepted';

            // Notify sender that invitation was accepted (Optional - can be done by creating another notification)
            const acceptanceNotification = new Notification({
                recipient: notification.sender,
                sender: req.user.id,
                type: 'INFO',
                project: notification.project,
                message: `Votre invitation pour rejoindre le projet a été acceptée.`,
            });
            await acceptanceNotification.save();

        } else {
            notification.actionStatus = 'declined';
            // Notify sender that invitation was declined
            const declineNotification = new Notification({
                recipient: notification.sender,
                sender: req.user.id,
                type: 'INFO',
                project: notification.project,
                message: `Votre invitation pour rejoindre le projet a été refusée.`,
            });
            await declineNotification.save();
        }

        notification.status = 'read';
        await notification.save();

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
