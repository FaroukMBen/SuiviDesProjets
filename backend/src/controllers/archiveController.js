const Archive = require('../models/Archive');
const Project = require('../models/Project');
const ExportService = require('../services/exportService');

class ArchiveController {
  static async getArchives(req, res) {
    try {
      const archives = await Archive.find()
        .populate('projectId', 'title')
        .populate('archivedBy', 'name email')
        .sort({ archivedAt: -1 });

      res.json({ success: true, archives });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async archiveProject(req, res) {
    try {
      if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      }

      const project = await Project.findById(req.params.projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const { reason } = req.body;

      const archive = new Archive({
        projectId: req.params.projectId,
        projectData: project.toObject(),
        archivedBy: req.user.id,
        reason
      });

      await archive.save();

      project.status = 'archived';
      await project.save();

      await archive.populate('projectId', 'title').populate('archivedBy', 'name email');
      res.status(201).json({ success: true, archive });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async exportProjectPDF(req, res) {
    try {
      const project = await Project.findById(req.params.projectId)
        .populate('owner', 'name email')
        .populate('members', 'name email');

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const Evaluation = require('../models/Evaluation');
      const Task = require('../models/Task');
      const evaluations = await Evaluation.find({ projectId: req.params.projectId })
        .populate('evaluator', 'name email');
      const tasks = await Task.find({ projectId: req.params.projectId });

      const filepath = await ExportService.exportProjectToPDF(
        project,
        evaluations,
        tasks,
        `project-${project._id}.pdf`
      );

      res.download(filepath, `${project.title}.pdf`, (err) => {
        if (err) console.error('Download error:', err);
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async exportProjectCSV(req, res) {
    try {
      const project = await Project.findById(req.params.projectId)
        .populate('owner', 'name email')
        .populate('members', 'name email');

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const Evaluation = require('../models/Evaluation');
      const Task = require('../models/Task');
      const evaluations = await Evaluation.find({ projectId: req.params.projectId });
      const tasks = await Task.find({ projectId: req.params.projectId });

      const filepath = `project-${project._id}.csv`;
      await ExportService.exportProjectToCSV(project, evaluations, tasks, filepath);

      res.download(filepath, `${project.title}.csv`, (err) => {
        if (err) console.error('Download error:', err);
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = ArchiveController;
