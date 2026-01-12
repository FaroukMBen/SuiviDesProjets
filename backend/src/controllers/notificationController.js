const Notification = require('../models/Notification');
const Project = require('../models/Project');

exports.createInvitation = async (req, res) => {
    try {
        const { recipientId, projectId } = req.body;
        const senderId = req.user.id;

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

exports.sendCampaignNotification = async (req, res) => {
    try {
        const { recipientId, campaignId, message } = req.body;
        const senderId = req.user.id;

        const Campagne = require('../models/Campagne');

        await Campagne.findByIdAndUpdate(campaignId, {
            $addToSet: { participants: recipientId }
        });

        const notification = new Notification({
            recipient: recipientId,
            sender: senderId,
            type: 'INFO',
            campaign: campaignId,
            message: message || "Vous avez été ajouté à une campagne. Veuillez créer votre projet."
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
            if (notification.campaign) {
                const Campagne = require('../models/Campagne');
                const campaign = await Campagne.findById(notification.campaign);
                if (campaign) {
                    if (!campaign.participants) campaign.participants = [];
                    if (!campaign.participants.includes(req.user.id)) {
                        campaign.participants.push(req.user.id);
                        await campaign.save();
                    }
                }
            } else {
                const project = await Project.findById(notification.project);
                if (project) {
                    if (!project.members.some(m => m.toString() === req.user.id)) {
                        project.members.push(req.user.id);
                        await project.save();
                    }
                }
            }

            notification.actionStatus = 'accepted';

        } else {
            notification.actionStatus = 'declined';
        }

        notification.status = 'read';
        await notification.save();

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
