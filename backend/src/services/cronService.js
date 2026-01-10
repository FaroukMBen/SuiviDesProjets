const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Project = require('../models/Project');

// Function to check for tasks due in 'daysInAdvance' days
const checkDueTasksForDelay = async (daysInAdvance) => {
    try {
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + daysInAdvance);

        targetDate.setHours(0, 0, 0, 0);

        const dayAfterTarget = new Date(targetDate);
        dayAfterTarget.setDate(targetDate.getDate() + 1);

        // Find tasks due on that specific target date
        // AND that have the specific reminderDelay matching daysInAdvance
        const query = {
            dueDate: {
                $gte: targetDate,
                $lt: dayAfterTarget
            },
            status: { $ne: 'done' },
            assignee: { $exists: true, $ne: null }
        };

        // If delay is 1, take tasks with reminderDelay=1 OR undefined (legacy/default)
        if (daysInAdvance === 1) {
            query.$or = [
                { reminderDelay: 1 },
                { reminderDelay: { $exists: false } },
                { reminderDelay: null }
            ];
        } else {
            // For other delays, strictly match
            query.reminderDelay = daysInAdvance;
        }

        const tasks = await Task.find(query).populate('projectId');

        console.log(`Checking delay ${daysInAdvance} days: Found ${tasks.length} tasks.`);

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

            const dayString = daysInAdvance === 1 ? 'demain' : `dans ${daysInAdvance} jours`;
            const message = `Rappel : La tâche "${task.title}" du projet "${project.title}" arrive à échéance ${dayString}.`;

            const notification = new Notification({
                recipient: assigneeId,
                sender: senderId,
                type: 'INFO',
                project: project._id,
                task: task._id,
                message: message
            });

            await notification.save();
            console.log(`Notification sent to user ${assigneeId} for task ${task._id} (Due in ${daysInAdvance} days)`);
        }

    } catch (error) {
        console.error(`Error in checkDueTasksForDelay(${daysInAdvance}):`, error);
    }
};

const checkAllDueTasks = async () => {
    console.log('Running checkAllDueTasks job (Per Task Logic)...');
    const possibleDelays = [1, 2, 3, 7];

    // Process all delays
    for (const delay of possibleDelays) {
        await checkDueTasksForDelay(delay);
    }
    console.log('Finished checkAllDueTasks job.');
}

const initCronJobs = () => {
    // Run at minute 0 of every hour
    cron.schedule('0 * * * *', () => {
        checkAllDueTasks();
    });

    console.log('Cron jobs initialized: Task Due Date Check scheduled for every hour.');
};

module.exports = { initCronJobs, checkDueTasks: checkAllDueTasks };
