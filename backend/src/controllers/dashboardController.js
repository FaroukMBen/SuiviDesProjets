const Project = require('../models/Project');
const Task = require('../models/Task');
const Milestone = require('../models/Milestone');
const Evaluation = require('../models/Evaluation');
const mongoose = require('mongoose');

class DashboardController {

    static async getStudentStats(req, res) {
        try {
            const userId = req.user.id;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const allUserProjects = await Project.find({
                $or: [{ owner: userId }, { members: userId }],
                status: { $in: ['active', 'completed'] }
            }).populate('campaignId');


            const activeProjectsList = allUserProjects.filter(p => {
                if (p.status !== 'active') return false;
                if (!p.campaignId) return false;
                return new Date(p.campaignId.endDate) >= today;
            });
            const activeProjectsCount = activeProjectsList.length;



            const myTasksCount = await Task.countDocuments({
                assignee: userId,
                status: { $ne: 'done' }
            });



            const activeCampaignIds = activeProjectsList.map(p => p.campaignId._id);

            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            const upcomingMilestonesCount = await Milestone.countDocuments({
                campaign: { $in: activeCampaignIds },
                date: { $gte: today, $lte: nextWeek },
                type: 'livrable'
            });


            const nextCheckpoint = await Milestone.findOne({
                campaign: { $in: activeCampaignIds },
                date: { $gte: today },
                type: 'point_de_controle'
            })
                .sort({ date: 1 })
                .select('title date');


            res.status(200).json({
                success: true,
                stats: {
                    activeProjects: activeProjectsCount,
                    myTasks: myTasksCount,
                    upcomingDeadlines: upcomingMilestonesCount,
                    nextCheckpoint: nextCheckpoint
                }
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ success: false, message: "Erreur lors de la récupération des statistiques" });
        }
    }
}

module.exports = DashboardController;
