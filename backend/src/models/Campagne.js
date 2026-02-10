const mongoose = require('mongoose');

const subCriterionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  weight: { type: Number, default: 1 },
  maxScore: { type: Number, default: 20 }
}, { _id: false });

const templateCriterionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  weight: { type: Number, default: 1 },
  maxScore: { type: Number, default: 20 },
  subCriteria: [subCriterionSchema]
}, { _id: false });

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  academicYear: { type: String, required: true },
  tags: { type: [String], default: [] },

  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coManagers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'archived'],
    default: 'draft'
  },
  targetYear: {
    type: String,
    required: true
  },
  targetGroups: {
    type: [String],
    default: []
  },
  evaluationTemplate: [templateCriterionSchema],

  // Liste des participants explicites (invités)
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);