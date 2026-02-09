const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const csvUpload = require('../middleware/csvUpload');

// ... existant ...
router.get('/', authenticate, requireAdmin, UserController.getAllUsers);
router.get('/search', authenticate, UserController.searchUsers);
router.get('/students', authenticate, UserController.getStudents);
router.post('/import-csv', authenticate, requireAdmin, csvUpload.single('file'), UserController.importStudents); // <--- ROUTE AJOUTÉE
router.post('/', authenticate, requireAdmin, UserController.createUser);
router.put('/:id', authenticate, requireAdmin, UserController.updateUser);
router.delete('/:id', authenticate, requireAdmin, UserController.deleteUser);

module.exports = router;
