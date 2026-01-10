const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
// Project model is used by population but explicit require might not be needed if not used directly, 
// strictly speaking it's better to keep it if we might need it.
const Project = require('../models/Project');

// Function to check for tasks due tomorrow
const checkDueTasks = async () => {
    console.log('Running checkDueTasks job...');
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Set time to beginning of the day (00:00:00)
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

        // Find tasks due tomorrow that are not done
        const tasks = await Task.find({
            dueDate: {
                $gte: tomorrow,
                $lt: dayAfterTomorrow
            },
            status: { $ne: 'done' },
            assignee: { $exists: true, $ne: null }
        }).populate('projectId');

        console.log(`Found ${tasks.length} tasks due tomorrow.`);

        for (const task of tasks) {

            if (!task.projectId) continue;

            const project = task.projectId;
            const assigneeId = task.assignee;
            const senderId = project.owner;

            // Check if notification already exists for this task
            const existingNotification = await Notification.findOne({
                recipient: assigneeId,
                task: task._id,
                type: 'INFO'
            });

            if (existingNotification) {
                console.log(`Notification already sent for task ${task._id}. Skipping.`);
                continue;
            }

            const message = `Rappel : La tâche "${task.title}" du projet "${project.title}" arrive à échéance demain.`;

            const notification = new Notification({
                recipient: assigneeId,
                sender: senderId,
                type: 'INFO',
                project: project._id,
                task: task._id, // Link to task
                message: message
            });

            await notification.save();
            console.log(`Notification sent to user ${assigneeId} for task ${task._id}`);
        }

    } catch (error) {
        console.error('Error in checkDueTasks:', error);
    }
};

const initCronJobs = () => {
    // Run at minute 0 of every hour
    cron.schedule('0 * * * *', () => {
        checkDueTasks();
    });

    console.log('Cron jobs initialized: Task Due Date Check scheduled for every hour.');
};

module.exports = { initCronJobs, checkDueTasks };
