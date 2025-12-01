const Feedback = require('../models/Feedback');

class FeedbackController {
  static async getFeedback(req, res) {
    try {
      const feedback = await Feedback.find({ projectId: req.params.projectId })
        .populate('author', 'name email profilePicture')
        .populate('replies.author', 'name email profilePicture')
        .sort({ createdAt: -1 });

      res.json({ success: true, feedback });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createFeedback(req, res) {
    try {
      const { projectId, content, type } = req.body;

      const feedback = new Feedback({
        projectId,
        author: req.user.id,
        content,
        type: type || 'comment'
      });

      await feedback.save();
      await feedback.populate('author', 'name email profilePicture');

      res.status(201).json({ success: true, feedback });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async replyToFeedback(req, res) {
    try {
      const { content } = req.body;

      const feedback = await Feedback.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            replies: {
              author: req.user.id,
              content
            }
          }
        },
        { new: true }
      )
        .populate('author', 'name email profilePicture')
        .populate('replies.author', 'name email profilePicture');

      if (!feedback) {
        return res.status(404).json({ success: false, message: 'Feedback not found' });
      }

      res.json({ success: true, feedback });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async deleteFeedback(req, res) {
    try {
      const feedback = await Feedback.findById(req.params.id);
      if (!feedback) {
        return res.status(404).json({ success: false, message: 'Feedback not found' });
      }

      if (feedback.author.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      await Feedback.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Feedback deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = FeedbackController;
