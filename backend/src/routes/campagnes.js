const express = require('express');
const router = express.Router();
const CampaignController = require('../controllers/campagneController');
const { authenticate } = require('../middleware/auth'); // Ton middleware d'auth existant

// Middleware simple pour vérifier le rôle (à adapter selon ton auth)
const requireInstructor = (req, res, next) => {
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return res.status(403).json({ message: "Accès réservé aux enseignants" });
  }
  next();
};

// Routes Publiques (pour les étudiants connectés)
router.get('/', authenticate, CampaignController.getAllCampaigns);
router.get('/:id', authenticate, CampaignController.getCampaignById);

// Routes Protégées (Enseignants uniquement)
router.post('/', authenticate, requireInstructor, CampaignController.createCampaign);
router.put('/:id', authenticate, requireInstructor, CampaignController.updateCampaign);
router.delete('/:id', authenticate, requireInstructor, CampaignController.deleteCampaign);

module.exports = router;