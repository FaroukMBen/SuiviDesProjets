const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://marwane4007:azerty@nexusproject.w9j19.mongodb.net/nexusdb?retryWrites=true&w=majority&appName=NexusProject', {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    const db = mongoose.connection.db;
    db.collection('projects').find().sort({_id:-1}).limit(2).toArray().then(r => {
        console.log(JSON.stringify(r, null, 2));
        process.exit(0);
    });
});
