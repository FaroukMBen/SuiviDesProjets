const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/invite', notificationController.createInvitation);
router.post('/campaign-notify', notificationController.sendCampaignNotification);
router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.post('/:id/respond', notificationController.respondToInvitation);

module.exports = router;
