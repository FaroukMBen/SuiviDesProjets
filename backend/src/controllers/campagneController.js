const Campaign = require('../models/Campagne');

class CampaignController {
  
  // Créer une nouvelle campagne
  static async createCampaign(req, res) {
    try {
      // On force le manager à être l'utilisateur connecté
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

  // Récupérer les campagnes (avec filtres)
  static async getAllCampaigns(req, res) {
    try {
      const filter = {};
      
      // 1. Filtre par statut (ex: active)
      if (req.query.status) filter.status = req.query.status;

      // 2. AJOUT : Filtre par manager (l'ID du prof)
      // Si l'URL contient ?manager=12345, on filtre là-dessus
      if (req.query.manager) filter.manager = req.query.manager;

      const campaigns = await Campaign.find(filter)
        .populate('manager', 'name email')
        .sort({ createdAt: -1 });

      res.json({ success: true, campaigns });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Récupérer une campagne par ID
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

  // Mettre à jour une campagne
  static async updateCampaign(req, res) {
    try {
      const campaign = await Campaign.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true } // Renvoie l'objet modifié
      );
      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campagne introuvable' });
      }
      res.json({ success: true, campaign });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Supprimer (ou archiver) une campagne
  static async deleteCampaign(req, res) {
    try {
      // Option 1 : Suppression physique
      // await Campaign.findByIdAndDelete(req.params.id);
      
      // Option 2 (Recommandée) : Soft delete (Archivage)
      await Campaign.findByIdAndUpdate(req.params.id, { status: 'archived' });
      
      res.json({ success: true, message: 'Campagne archivée avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = CampaignController;