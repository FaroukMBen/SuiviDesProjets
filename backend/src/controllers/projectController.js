const Project = require('../models/Project');
const Task = require('../models/Task');
const Livrable = require('../models/Livrable');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const path = require('path');
const CommitController = require('./commitController');

class ProjectController {

  static async getAllProjects(req, res) {
    try {
      const { campaign, status, search } = req.query;
      let filter = {};

      // 1. Filtre par campagne
      if (campaign && campaign !== 'all') {
        const campaignIds = campaign.split(',').filter(id => id.trim() !== '');
        if (campaignIds.length > 0) {
          filter.campaignId = campaignIds.length > 1 ? { $in: campaignIds } : campaignIds[0];
        }
      }

      // 2. Filtre par status
      if (status && status !== 'all') {
        const statusList = status.split(',').filter(s => s.trim() !== '');
        if (statusList.length > 0) {
          filter.status = statusList.length > 1 ? { $in: statusList } : statusList[0];
        }
      }

      // 3. Filtre par recherche
      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        filter.$or = [
          { title: searchRegex },
          { description: searchRegex }
        ];
      }

      // --- LOGIQUE DE SÉCURITÉ PAR RÔLE ---
      if (req.user.role === 'student') {
        const studentFilter = {
          $or: [
            { owner: req.user.id },
            { members: req.user.id }
          ]
        };
        // Merge with existing filter
        if (Object.keys(filter).length > 0) {
          filter = { $and: [filter, studentFilter] };
        } else {
          filter = studentFilter;
        }
      }

      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;
      const skip = (page - 1) * limit;

      // Exécution
      const totalProjects = await Project.countDocuments(filter);

      const projects = await Project.find(filter)
        .populate('owner', 'name')
        .populate('members', 'name profilePicture')
        .populate('campaignId', 'title')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        success: true,
        count: projects.length,
        projects,
        pagination: {
          total: totalProjects,
          page,
          totalPages: Math.ceil(totalProjects / limit),
          limit
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createProject(req, res) {
    try {
      const { title, description, repositoryUrl, deadline, tags, members, campaignId } = req.body;

      const project = new Project({
        title,
        description,
        repositoryUrl,
        deadline,
        tags: tags || [],
        owner: req.user.id,
        members: [req.user.id],
        status: 'active',
        campaignId: campaignId || null
      });

      await project.save();

      if (members && Array.isArray(members)) {
        const Notification = require('../models/Notification');
        const invitations = members
          .filter(memberId => memberId !== req.user.id)
          .map(memberId => ({
            recipient: memberId,
            sender: req.user.id,
            type: 'INVITATION',
            project: project._id,
            message: `Vous avez été invité à rejoindre le projet ${project.title}.`,
          }));

        if (invitations.length > 0) {
          await Notification.insertMany(invitations);
        }
      }
      await project.populate('owner members', 'name email profilePicture');

      // Sync automatique si URL GitHub présente
      if (repositoryUrl) {
        CommitController.syncRepository(project._id, repositoryUrl, req.user.id)
          .then(result => console.log(`Auto-sync for project ${project._id}: ${result.totalSynced} new commits`))
          .catch(err => console.error(`Auto-sync failed for project ${project._id}:`, err.message));
      }

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

  static async unlinkGitHubRepository(req, res) {
    try {
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      project.repositoryUrl = null;
      await project.save();
      await project.populate('owner members', 'name email profilePicture');

      res.json({ success: true, project, message: 'Dépôt GitHub dissocié avec succès' });
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

      const isOwner = project.owner.toString() === req.user.id;
      const isMember = project.members.some(m => m.toString() === req.user.id);

      if (!isOwner && !isMember && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      // Prepare GridFS Bucket
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });

      // Generate unique filename
      const filename = Date.now() + path.extname(req.file.originalname);

      // Create upload stream
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname
        }
      });

      // Convert buffer to stream and pipe to GridFS
      const readableStream = new Readable();
      readableStream.push(req.file.buffer);
      readableStream.push(null);

      readableStream.pipe(uploadStream)
        .on('error', (error) => {
          return res.status(500).json({ success: false, message: 'Error uploading file', error: error.message });
        })
        .on('finish', async () => {
          try {
            // Create Livrable
            const newLivrable = new Livrable({
              studentId: req.user.id,
              projectId: project._id,
              fileId: uploadStream.id, // GridFS file ID
              filename: filename,
              originalName: req.file.originalname,
              mimetype: req.file.mimetype,
              milestoneId: req.body.milestoneId || undefined // Optional linkage
            });

            await newLivrable.save();

            const newFile = {
              name: req.file.originalname,
              path: `api/projects/files/${filename}`,
              mimetype: req.file.mimetype,
              uploadedAt: newLivrable.uploadDate,
              milestoneId: newLivrable.milestoneId // Sync with Livrable
            };

            project.files.push(newFile);
            await project.save();

            // Populate to return updated project
            await project.populate('owner members', 'name email profilePicture');

            return res.json({ success: true, project });
          } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
          }
        });

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

      const isOwner = project.owner.toString() === req.user.id;
      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const fileItem = project.files.id(fileId);
      if (!fileItem) {
        return res.status(404).json({ success: false, message: 'File not found in project' });
      }

      const filename = fileItem.path.split('/').pop();
      const livrable = await Livrable.findOne({ filename });

      if (livrable) {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
          bucketName: 'uploads'
        });

        try {
          await bucket.delete(livrable.fileId);
        } catch (e) {
          console.log('Error deleting from GridFS:', e.message);
        }

        await Livrable.deleteOne({ _id: livrable._id });
      }

      project.files.pull(fileId);
      await project.save();
      await project.populate('owner members', 'name email profilePicture');

      res.json({ success: true, project });

    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
  static async linkCampaign(req, res) {
    try {
      const { campaignId } = req.body;
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      project.campaignId = campaignId;
      await project.save();

      res.json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = ProjectController;
