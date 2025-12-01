const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectData: mongoose.Schema.Types.Mixed,
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  archivedAt: { type: Date, default: Date.now },
  reason: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Archive', archiveSchema);
