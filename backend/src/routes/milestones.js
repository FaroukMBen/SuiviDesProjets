const express = require('express');
const router = express.Router();
const MilestoneController = require('../controllers/milestoneController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', MilestoneController.createMilestone);
router.get('/campaign/:campaignId', MilestoneController.getMilestonesByCampaign);
router.put('/:id', MilestoneController.updateMilestone);
router.delete('/:id', MilestoneController.deleteMilestone);

module.exports = router;
