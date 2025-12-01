const express = require('express');
const FeedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/project/:projectId', authenticate, FeedbackController.getFeedback);
router.post('/', authenticate, FeedbackController.createFeedback);
router.post('/:id/reply', authenticate, FeedbackController.replyToFeedback);
router.delete('/:id', authenticate, FeedbackController.deleteFeedback);

module.exports = router;
