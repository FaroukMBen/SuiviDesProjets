const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

class ChatController {
    static async getConversations(req, res) {
        try {
            const conversations = await Conversation.find({ participants: req.user.id })
                .populate('participants', 'firstName lastName name email profilePicture role')
                .populate({
                    path: 'lastMessage',
                    populate: { path: 'sender', select: 'firstName lastName name' }
                })
                .sort({ updatedAt: -1 });

            res.json({ success: true, conversations });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async getMessages(req, res) {
        try {
            const { conversationId } = req.params;
            const conversation = await Conversation.findById(conversationId);
            if (!conversation.participants.includes(req.user.id)) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            const messages = await Message.find({ conversationId })
                .populate('sender', 'firstName lastName name profilePicture')
                .sort({ createdAt: 1 });
            res.json({ success: true, messages });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async sendMessage(req, res) {
        try {
            const { conversationId, content } = req.body;
            const senderId = req.user.id;

            const message = await Message.create({
                conversationId,
                sender: senderId,
                content,
                readBy: [senderId]
            });

            await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: message._id,
                updatedAt: Date.now()
            });

            await message.populate('sender', 'firstName lastName name profilePicture');

            res.json({ success: true, message });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async startConversation(req, res) {
        try {
            const { recipientId } = req.body;
            const senderId = req.user.id;

            if (!recipientId) return res.status(400).json({ success: false, message: 'Recipient ID is required' });

            let conversation = await Conversation.findOne({
                participants: { $all: [senderId, recipientId], $size: 2 },
                isGroup: false
            }).populate('participants', 'firstName lastName name email profilePicture role');

            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [senderId, recipientId],
                    isGroup: false
                });
                await conversation.populate('participants', 'firstName lastName name email profilePicture role');
            }

            res.json({ success: true, conversation });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async createGroup(req, res) {
        try {
            const { name } = req.body;
            const senderId = req.user.id;

            if (!name) return res.status(400).json({ message: 'Group name is required' });

            const conversation = await Conversation.create({
                name,
                isGroup: true,
                admin: senderId,
                participants: [senderId]
            });

            await conversation.populate('participants', 'firstName lastName name email profilePicture role');
            res.status(201).json({ success: true, conversation });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async inviteToGroup(req, res) {
        try {
            const { conversationId, recipientId } = req.body;
            const senderId = req.user.id;

            const conversation = await Conversation.findById(conversationId);
            if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
            if (!conversation.isGroup) return res.status(400).json({ message: 'Not a group chat' });

            if (conversation.admin.toString() !== senderId) {
                return res.status(403).json({ message: 'Only admin can invite' });
            }

            if (conversation.participants.includes(recipientId)) {
                return res.status(400).json({ message: 'User already in group' });
            }

            const notification = new Notification({
                recipient: recipientId,
                sender: senderId,
                type: 'INVITATION',
                conversation: conversationId,
                message: `Vous avez été invité à rejoindre le groupe de discussion "${conversation.name}"`
            });
            await notification.save();

            res.json({ success: true, message: 'Invitation sent' });

        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async leaveGroup(req, res) {
        try {
            const { conversationId } = req.body;
            const userId = req.user.id;

            const conversation = await Conversation.findById(conversationId);
            if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
            if (!conversation.isGroup) return res.status(400).json({ message: 'Not a group chat' });

            if (conversation.admin.toString() === userId) {
                return res.status(400).json({ message: 'Admin cannot leave the group. Delete it instead.' });
            }

            conversation.participants = conversation.participants.filter(p => p.toString() !== userId);
            await conversation.save();

            // Notify others
            const message = await Message.create({
                conversationId,
                sender: userId,
                content: "a quitté le groupe",
                readBy: [userId]
            });

            await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: message._id,
                updatedAt: Date.now()
            });

            res.json({ success: true, message: 'Left group successfully' });

        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async removeMember(req, res) {
        try {
            const { conversationId, userIdToRemove } = req.body;
            const senderId = req.user.id;

            const conversation = await Conversation.findById(conversationId);
            if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
            if (!conversation.isGroup) return res.status(400).json({ message: 'Not a group chat' });

            if (conversation.admin.toString() !== senderId) {
                return res.status(403).json({ message: 'Only admin can remove members' });
            }

            if (userIdToRemove === senderId) {
                return res.status(400).json({ message: 'Cannot remove yourself. Delete group instead.' });
            }

            conversation.participants = conversation.participants.filter(p => p.toString() !== userIdToRemove);
            await conversation.save();

            const message = await Message.create({
                conversationId,
                sender: senderId,
                content: "a retiré un membre du groupe",
                readBy: [senderId]
            });

            await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: message._id,
                updatedAt: Date.now()
            });

            res.json({ success: true, conversation });

        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async deleteConversation(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const conversation = await Conversation.findById(id);
            if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

            if (conversation.isGroup) {
                if (conversation.admin && conversation.admin.toString() !== userId) {
                    return res.status(403).json({ message: 'Only admin can delete this group' });
                }
            } else {
                if (!conversation.participants.map(p => p.toString()).includes(userId)) {
                    return res.status(403).json({ message: 'Not authorized' });
                }
            }

            await Message.deleteMany({ conversationId: id });
            await Conversation.findByIdAndDelete(id);

            res.json({ success: true, message: 'Conversation deleted' });

        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = ChatController;
