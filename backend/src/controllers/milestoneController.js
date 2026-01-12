const Milestone = require('../models/Milestone');
const Campagne = require('../models/Campagne');

class MilestoneController {
    static async createMilestone(req, res) {
        try {
            const { campaignId, title, description, date, type } = req.body;

            if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Non autorisé' });
            }

            const campaign = await Campagne.findById(campaignId);
            if (!campaign) {
                return res.status(404).json({ success: false, message: 'Campagne introuvable' });
            }

            if (campaign.manager.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Vous n\'êtes pas le responsable de cette campagne' });
            }

            const milestone = new Milestone({
                campaign: campaignId,
                title,
                description,
                date,
                type
            });

            await milestone.save();
            res.status(201).json({ success: true, milestone });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async getMilestonesByCampaign(req, res) {
        try {
            const { campaignId } = req.params;
            const milestones = await Milestone.find({ campaign: campaignId }).sort({ date: 1 });
            res.json({ success: true, milestones });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async updateMilestone(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const milestone = await Milestone.findById(id).populate('campaign');
            if (!milestone) {
                return res.status(404).json({ success: false, message: 'Jalon introuvable' });
            }

            const campaign = milestone.campaign;
            if (campaign.manager.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Non autorisé' });
            }

            Object.assign(milestone, updates);
            await milestone.save();

            res.json({ success: true, milestone });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async deleteMilestone(req, res) {
        try {
            const { id } = req.params;

            const milestone = await Milestone.findById(id).populate('campaign');
            if (!milestone) {
                return res.status(404).json({ success: false, message: 'Jalon introuvable' });
            }

            const campaign = milestone.campaign;
            if (campaign.manager.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Non autorisé' });
            }

            await Milestone.findByIdAndDelete(id);
            res.json({ success: true, message: 'Jalon supprimé avec succès' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = MilestoneController;
