const Project = require('../models/Project');
const Task = require('../models/Task');

class ProjectController {
  static async getAllProjects(req, res) {
    try {
      const projects = await Project.find({
        $or: [{ owner: req.user.id }, { members: req.user.id }]
      })
        .populate('owner members', 'name email profilePicture')
        .sort({ createdAt: -1 });

      res.json({ success: true, projects });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createProject(req, res) {
    try {
      const { title, description, repositoryUrl, deadline, tags } = req.body;

      const project = new Project({
        title,
        description,
        repositoryUrl,
        deadline,
        tags: tags || [],
        owner: req.user.id,
        members: [req.user.id],
        status: 'active'
      });

      await project.save();
      await project.populate('owner members', 'name email profilePicture');

      res.status(201).json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getProjectById(req, res) {
    try {
      const project = await Project.findById(req.params.id)
        .populate('owner members', 'name email profilePicture');

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // Check access
      const isOwner = project.owner._id.toString() === req.user.id;
      const isMember = project.members.some(m => m._id.toString() === req.user.id);

      if (!isOwner && !isMember && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateProject(req, res) {
    try {
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const { title, description, repositoryUrl, deadline, tags, status } = req.body;

      if (title) project.title = title;
      if (description) project.description = description;
      if (repositoryUrl) project.repositoryUrl = repositoryUrl;
      if (deadline) project.deadline = deadline;
      if (tags) project.tags = tags;
      if (status) project.status = status;

      await project.save();
      await project.populate('owner members', 'name email profilePicture');

      res.json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async addMember(req, res) {
    try {
      const { userId } = req.body;
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      if (!project.members.includes(userId)) {
        project.members.push(userId);
        await project.save();
      }

      await project.populate('owner members', 'name email profilePicture');
      res.json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async removeMember(req, res) {
    try {
      const { userId } = req.body;
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      project.members = project.members.filter(m => m.toString() !== userId);
      await project.save();
      await project.populate('owner members', 'name email profilePicture');

      res.json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async deleteProject(req, res) {
    try {
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      await Task.deleteMany({ projectId: req.params.id });
      await Project.findByIdAndDelete(req.params.id);

      res.json({ success: true, message: 'Project deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = ProjectController;
