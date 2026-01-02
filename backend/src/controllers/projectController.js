const Project = require('../models/Project');
const Task = require('../models/Task');
const Livrable = require('../models/Livrable');
const mongoose = require('mongoose');

class ProjectController {
  static async getAllProjects(req, res) {
    try {
      const projects = await Project.find({
        $or: [{ owner: req.user.id }, { members: req.user.id }]
      })
        .populate('owner members', 'name email profilePicture')
        .sort({ createdAt: -1 });

      res.json({ success: true, projects });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createProject(req, res) {
    try {
      const { title, description, repositoryUrl, deadline, tags, members } = req.body;

      const project = new Project({
        title,
        description,
        repositoryUrl,
        deadline,
        tags: tags || [],
        owner: req.user.id,
        members: [req.user.id], // Only owner is initial member
        status: 'active'
      });

      await project.save();
      console.log('Project created:', project._id);

      // Send invitations to other members
      if (members && Array.isArray(members)) {
        console.log('Processing members for invitation:', members);
        const Notification = require('../models/Notification');
        const invitations = members
          .filter(memberId => memberId !== req.user.id) // Exclude owner
          .map(memberId => ({
            recipient: memberId,
            sender: req.user.id,
            type: 'INVITATION',
            project: project._id,
            message: `Vous avez été invité à rejoindre le projet ${project.title}.`,
          }));

        console.log('Invitations to create:', invitations);

        if (invitations.length > 0) {
          await Notification.insertMany(invitations);
          console.log('Invitations created successfully');
        }
      }

      // project.members is already set to [req.user.id] via the schema default/init logic above, 
      // but let's make sure we don't need the uniqueMembers logic anymore since we are inviting them.
      await project.populate('owner members', 'name email profilePicture');

      res.status(201).json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getProjectById(req, res) {
    try {
      const project = await Project.findById(req.params.id)
        .populate('owner members', 'name email profilePicture');

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // Check access
      const isOwner = project.owner._id.toString() === req.user.id;
      const isMember = project.members.some(m => m._id.toString() === req.user.id);

      if (!isOwner && !isMember && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateProject(req, res) {
    try {
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const { title, description, repositoryUrl, deadline, tags, status } = req.body;

      if (title) project.title = title;
      if (description) project.description = description;
      if (repositoryUrl) project.repositoryUrl = repositoryUrl;
      if (deadline) project.deadline = deadline;
      if (tags) project.tags = tags;
      if (status) project.status = status;

      await project.save();
      await project.populate('owner members', 'name email profilePicture');

      res.json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async addMember(req, res) {
    try {
      const { userId } = req.body;
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      if (!project.members.includes(userId)) {
        project.members.push(userId);
        await project.save();
      }

      await project.populate('owner members', 'name email profilePicture');
      res.json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async removeMember(req, res) {
    try {
      const { userId } = req.body;
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      project.members = project.members.filter(m => m.toString() !== userId);
      await project.save();
      await project.populate('owner members', 'name email profilePicture');

      res.json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async deleteProject(req, res) {
    try {
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      await Task.deleteMany({ projectId: req.params.id });
      await Project.findByIdAndDelete(req.params.id);

      res.json({ success: true, message: 'Project deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // Check access (owner or member)
      const isOwner = project.owner.toString() === req.user.id;
      const isMember = project.members.some(m => m.toString() === req.user.id);

      if (!isOwner && !isMember && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      // Create Livrable
      const newLivrable = new Livrable({
        studentId: req.user.id,
        projectId: project._id,
        fileId: req.file.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype
      });

      await newLivrable.save();

      const newFile = {
        name: req.file.originalname,
        path: `api/projects/files/${req.file.filename}`,
        mimetype: req.file.mimetype,
        uploadedAt: newLivrable.uploadDate
      };

      project.files.push(newFile);
      await project.save();

      // Populate to return updated project
      await project.populate('owner members', 'name email profilePicture');

      res.json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
  static async streamFile(req, res) {
    try {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });

      const filename = req.params.filename;
      const downloadStream = bucket.openDownloadStreamByName(filename);

      downloadStream.on('error', (error) => {
        res.status(404).json({ success: false, message: 'File not found' });
      });

      downloadStream.pipe(res);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async deleteFile(req, res) {
    try {
      const { id, fileId } = req.params;
      const project = await Project.findById(id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // Check access
      const isOwner = project.owner.toString() === req.user.id;
      if (!isOwner && req.user.role !== 'admin') {
        // Allow if member & it's their file? For now restrict to owner/admin for simplicity unless checked against Livrable
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const fileItem = project.files.id(fileId);
      if (!fileItem) {
        return res.status(404).json({ success: false, message: 'File not found in project' });
      }

      // Extract filename from path (api/projects/files/<filename>)
      const filename = fileItem.path.split('/').pop();

      // Find Livrable to get GridFS ID
      const livrable = await Livrable.findOne({ filename });

      if (livrable) {
        // Delete from GridFS
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
          bucketName: 'uploads'
        });

        try {
          await bucket.delete(livrable.fileId);
        } catch (e) {
          console.log('Error deleting from GridFS:', e.message);
          // Continue cleanup even if GridFS fails (maybe already deleted)
        }

        await Livrable.deleteOne({ _id: livrable._id });
      } else {
        // Fallback: try to find by filename in GridFS directly if Livrable missing?
        // For now, assume Livrable exists or just remove from project if not.
      }

      // Remove from project
      project.files.pull(fileId);
      await project.save();
      await project.populate('owner members', 'name email profilePicture');

      res.json({ success: true, project });

    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = ProjectController;
