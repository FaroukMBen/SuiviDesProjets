const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.get('/search', authenticate, UserController.searchUsers);
router.get('/students', authenticate, UserController.getStudents);

module.exports = router;
