const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/invite', notificationController.createInvitation);
router.post('/campaign-notify', notificationController.sendCampaignNotification);
router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/:id/toggle', notificationController.toggleReadStatus);
router.put('/:id/restore', notificationController.restoreNotification);
router.post('/:id/respond', notificationController.respondToInvitation);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/:id/permanent', notificationController.permanentDeleteNotification);

module.exports = router;
