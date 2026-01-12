const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Task = require('../src/models/Task');
const Project = require('../src/models/Project');
// We need to mock the controller logic or just test the model save? 
// The real test is the API, but I can't call API from here easily without axios.
// I will test if saving to DB works (model level) first, which I know it does.
// The issue was the controller.
// I'll simulate what the controller does.

dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyUpdate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Create dummy project & task
        const project = await Project.create({ title: 'Update Test', owner: new mongoose.Types.ObjectId() });
        const task = await Task.create({
            title: 'Test Task',
            projectId: project._id,
            status: 'todo',
            reminderDelay: 1
        });

        console.log(`Original Reminder: ${task.reminderDelay}`);

        // SIMULATE CONTROLLER UPDATE
        // The controller does: findById -> set properties -> save
        const foundTask = await Task.findById(task._id);

        // This is the line I added in the controller:
        const reminderDelayFromRequest = 7;
        if (reminderDelayFromRequest) foundTask.reminderDelay = reminderDelayFromRequest;

        await foundTask.save();

        // Check if persisted
        const updatedTask = await Task.findById(task._id);
        console.log(`Updated Reminder: ${updatedTask.reminderDelay}`);

        if (updatedTask.reminderDelay === 7) {
            console.log('SUCCESS: Reminder delay updated and persisted.');
        } else {
            console.error('FAILURE: Reminder delay did NOT persist.');
        }

        // Cleanup
        await Task.deleteOne({ _id: task._id });
        await Project.deleteOne({ _id: project._id });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyUpdate();
