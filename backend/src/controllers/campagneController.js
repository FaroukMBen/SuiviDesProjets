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
      if (req.query.status && req.query.status !== 'all') {
        const statuses = req.query.status.split(',').filter(s => s.trim() !== '');
        if (statuses.length > 0) {
          filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
        }
      }
      if (req.query.targetYear && req.query.targetYear !== 'all') {
        const years = req.query.targetYear.split(',').filter(y => y.trim() !== '');
        if (years.length > 0) {
          filter.targetYear = years.length > 1 ? { $in: years } : years[0];
        }
      }
      if (req.query.search) {
        filter.title = { $regex: req.query.search, $options: 'i' };
      }

      // --- LOGIQUE DE SÉCURITÉ PAR RÔLE ---

      if (req.user.role === 'admin') {
        // ADMIN : Voit TOUT par défaut.
        // Peut filtrer par manager s'il le demande explicitement via l'URL
        if (req.query.manager) {
          filter.manager = req.query.manager;
        }

      } else if (req.user.role === 'instructor') {
        // INSTRUCTOR : Ne voit que SES campagnes (ou celles où il est co-gestionnaire)
        filter.$or = [
          { manager: req.user.id },
          { coManagers: req.user.id }
        ];

      } else if (req.user.role === 'student') {
        // STUDENT : Logique de ciblage complexe
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

      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 1000;
      const skip = (page - 1) * limit;

      // Exécution
      const total = await Campaign.countDocuments(filter);
      const campaigns = await Campaign.find(filter)
        .populate('manager', 'name email')
        .populate('coManagers', 'name email profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const Project = require('../models/Project');

      const campaignsWithStats = await Promise.all(campaigns.map(async (c) => {
        const projectCount = await Project.countDocuments({ campaignId: c._id });
        return {
          ...c.toObject(),
          projectCount
        };
      }));

      res.json({
        success: true,
        campaigns: campaignsWithStats,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getCampaignById(req, res) {
    try {
      const campaign = await Campaign.findById(req.params.id)
        .populate('manager', 'name email')
        .populate('coManagers', 'name email profilePicture');

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
      // 1. Vérifier les droits avant de modifier
      const existingCampaign = await Campaign.findById(req.params.id);

      if (!existingCampaign) {
        return res.status(404).json({ success: false, message: 'Campagne introuvable' });
      }

      const isManager = existingCampaign.manager.toString() === req.user.id;
      const isCoManager = existingCampaign.coManagers?.some(id => id.toString() === req.user.id);
      const isAdmin = req.user.role === 'admin';

      if (!isManager && !isCoManager && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Non autorisé à modifier cette campagne' });
      }

      // Déterminer les nouveaux co-managers ajoutés (si modification de coManagers)
      let newCoManagers = [];
      if (req.body.coManagers && Array.isArray(req.body.coManagers)) {
        const previousCoManagerIds = existingCampaign.coManagers.map(id => id.toString());
        newCoManagers = req.body.coManagers.filter(id => !previousCoManagerIds.includes(id));
      }

      // 2. Mise à jour
      const campaign = await Campaign.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('manager coManagers', 'name email');

      // 3. Envoyer les notifications aux nouveaux co-managers
      if (newCoManagers.length > 0) {
        const Notification = require('../models/Notification');
        const notifications = newCoManagers.map(recipientId => ({
          recipient: recipientId,
          sender: req.user.id,
          type: 'INFO',
          campaign: campaign._id,
          message: `Vous avez été ajouté en tant que co-gestionnaire à la campagne "${campaign.title}".`
        }));
        await Notification.insertMany(notifications);
      }

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

  static async getGroupsByYear(req, res) {
    try {
      const { year } = req.params;

      // On récupère toutes les campagnes de cette promo
      const campaigns = await Campaign.find({ targetYear: year }).select('targetGroups');

      // On extrait tous les groupes et on dédoublonne
      const allGroups = campaigns.reduce((acc, campaign) => {
        if (campaign.targetGroups && campaign.targetGroups.length > 0) {
          return acc.concat(campaign.targetGroups);
        }
        return acc;
      }, []);

      // Suppression des doublons via Set
      const uniqueGroups = [...new Set(allGroups)].sort();

      res.json({ success: true, groups: uniqueGroups });
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = CampaignController;