const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireAdmin, UserController.getAllUsers);
router.get('/search', authenticate, UserController.searchUsers);
router.get('/students', authenticate, UserController.getStudents);
router.post('/', authenticate, requireAdmin, UserController.createUser);
router.put('/:id', authenticate, requireAdmin, UserController.updateUser);
router.delete('/:id', authenticate, requireAdmin, UserController.deleteUser);

module.exports = router;
