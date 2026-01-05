const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.get('/search', authenticate, UserController.searchUsers);

module.exports = router;
