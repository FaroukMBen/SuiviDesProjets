const express = require('express');
const router = express.Router();
const ganttTaskController = require('../controllers/ganttTaskController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, ganttTaskController.createTask);
router.get('/project/:projectId', authenticate, ganttTaskController.getTasksByProject);
router.put('/:taskId', authenticate, ganttTaskController.updateTask);
router.delete('/:taskId', authenticate, ganttTaskController.deleteTask);

module.exports = router;
