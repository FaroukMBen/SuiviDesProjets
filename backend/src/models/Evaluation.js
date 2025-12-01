const mongoose = require('mongoose');

const criterionSchema = new mongoose.Schema({
  name: String,
  weight: Number,
  maxScore: Number,
  score: Number
});

const evaluationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  criteria: [criterionSchema],
  totalScore: Number,
  feedback: String,
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);
