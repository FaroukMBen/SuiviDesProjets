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
      const filter = {};

      if (req.query.status) filter.status = req.query.status;

      if (req.query.manager) {
        filter.manager = req.query.manager;
      }

      if (req.query.scope === 'student' && req.user) {
        const userYear = req.user.academicYear;
        const userGroup = req.user.group;

        filter.$or = [
          {
            targetYear: userYear,
            $or: [
              { targetGroups: { $size: 0 } },
              { targetGroups: { $exists: false } },
              { targetGroups: userGroup }
            ]
          },
          { participants: req.user.id }
        ];

        if (!filter.status) {
          filter.status = { $ne: 'draft' };
        }
        console.log("Student Filter:", JSON.stringify(filter, null, 2));
      }

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