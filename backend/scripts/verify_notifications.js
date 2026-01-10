const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { checkDueTasks } = require('../src/services/cronService');
const Task = require('../src/models/Task');
const Notification = require('../src/models/Notification');
const Project = require('../src/models/Project');
const User = require('../src/models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Create dummy data
        const owner = await User.create({
            name: 'Test Owner',
            email: `owner_${Date.now()}@test.com`,
            password: 'password'
        });

        const assignee = await User.create({
            name: 'Test Assignee',
            email: `assignee_${Date.now()}@test.com`,
            password: 'password'
        });

        const project = await Project.create({
            title: 'Test Project Cron',
            owner: owner._id,
            description: 'Testing cron'
        });

        // Set due date to tomorrow noon
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);

        const task = await Task.create({
            title: 'Test Task Cron',
            projectId: project._id,
            assignee: assignee._id,
            dueDate: tomorrow,
            status: 'todo'
        });

        console.log(`Created task ${task._id} due at ${task.dueDate}`);

        // Run the check FIRST TIME
        console.log('Running checkDueTasks (1st time)...');
        await checkDueTasks();

        // Check for notification
        const notificationsAfterFirstRun = await Notification.find({
            recipient: assignee._id,
            task: task._id,
            type: 'INFO'
        });

        if (notificationsAfterFirstRun.length === 1) {
            console.log('SUCCESS: One notification created after first run.');
        } else {
            console.error(`FAILURE: Expected 1 notification, found ${notificationsAfterFirstRun.length}.`);
        }

        // Run the check SECOND TIME
        console.log('Running checkDueTasks (2nd time)...');
        await checkDueTasks();

        // Check for notification again
        const notificationsAfterSecondRun = await Notification.find({
            recipient: assignee._id,
            task: task._id,
            type: 'INFO'
        });

        if (notificationsAfterSecondRun.length === 1) {
            console.log('SUCCESS: Still only one notification after second run (Deduplication worked).');
        } else {
            console.error(`FAILURE: Expected 1 notification, found ${notificationsAfterSecondRun.length}.`);
        }

        // Cleanup
        await Task.deleteOne({ _id: task._id });
        await Project.deleteOne({ _id: project._id });
        await Notification.deleteMany({ recipient: assignee._id });
        await User.deleteOne({ _id: owner._id });
        await User.deleteOne({ _id: assignee._id });

        console.log('Cleanup done.');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
