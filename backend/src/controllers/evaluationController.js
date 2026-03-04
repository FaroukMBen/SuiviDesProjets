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

      if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      }

      // Helper function to process criteria recursively
      const processCriteria = (list) => {
        let earned = 0;
        let possible = 0;

        const processed = list.map(c => {
          let score = c.score || 0;
          let maxScore = c.maxScore || 20;

          // Process sub-criteria if any
          let subs;
          if (c.subCriteria && c.subCriteria.length > 0) {
            const subResult = processCriteria(c.subCriteria);
            subs = subResult.processed;
            // Parent score is sum of sub-criteria scores (simple sum)
            score = subs.reduce((acc, s) => acc + (s.score || 0), 0);
            // Parent maxScore is sum of sub-criteria maxScores
            maxScore = subs.reduce((acc, s) => acc + (s.maxScore || 0), 0);
          }

          earned += score * (c.weight || 1);
          possible += maxScore * (c.weight || 1);

          return {
            name: c.name,
            weight: c.weight,
            maxScore: maxScore,
            score: score,
            description: c.description,
            subCriteria: subs
          };
        });

        return { processed, earned, possible };
      };

      const result = processCriteria(criteria);

      // Calculate final score out of 20
      // If possible is 0 (empty grid), score is 0.
      let totalScore = result.possible > 0 ? ((result.earned / result.possible) * 20).toFixed(2) : 0;

      const evaluation = new Evaluation({
        projectId,
        evaluator: req.user.id,
        criteria: result.processed,
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
        // Helper function to process criteria recursively
        const processCriteria = (list) => {
          let earned = 0;
          let possible = 0;

          const processed = list.map(c => {
            let score = c.score || 0;
            let maxScore = c.maxScore || 20;

            // Process sub-criteria if any
            let subs;
            if (c.subCriteria && c.subCriteria.length > 0) {
              const subResult = processCriteria(c.subCriteria);
              subs = subResult.processed;
              score = subs.reduce((acc, s) => acc + (s.score || 0), 0);
              maxScore = subs.reduce((acc, s) => acc + (s.maxScore || 0), 0);
            }

            earned += score * (c.weight || 1);
            possible += maxScore * (c.weight || 1);

            return {
              name: c.name,
              weight: c.weight,
              maxScore: maxScore,
              score: score,
              description: c.description,
              subCriteria: subs
            };
          });

          return { processed, earned, possible };
        };

        const result = processCriteria(criteria);

        evaluation.criteria = result.processed;
        evaluation.totalScore = result.possible > 0 ? ((result.earned / result.possible) * 20).toFixed(2) : 0;
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
