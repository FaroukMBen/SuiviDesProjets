const mongoose = require('mongoose');

const livrableSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    milestoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Milestone',
        required: false
    },
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    mimetype: String,
    uploadDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'revision_requested'],
        default: 'pending'
    },
    feedback: {
        type: String,
        default: ''
    },
    validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    validatedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Livrable', livrableSchema);
