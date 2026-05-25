const GanttTask = require('../models/GanttTask');
const Project = require('../models/Project');

exports.createTask = async (req, res) => {
    try {
        const { projectId, title, description, status, assignee, startDate, endDate, dependsOn } = req.body;

        if (dependsOn && dependsOn.length > 0) {
            const deps = await GanttTask.find({ _id: { $in: dependsOn } });
            for (const dep of deps) {
                if (new Date(startDate) < new Date(dep.endDate)) {
                    return res.status(400).json({ message: `La date de début ne peut pas être antérieure à la date de fin de la tâche dont elle dépend : ${dep.title}` });
                }
            }
        }

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Projet introuvable' });

        const newTask = new GanttTask({
            projectId,
            title,
            description,
            status: status || 'todo',
            assignee,
            startDate,
            endDate,
            dependsOn: dependsOn || []
        });

        const savedTask = await newTask.save();

        const populatedTask = await GanttTask.findById(savedTask._id)
            .populate('assignee', 'firstName lastName name email')
            .populate('dependsOn', 'title startDate endDate');

        res.status(201).json({ message: 'Tâche créée', task: populatedTask });
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la création de la tâche', error: err.message });
    }
};

exports.getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const ganttTasks = await GanttTask.find({ projectId })
            .populate('assignee', 'firstName lastName name email')
            .populate('dependsOn', 'title startDate endDate status')
            .sort('startDate')
            .lean();



        const Task = require('../models/Task');
        const kanbanTasks = await Task.find({ projectId }).populate('assignee', 'name').lean();




        const tasks = ganttTasks.map(gt => {
            return {
                ...gt,
                kanbanTasks: kanbanTasks.filter(kt => kt.ganttTaskId && String(kt.ganttTaskId) === String(gt._id))
            };
        });

        res.json({ tasks });
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la récupération des tâches', error: err.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const updates = req.body;

        if (updates.startDate && updates.dependsOn && updates.dependsOn.length > 0) {
            const deps = await GanttTask.find({ _id: { $in: updates.dependsOn } });
            for (const dep of deps) {
                if (new Date(updates.startDate) < new Date(dep.endDate)) {
                    return res.status(400).json({ message: `La date de début ne peut pas être antérieure à la date de fin de la tâche dont elle dépend : ${dep.title}` });
                }
            }
        }

        const task = await GanttTask.findByIdAndUpdate(taskId, updates, { new: true, runValidators: true })
            .populate('assignee', 'firstName lastName name email')
            .populate('dependsOn', 'title startDate endDate');

        if (!task) return res.status(404).json({ message: 'Tâche introuvable' });

        res.json({ message: 'Tâche mise à jour', task });
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la modification', error: err.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        await GanttTask.updateMany(
            { dependsOn: taskId },
            { $pull: { dependsOn: taskId } }
        );

        const task = await GanttTask.findByIdAndDelete(taskId);
        if (!task) return res.status(404).json({ message: 'Tâche introuvable' });

        res.json({ message: 'Tâche supprimée avec succès' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la suppression', error: err.message });
    }
};

exports.getMyGlobalGanttTasks = async (req, res) => {
    try {
        const userId = req.user.id;

        const projects = await Project.find({
            $or: [{ owner: userId }, { members: userId }]
        }).select('_id title');

        const projectIds = projects.map(p => p._id);

        const ganttTasks = await GanttTask.find({ projectId: { $in: projectIds } })
            .populate('projectId', 'title')
            .populate('assignee', 'firstName lastName name email profilePicture')
            .populate('dependsOn', 'title startDate endDate status')
            .sort('startDate')
            .lean();

        const Task = require('../models/Task');
        const kanbanTasks = await Task.find({ projectId: { $in: projectIds }, ganttTaskId: { $exists: true } })
            .populate('assignee', 'name')
            .lean();

        const tasks = ganttTasks.map(gt => {
            return {
                ...gt,
                kanbanTasks: kanbanTasks.filter(kt => kt.ganttTaskId && String(kt.ganttTaskId) === String(gt._id))
            };
        });

        res.json({ success: true, tasks });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur récupération Gantt global', error: err.message });
    }
};
