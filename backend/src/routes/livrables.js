const express = require('express');
const LivrableController = require('../controllers/livrableController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, LivrableController.getAllLivrables);

router.get('/:id', authenticate, LivrableController.getLivrableById);

router.put('/:id/validate', authenticate, LivrableController.validateLivrable);

module.exports = router;
