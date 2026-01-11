const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['livrable', 'point_de_controle'], // 'livrable' implique un rendu de fichier, 'point_de_controle' implique une revue de code/projet sans fichier
    required: true,
    default: 'livrable'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Milestone', milestoneSchema);
