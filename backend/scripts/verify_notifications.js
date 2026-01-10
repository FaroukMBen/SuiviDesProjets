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

        // Create Users
        const owner = await User.create({ name: 'Owner', email: `owner_${Date.now()}@test.com`, password: 'pw' });
        const assignee = await User.create({ name: 'Assignee', email: `assignee_${Date.now()}@test.com`, password: 'pw' });

        const project = await Project.create({ title: 'Test Project Cron', owner: owner._id });

        // --- SCENARIO 1: Custom Reminder (3 days before) ---
        const dueIn3Days = new Date();
        dueIn3Days.setDate(dueIn3Days.getDate() + 3);
        dueIn3Days.setHours(12, 0, 0, 0);

        const task3Days = await Task.create({
            title: 'Task Due in 3 Days (Reminder 3)',
            projectId: project._id,
            assignee: assignee._id,
            dueDate: dueIn3Days,
            reminderDelay: 3, // Custom
            status: 'todo'
        });

        // --- SCENARIO 2: Default Reminder (1 day before) ---
        // Create a task due in 3 days but with DEFAULT reminder (1) -> SHOULD NOT NOTIFY yet
        const task3DaysDefault = await Task.create({
            title: 'Task Due in 3 Days (Default Reminder)',
            projectId: project._id,
            assignee: assignee._id,
            dueDate: dueIn3Days,
            reminderDelay: 1, // Default
            status: 'todo'
        });

        console.log('Running checkDueTasks...');
        await checkDueTasks();

        // Check Notifications
        const notifs = await Notification.find({ recipient: assignee._id });
        console.log(`Found ${notifs.length} notifications.`);

        const notifCustom = notifs.find(n => n.task.toString() === task3Days._id.toString());
        const notifDefault = notifs.find(n => n.task.toString() === task3DaysDefault._id.toString());

        if (notifCustom) console.log('SUCCESS: Notification sent for custom 3-day reminder.');
        else console.error('FAILURE: No notification for custom 3-day reminder.');

        if (!notifDefault) console.log('SUCCESS: No notification sent for default reminder (task due in 3 days).');
        else console.error('FAILURE: Notification sent incorrectly for default reminder.');

        // Cleanup
        await Task.deleteMany({ projectId: project._id });
        await Project.deleteOne({ _id: project._id });
        await Notification.deleteMany({ recipient: assignee._id });
        await User.deleteMany({ _id: { $in: [owner._id, assignee._id] } });

        console.log('Cleanup done.');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
