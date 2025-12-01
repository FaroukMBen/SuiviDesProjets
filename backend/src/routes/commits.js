const express = require('express');
const CommitController = require('../controllers/commitController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/project/:projectId', authenticate, CommitController.getCommits);
router.get('/project/:projectId/stats', authenticate, CommitController.getCommitStats);
router.post('/sync/:projectId', authenticate, CommitController.syncCommitsFromGitHub);
router.post('/github-stats', authenticate, CommitController.getGitHubStats);
router.post('/', authenticate, CommitController.createCommit);

module.exports = router;
