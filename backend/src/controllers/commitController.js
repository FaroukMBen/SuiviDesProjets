const Commit = require('../models/Commit');
const User = require('../models/User');
const GitHubService = require('../services/githubService');

class CommitController {
  static async getCommits(req, res) {
    try {
      const commits = await Commit.find({ projectId: req.params.projectId })
        .populate('author', 'name email profilePicture')
        .sort({ timestamp: -1 })
        .limit(50);

      res.json({ success: true, commits });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async syncCommitsFromGitHub(req, res) {
    try {
      const { owner, repo } = req.body;
      const user = await User.findById(req.user.id);

      if (!user.githubToken) {
        return res.status(400).json({ success: false, message: 'GitHub token not found. Please authenticate with GitHub.' });
      }

      const githubService = new GitHubService(user.githubToken);
      const commits = await githubService.getRepositoryCommits(owner, repo);

      const savedCommits = [];

      for (const commit of commits) {
        const existing = await Commit.findOne({ githubCommitId: commit.sha });
        if (!existing) {
          const newCommit = new Commit({
            projectId: req.params.projectId,
            githubCommitId: commit.sha,
            author: req.user.id,
            message: commit.commit.message,
            url: commit.html_url,
            timestamp: new Date(commit.commit.author.date),
            filesChanged: commit.files?.length || 0,
            insertions: commit.files?.reduce((sum, f) => sum + f.additions, 0) || 0,
            deletions: commit.files?.reduce((sum, f) => sum + f.deletions, 0) || 0
          });
          await newCommit.save();
          savedCommits.push(newCommit);
        }
      }

      res.json({
        success: true,
        message: `Synced ${savedCommits.length} new commits`,
        commits: savedCommits
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createCommit(req, res) {
    try {
      const { projectId, githubCommitId, message, url, filesChanged, insertions, deletions } = req.body;

      const commit = new Commit({
        projectId,
        githubCommitId,
        author: req.user.id,
        message,
        url,
        timestamp: new Date(),
        filesChanged,
        insertions,
        deletions
      });

      await commit.save();
      await commit.populate('author', 'name email profilePicture');

      res.status(201).json({ success: true, commit });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getCommitStats(req, res) {
    try {
      const commits = await Commit.find({ projectId: req.params.projectId });

      const stats = {
        totalCommits: commits.length,
        totalFilesChanged: commits.reduce((sum, c) => sum + (c.filesChanged || 0), 0),
        totalInsertions: commits.reduce((sum, c) => sum + (c.insertions || 0), 0),
        totalDeletions: commits.reduce((sum, c) => sum + (c.deletions || 0), 0),
        averageFilesPerCommit: commits.length > 0
          ? (commits.reduce((sum, c) => sum + (c.filesChanged || 0), 0) / commits.length).toFixed(2)
          : 0
      };

      res.json({ success: true, stats });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getGitHubStats(req, res) {
    try {
      const { owner, repo } = req.body;
      const user = await User.findById(req.user.id);

      if (!user.githubToken) {
        return res.status(400).json({ success: false, message: 'GitHub token not found' });
      }

      const githubService = new GitHubService(user.githubToken);
      const stats = await githubService.getRepositoryStats(owner, repo);

      res.json({ success: true, stats });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = CommitController;
