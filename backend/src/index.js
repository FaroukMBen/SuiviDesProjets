const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('node:path');
const { initCronJobs } = require('./services/cronService');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- MODIFICATION : Connexion DB + Lancement Serveur ---
// Tout ceci ne se lance QUE si on n'est pas en test
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('MongoDB connected');

    // Only run server listener and cron jobs if this file is run directly
    if (require.main === module) {
      // Initialize Cron Jobs
      initCronJobs();

      // On lance le serveur uniquement une fois la DB connectée
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  }).catch(err => {
    console.error('MongoDB connection error:', err);
    if (require.main === module) {
      process.exit(1);
    }
  });
}
// -------------------------------------------------------

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/campaigns', require('./routes/campagnes'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/commits', require('./routes/commits'));
app.use('/api/archive', require('./routes/archive'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/milestones', require('./routes/milestones'));
app.use('/api/livrables', require('./routes/livrables'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/github', require('./routes/github'));
app.use('/api/gantt-tasks', require('./routes/ganttTasks'));

// Cron trigger endpoint for Vercel Cron
app.get('/api/cron/check-tasks', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { checkDueTasks } = require('./services/cronService');
    await checkDueTasks();
    res.json({ success: true, message: 'Cron job checkDueTasks executed successfully' });
  } catch (error) {
    console.error('Error running cron endpoint:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;