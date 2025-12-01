const Evaluation = require('../models/Evaluation');
const Project = require('../models/Project');

class EvaluationController {
  static async getEvaluations(req, res) {
    try {
      const evaluations = await Evaluation.find({ projectId: req.params.projectId })
        .populate('evaluator', 'name email profilePicture');

      res.json({ success: true, evaluations });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createEvaluation(req, res) {
    try {
      const { projectId, criteria, feedback } = req.body;

      // Only instructors and admins can create evaluations
      if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      }

      // Calculate total score
      let totalScore = 0;
      let weightSum = 0;

      const processedCriteria = criteria.map(c => {
        totalScore += (c.score || 0) * (c.weight || 0);
        weightSum += c.weight || 0;
        return {
          name: c.name,
          weight: c.weight,
          maxScore: c.maxScore,
          score: c.score
        };
      });

      totalScore = weightSum > 0 ? (totalScore / weightSum).toFixed(2) : 0;

      const evaluation = new Evaluation({
        projectId,
        evaluator: req.user.id,
        criteria: processedCriteria,
        totalScore,
        feedback,
        status: 'completed'
      });

      await evaluation.save();
      await evaluation.populate('evaluator', 'name email profilePicture');

      res.status(201).json({ success: true, evaluation });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateEvaluation(req, res) {
    try {
      const { criteria, feedback } = req.body;

      const evaluation = await Evaluation.findById(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ success: false, message: 'Evaluation not found' });
      }

      if (evaluation.evaluator.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      if (criteria) {
        let totalScore = 0;
        let weightSum = 0;

        evaluation.criteria = criteria.map(c => {
          totalScore += (c.score || 0) * (c.weight || 0);
          weightSum += c.weight || 0;
          return {
            name: c.name,
            weight: c.weight,
            maxScore: c.maxScore,
            score: c.score
          };
        });

        evaluation.totalScore = weightSum > 0 ? (totalScore / weightSum).toFixed(2) : 0;
      }

      if (feedback) evaluation.feedback = feedback;

      await evaluation.save();
      await evaluation.populate('evaluator', 'name email profilePicture');

      res.json({ success: true, evaluation });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async deleteEvaluation(req, res) {
    try {
      const evaluation = await Evaluation.findById(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ success: false, message: 'Evaluation not found' });
      }

      if (evaluation.evaluator.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      await Evaluation.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Evaluation deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = EvaluationController;
