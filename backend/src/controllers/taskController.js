const Task = require('../models/Task');
const Project = require('../models/Project');

class TaskController {
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
      const { projectId, title, description, priority, dueDate, assignee } = req.body;

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
      const { title, description, status, priority, dueDate, assignee, order } = req.body;

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate) task.dueDate = dueDate;
      if (assignee) task.assignee = assignee;
      if (order !== undefined) task.order = order;

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
