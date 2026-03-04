const mongoose = require('mongoose');

const ganttTaskSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['todo', 'in-progress', 'review', 'done'], default: 'todo' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dependsOn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GanttTask' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });


ganttTaskSchema.pre('save', function (next) {
    if (this.endDate < this.startDate) {
        const err = new Error('La date de fin ne peut pas être antérieure à la date de début');
        next(err);
    } else {
        next();
    }
});

module.exports = mongoose.model('GanttTask', ganttTaskSchema);
