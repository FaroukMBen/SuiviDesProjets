const express = require('express');
const EvaluationController = require('../controllers/evaluationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/project/:projectId', authenticate, EvaluationController.getEvaluations);
router.post('/', authenticate, authorize('instructor', 'admin'), EvaluationController.createEvaluation);
router.put('/:id', authenticate, authorize('instructor', 'admin'), EvaluationController.updateEvaluation);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), EvaluationController.deleteEvaluation);

module.exports = router;
