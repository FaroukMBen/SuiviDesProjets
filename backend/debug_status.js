const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Project = require('./src/models/Project');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('MongoDB connected');
    const projects = await Project.find({});
    const stats = {};
    projects.forEach(p => {
        stats[p.status] = (stats[p.status] || 0) + 1;
        if (p.status === 'completed') {
            console.log('Found completed project:', p.title);
        }
    });
    console.log('Project Status Stats:', stats);
    process.exit(0);
}).catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
});
