const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  githubCommitId: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Infos auteur GitHub (réelles, extraites de chaque commit)
  githubAuthor: {
    login: String,
    avatarUrl: String,
    name: String
  },
  message: String,
  description: { type: String, default: '' },
  url: String,
  verified: { type: Boolean, default: false },
  timestamp: Date,
  branch: { type: String, default: 'main' },
  branches: [{ type: String }],
  filesChanged: { type: Number, default: 0 },
  insertions: { type: Number, default: 0 },
  deletions: { type: Number, default: 0 },
  files: [{
    filename: String,
    status: String,
    additions: Number,
    deletions: Number
  }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index composé pour éviter les doublons par projet
commitSchema.index({ githubCommitId: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('Commit', commitSchema);
