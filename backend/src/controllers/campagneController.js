const Campaign = require('../models/Campagne');

class CampaignController {

  static async createCampaign(req, res) {
    try {
      const campaign = new Campaign({
        ...req.body,
        manager: req.user.id
      });
      await campaign.save();
      res.status(201).json({ success: true, campaign });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getAllCampaigns(req, res) {
      try {
        let filter = {};

        // 1. Filtres optionnels (URL) valables pour tout le monde
        if (req.query.status) filter.status = req.query.status;

        // --- LOGIQUE DE SÉCURITÉ PAR RÔLE ---

        if (req.user.role === 'admin') {
          // ✅ ADMIN : Voit TOUT par défaut.
          // Peut filtrer par manager s'il le demande explicitement via l'URL
          if (req.query.manager) {
              filter.manager = req.query.manager;
          }
        
        } else if (req.user.role === 'instructor') {
          // ✅ INSTRUCTOR : Ne voit que SES campagnes
          filter.manager = req.user.id;

        } else if (req.user.role === 'student') {
          // ✅ STUDENT : Logique de ciblage complexe (On garde ton code)
          const userYear = req.user.academicYear;
          const userGroup = req.user.group;

          filter.$or = [
            {
              targetYear: userYear,
              $or: [
                { targetGroups: { $size: 0 } },   // Tableau vide = tout le monde
                { targetGroups: { $exists: false } }, // Champ inexistant = tout le monde
                { targetGroups: userGroup }       // Groupe spécifique match
              ]
            },
            { participants: req.user.id } // Si l'élève est déjà inscrit
          ];

          // Un élève ne voit jamais les brouillons
          filter.status = { $ne: 'draft' };
        }

        // Exécution
        const campaigns = await Campaign.find(filter)
          .populate('manager', 'name email')
          .sort({ createdAt: -1 });

        res.json({ success: true, campaigns });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
  }

  static async getCampaignById(req, res) {
    try {
      const campaign = await Campaign.findById(req.params.id)
        .populate('manager', 'name email');

      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campagne introuvable' });
      }
      res.json({ success: true, campaign });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateCampaign(req, res) {
    try {
      const campaign = await Campaign.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      res.status(200).json({ success: true, campaign });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  static async deleteCampaign(req, res) {
    try {
      await Campaign.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true, message: 'Campagne supprimée définitivement' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}

module.exports = CampaignController;