const express = require('express');
const ProjectController = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateProjectCreate } = require('../middleware/validation');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', authenticate, ProjectController.getAllProjects);
router.post('/', authenticate, validateProjectCreate, ProjectController.createProject);
router.get('/:id', authenticate, ProjectController.getProjectById);
router.put('/:id', authenticate, ProjectController.updateProject);
router.post('/:id/members', authenticate, ProjectController.addMember);
router.delete('/:id/members', authenticate, ProjectController.removeMember);
router.post('/:id/files', authenticate, upload.single('file'), ProjectController.uploadFile);
router.get('/files/:filename', ProjectController.streamFile);
router.delete('/:id/files/:fileId', authenticate, ProjectController.deleteFile);
router.delete('/:id', authenticate, ProjectController.deleteProject);

module.exports = router;
