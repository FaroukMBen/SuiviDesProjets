const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['INVITATION', 'INFO', 'MESSAGE'], required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campagne' },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    message: { type: String },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
    actionStatus: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
