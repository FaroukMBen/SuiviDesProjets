const express = require('express');
const TaskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const { validateTaskCreate } = require('../middleware/validation');

const router = express.Router();

// Route pour récupérer toutes les tâches (assignées + non assignées) des projets de l'user
router.get('/my-global-tasks', authenticate, TaskController.getMyGlobalTasks);

router.get('/', authenticate, TaskController.getMyTasks);
router.get('/project/:projectId', authenticate, TaskController.getTasksByProject);
router.post('/', authenticate, validateTaskCreate, TaskController.createTask);
router.put('/:id', authenticate, TaskController.updateTask);
router.post('/reorder', authenticate, TaskController.reorderTasks);
router.delete('/:id', authenticate, TaskController.deleteTask);

module.exports = router;
