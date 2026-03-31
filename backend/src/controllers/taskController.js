const Task = require('../models/Task');
const Project = require('../models/Project');
const GanttTask = require('../models/GanttTask');

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

      const projects = await Project.find({
        $or: [{ owner: userId }, { members: userId }]
      }).select('_id');

      const projectIds = projects.map(p => p._id);

      const tasks = await Task.find({
        projectId: { $in: projectIds },
        $or: [
          { assignee: userId },
          { assignee: null },
          { assignee: { $exists: false } }
        ]
      })
        .populate('projectId', 'title')
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
      const { projectId, ganttTaskId, title, description, priority, dueDate, assignee, type } = req.body;



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
        type: type || 'objectif',
        dueDate,
        assignee,
        ganttTaskId,
        status: 'todo',
        order: nextOrder
      });

      await task.save();
      await task.populate('assignee', 'name email profilePicture');

      if (ganttTaskId) {
        await TaskController.syncGanttStatus(ganttTaskId);
      }

      res.status(201).json({ success: true, task });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateTask(req, res) {
    try {
      const { title, description, status, priority, dueDate, assignee, order, type, reminderDelay, ganttTaskId } = req.body;

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
      if (assignee !== undefined) task.assignee = assignee === '' ? null : assignee;
      if (order !== undefined) task.order = order;
      if (reminderDelay) task.reminderDelay = reminderDelay;
      if (ganttTaskId !== undefined) task.ganttTaskId = ganttTaskId;

      await task.save();
      await task.populate('assignee', 'name email profilePicture');

      if (task.ganttTaskId) {
        await TaskController.syncGanttStatus(task.ganttTaskId);
      }

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

      if (task.ganttTaskId) {
        await TaskController.syncGanttStatus(task.ganttTaskId);
      }

      res.json({ success: true, message: 'Task deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async syncGanttStatus(ganttTaskId) {
    try {
      const ganttTask = await GanttTask.findById(ganttTaskId);
      if (!ganttTask) return;

      const kanbanTasks = await Task.find({ ganttTaskId });
      if (kanbanTasks.length === 0) return;

      const allDone = kanbanTasks.every(t => t.status === 'done');
      const anyInProgress = kanbanTasks.some(t => t.status === 'in-progress' || t.status === 'review');

      let newStatus = ganttTask.status;

      if (allDone) {
        newStatus = 'done';
      } else if (anyInProgress && ganttTask.status === 'todo') {
        newStatus = 'in-progress';
      } else if (!allDone && ganttTask.status === 'done') {

        newStatus = 'in-progress';
      }

      if (newStatus !== ganttTask.status) {
        ganttTask.status = newStatus;
        await ganttTask.save();
      }
    } catch (err) {
      console.error("Erreur syncGanttStatus:", err);
    }
  }
}

module.exports = TaskController;
