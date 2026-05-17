const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Project = require('./src/models/Project');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    const projectsWithRepo = await Project.find({ repositoryUrl: { $exists: true, $ne: '' } });
    console.log('Total projects with repo:', projectsWithRepo.length);
    projectsWithRepo.forEach(p => console.log(`- ${p.title}: ${p.repositoryUrl}`));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});