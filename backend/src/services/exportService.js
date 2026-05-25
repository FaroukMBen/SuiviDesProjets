const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('node:fs');
const path = require('node:path');

class ExportService {
  static async exportProjectToPDF(project, evaluations, tasks, filename) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const filepath = path.join('/tmp', filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        doc.fontSize(20).text(project.title, { underline: true });
        doc.fontSize(12).text(`Owner: ${project.owner.name}`);
        doc.text(`Description: ${project.description}`);
        doc.text(`Status: ${project.status}`);
        doc.text(`Deadline: ${new Date(project.deadline).toLocaleDateString()}`);

        doc.fontSize(14).text('Evaluations', { underline: true });
        evaluations.forEach(evaluation => {
          doc.fontSize(11).text(`Evaluator: ${evaluation.evaluator.name}`);
          doc.text(`Total Score: ${evaluation.totalScore}`);
          doc.text(`Feedback: ${evaluation.feedback}`);
        });

        doc.fontSize(14).text('Tasks', { underline: true });
        tasks.forEach(task => {
          doc.fontSize(11).text(`- ${task.title} (${task.status})`);
        });

        doc.end();
        stream.on('finish', () => resolve(filepath));
      } catch (err) {
        reject(err);
      }
    });
  }

  static async exportProjectToCSV(project, evaluations, tasks, filename) {
    const filepath = path.join('/tmp', filename);
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'title', title: 'Title' },
        { id: 'owner', title: 'Owner' },
        { id: 'status', title: 'Status' },
        { id: 'taskCount', title: 'Task Count' },
        { id: 'avgScore', title: 'Average Score' }
      ]
    });

    const avgScore = evaluations.reduce((sum, e) => sum + (e.totalScore || 0), 0) / evaluations.length || 0;

    await csvWriter.writeRecords([{
      title: project.title,
      owner: project.owner.name,
      status: project.status,
      taskCount: tasks.length,
      avgScore: avgScore.toFixed(2)
    }]);

    return filepath;
  }
}

module.exports = ExportService;
