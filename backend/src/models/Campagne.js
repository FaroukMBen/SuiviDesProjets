const mongoose = require('mongoose');

const templateCriterionSchema = new mongoose.Schema({
  name: { type: String, required: true },      // ex: "Qualité du code"
  weight: { type: Number, default: 1 },        // Coefficient
  maxScore: { type: Number, default: 20 }      // Note sur 20 par défaut
}, { _id: false }); // Pas besoin d'ID pour ces sous-objets

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },        // ex: "Projets de Fin d'Études 2025"
  description: String,
  academicYear: { type: String, required: true }, // ex: "2024-2025"
  
  // Le responsable de cette campagne (ex: le chef de département)
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  status: { 
    type: String, 
    enum: ['draft', 'active', 'closed', 'archived'], 
    default: 'draft' 
  },

  // C'est ICI qu'on définit la grille "Type" pour tous les projets de la campagne
  evaluationTemplate: [templateCriterionSchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);