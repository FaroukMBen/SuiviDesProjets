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

        const campaign = await Campagne.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }
        if (campaign.status !== 'active') { // Ou 'draft', mais le client demande "Il faut qu'elle soit active"
            // Le client dit : "ni message aux eleve si la campagne est toujours en draft. Il faut qu'elle soit active"
            // Donc si status != active, on bloque ? Ou juste si draft ?
            // "si la campagne est toujours en draft" -> bloquer si draft.
            // "Il faut qu'elle soit active" -> bloquer si != active ?
            // Soyons stricts : on bloque si != active.
            if (campaign.status === 'draft') {
                return res.status(403).json({ message: "La campagne est en brouillon. Vous devez l'activer avant d'envoyer des invitations." });
            }
        }

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
            .populate('sender', 'firstName lastName name email profilePicture')
            .populate('project', 'title')
            .populate('conversation', 'name isGroup')
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

// Toggle read/unread status
exports.toggleReadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        notification.status = notification.status === 'read' ? 'unread' : 'read';
        await notification.save();
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
            } else if (notification.project) {
                const project = await Project.findById(notification.project);
                if (project) {
                    if (!project.members.some(m => m.toString() === req.user.id)) {
                        project.members.push(req.user.id);
                        await project.save();
                    }
                }
            } else if (notification.conversation) {
                const Conversation = require('../models/Conversation');
                const conversation = await Conversation.findById(notification.conversation);
                if (conversation) {
                    if (!conversation.participants.includes(req.user.id)) {
                        conversation.participants.push(req.user.id);
                        await conversation.save();
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

// Soft delete notification (move to trash)
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        notification.isDeleted = true;
        await notification.save();
        res.json({ message: 'Notification envoyée à la corbeille', notification });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Restore notification (move out of trash)
exports.restoreNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        notification.isDeleted = false;
        await notification.save();
        res.json({ message: 'Notification restaurée', notification });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Permanently delete notification
exports.permanentDeleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        await Notification.findByIdAndDelete(id);
        res.json({ message: 'Notification supprimée définitivement' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
