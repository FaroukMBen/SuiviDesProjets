const express = require('express');
const ArchiveController = require('../controllers/archiveController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, ArchiveController.getArchives);
router.post('/:projectId', authenticate, authorize('instructor', 'admin'), ArchiveController.archiveProject);
router.get('/:projectId/export/pdf', authenticate, ArchiveController.exportProjectPDF);
router.get('/:projectId/export/csv', authenticate, ArchiveController.exportProjectCSV);

module.exports = router;
