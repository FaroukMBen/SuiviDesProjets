const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  githubCommitId: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  url: String,
  timestamp: Date,
  filesChanged: Number,
  insertions: Number,
  deletions: Number,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Commit', commitSchema);
