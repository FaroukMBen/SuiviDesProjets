const Task = require('../models/Task');
const Project = require('../models/Project');

class TaskController {
  static async getMyTasks(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Utilisateur non identifié" });
      }

      const tasks = await Task.find({ assignee: req.user.id })
        .populate('projectId', 'title')
        .sort({ dueDate: 1 });

      res.status(200).json({ tasks });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getMyGlobalTasks(req, res) {
    try {
      const userId = req.user.id;

      // 1. Trouver tous les projets où l'utilisateur est membre ou propriétaire
      const projects = await Project.find({
        $or: [{ owner: userId }, { members: userId }]
      }).select('_id');

      const projectIds = projects.map(p => p._id);

      // 2. Trouver les tâches de ces projets qui sont soit assignées à l'utilisateur, soit non assignées
      const tasks = await Task.find({
        projectId: { $in: projectIds },
        $or: [
          { assignee: userId },
          { assignee: null },
          { assignee: { $exists: false } } // Cas où le champ n'existe pas
        ]
      })
        .populate('projectId', 'title') // Pour savoir de quel projet ça vient
        .populate('assignee', 'name email profilePicture')
        .sort({ dueDate: 1 });

      res.json({ success: true, tasks });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getTasksByProject(req, res) {
    try {
      const tasks = await Task.find({ projectId: req.params.projectId })
        .populate('assignee', 'name email profilePicture')
        .sort({ order: 1 });

      res.json({ success: true, tasks });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createTask(req, res) {
    try {
      const { projectId, title, description, priority, dueDate, assignee, type } = req.body;

      // Verify project exists
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const maxOrder = await Task.findOne({ projectId }).sort({ order: -1 }).select('order');
      const nextOrder = maxOrder ? maxOrder.order + 1 : 0;

      const task = new Task({
        projectId,
        title,
        description,
        priority: priority || 'medium',
        type: type || 'objectif', // Default to objectif if not provided
        dueDate,
        assignee,
        status: 'todo',
        order: nextOrder
      });

      await task.save();
      await task.populate('assignee', 'name email profilePicture');

      res.status(201).json({ success: true, task });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateTask(req, res) {
    try {
      const { title, description, status, priority, dueDate, assignee, order, type, reminderDelay } = req.body;

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (type) task.type = type;
      if (dueDate) task.dueDate = dueDate;
      if (assignee) task.assignee = assignee;
      if (order !== undefined) task.order = order;
      if (reminderDelay) task.reminderDelay = reminderDelay;

      await task.save();
      await task.populate('assignee', 'name email profilePicture');

      res.json({ success: true, task });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async reorderTasks(req, res) {
    try {
      const { tasks } = req.body;

      const updatePromises = tasks.map((task, index) =>
        Task.findByIdAndUpdate(task.id, { order: index }, { new: true })
      );

      await Promise.all(updatePromises);
      res.json({ success: true, message: 'Tasks reordered' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async deleteTask(req, res) {
    try {
      const task = await Task.findByIdAndDelete(req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      res.json({ success: true, message: 'Task deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = TaskController;
