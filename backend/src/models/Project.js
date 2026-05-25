const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['waiting', 'active', 'in_progress', 'completed', 'archived'], default: 'active' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  repositoryUrl: String,
  banner: String,
  startDate: Date,
  deadline: Date,
  tags: [String],
  files: [{
    name: String, // Titre du livrable
    description: String,
    filename: String, // Nom physique du fichier
    path: String,
    mimetype: String,
    uploadedAt: { type: Date, default: Date.now },
    milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' }
  }],
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);