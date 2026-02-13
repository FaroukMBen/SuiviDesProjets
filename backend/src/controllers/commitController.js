const Commit = require('../models/Commit');
const User = require('../models/User');
const GitHubService = require('../services/githubService');

class CommitController {
  static async getCommits(req, res) {
    try {
      const commits = await Commit.find({ projectId: req.params.projectId })
        .sort({ timestamp: -1 })
        .limit(200);

      res.json({ success: true, commits });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async syncRepository(projectId, repositoryUrl, userId) {
    const Project = require('../models/Project');

    // 1. Validation de l'URL
    const parsed = GitHubService.parseRepositoryUrl(repositoryUrl);
    if (!parsed) {
      throw new Error('URL GitHub invalide.');
    }
    const { owner, repo } = parsed;

    // 2. Récupération du token utilisateur
    const user = await User.findById(userId);
    const githubService = new GitHubService(user.githubToken || null);

    // 3. Récupération des branches
    let branches = [];
    try {
      branches = await githubService.getRepositoryBranches(owner, repo);
    } catch (e) {
      branches = [{ name: 'main' }];
    }

    let totalSynced = 0;
    let totalUpdated = 0;
    let totalProcessed = 0;
    let totalCommits = 0;

    // 4. Compter le nombre total de commits (approximatif)
    for (const branch of branches) {
      try {
        const commits = await githubService.getRepositoryCommits(owner, repo, branch.name, 1, 100);
        totalCommits += commits.length;
      } catch (e) {
        console.warn(`Could not count commits for branch ${branch.name}`);
      }
    }

    // 5. Synchronisation
    for (const branch of branches) {
      let commits = [];
      try {
        commits = await githubService.getRepositoryCommits(owner, repo, branch.name);
      } catch (e) {
        console.warn(`Skipping branch ${branch.name}: ${e.message}`);
        continue;
      }

      for (const commitData of commits) {
        totalProcessed++;

        const githubAuthor = {
          login: commitData.author?.login || commitData.commit?.author?.name || 'unknown',
          avatarUrl: commitData.author?.avatar_url || null,
          name: commitData.commit?.author?.name || 'Unknown'
        };

        const existing = await Commit.findOne({ githubCommitId: commitData.sha, projectId });

        if (existing) {
          // Mise à jour si nécessaire
          if (existing.insertions === 0 && existing.deletions === 0) {
            try {
              const detail = await githubService.getCommitDetail(owner, repo, commitData.sha);
              existing.insertions = detail?.stats?.additions || 0;
              existing.deletions = detail?.stats?.deletions || 0;
              existing.filesChanged = detail?.files?.length || 0;
              existing.files = (detail?.files || []).map(f => ({
                filename: f.filename,
                status: f.status,
                additions: f.additions,
                deletions: f.deletions
              }));
              existing.githubAuthor = githubAuthor;
              existing.branch = branch.name;
              await existing.save();
              totalUpdated++;
            } catch (e) {
              console.warn(`Could not update detail for ${commitData.sha}: ${e.message}`);
            }
          }
          continue;
        }

        // Création nouveau commit
        let detail = null;
        try {
          detail = await githubService.getCommitDetail(owner, repo, commitData.sha);
        } catch (e) {
          console.warn(`Could not fetch detail for ${commitData.sha}: ${e.message}`);
        }

        const newCommit = new Commit({
          projectId,
          githubCommitId: commitData.sha,
          message: commitData.commit.message,
          url: commitData.html_url,
          timestamp: new Date(commitData.commit.author.date),
          branch: branch.name,
          githubAuthor,
          filesChanged: detail?.files?.length || 0,
          insertions: detail?.stats?.additions || 0,
          deletions: detail?.stats?.deletions || 0,
          files: (detail?.files || []).map(f => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions
          }))
        });

        try {
          await newCommit.save();
          totalSynced++;
        } catch (e) {
          if (e.code !== 11000) console.error(`Save error: ${e.message}`);
        }
      }
    }

    return {
      totalSynced,
      totalUpdated,
      totalProcessed,
      branches: branches.map(b => b.name)
    };
  }

  static async syncCommitsFromGitHub(req, res) {
    try {
      let { owner, repo } = req.body; // legacy params, unused if using repositoryUrl from project
      const { projectId } = req.params;

      const Project = require('../models/Project');
      const project = await Project.findById(projectId);

      if (!project || !project.repositoryUrl) {
        return res.status(400).json({ success: false, message: 'Aucune URL de dépôt trouvée pour ce projet.' });
      }

      const result = await CommitController.syncRepository(projectId, project.repositoryUrl, req.user.id);

      res.json({
        success: true,
        message: `${result.totalSynced} nouveaux commits, ${result.totalUpdated} mis à jour`,
        newCount: result.totalSynced,
        updatedCount: result.totalUpdated,
        totalProcessed: result.totalProcessed,
        branches: result.branches
      });
    } catch (err) {
      console.error('Sync error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Sync avec progression SSE
  static async syncCommitsWithProgress(req, res) {
    try {
      const { projectId } = req.params;

      // Headers SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const sendProgress = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Récupérer owner/repo depuis le projet
      const Project = require('../models/Project');
      const project = await Project.findById(projectId);
      if (!project || !project.repositoryUrl) {
        sendProgress({ error: 'Aucune URL de dépôt trouvée pour ce projet.' });
        return res.end();
      }
      const parsed = GitHubService.parseRepositoryUrl(project.repositoryUrl);
      if (!parsed) {
        sendProgress({ error: 'URL GitHub invalide.' });
        return res.end();
      }
      const owner = parsed.owner;
      const repo = parsed.repo;

      const user = await User.findById(req.user.id);
      const githubService = new GitHubService(user.githubToken || null);

      sendProgress({ status: 'Récupération des branches...', progress: 0 });

      let branches = [];
      try {
        branches = await githubService.getRepositoryBranches(owner, repo);
      } catch (e) {
        // Si erreur 404 et pas de token GitHub => probablement un repo privé
        if (e.response && (e.response.status === 404 || e.response.status === 403) && !user.githubToken) {
          sendProgress({
            error: 'Ce dépôt semble être privé. Connectez votre compte GitHub dans les Paramètres pour synchroniser des dépôts privés.',
            complete: true
          });
          return res.end();
        }
        branches = [{ name: 'main' }];
      }

      sendProgress({ status: `${branches.length} branche(s) trouvée(s)`, progress: 5 });

      let totalSynced = 0;
      let totalUpdated = 0;
      let totalProcessed = 0;
      let totalCommits = 0;

      // Compter le total
      for (const branch of branches) {
        try {
          const commits = await githubService.getRepositoryCommits(owner, repo, branch.name, 1, 100);
          totalCommits += commits.length;
        } catch (e) {
          console.warn(`Could not count commits for branch ${branch.name}`);
        }
      }

      sendProgress({ status: `${totalCommits} commit(s) à traiter`, progress: 10, total: totalCommits });

      for (const branch of branches) {
        let commits = [];
        try {
          commits = await githubService.getRepositoryCommits(owner, repo, branch.name);
        } catch (e) {
          console.warn(`Skipping branch ${branch.name}: ${e.message}`);
          continue;
        }

        for (let i = 0; i < commits.length; i++) {
          const commitData = commits[i];
          totalProcessed++;

          const progress = 10 + Math.round((totalProcessed / totalCommits) * 85);
          sendProgress({
            status: `Traitement: ${commitData.commit.message.substring(0, 50)}...`,
            progress,
            processed: totalProcessed,
            total: totalCommits
          });

          const githubAuthor = {
            login: commitData.author?.login || commitData.commit?.author?.name || 'unknown',
            avatarUrl: commitData.author?.avatar_url || null,
            name: commitData.commit?.author?.name || 'Unknown'
          };

          const existing = await Commit.findOne({ githubCommitId: commitData.sha, projectId });

          if (existing) {
            if (existing.insertions === 0 && existing.deletions === 0) {
              try {
                const detail = await githubService.getCommitDetail(owner, repo, commitData.sha);
                existing.insertions = detail?.stats?.additions || 0;
                existing.deletions = detail?.stats?.deletions || 0;
                existing.filesChanged = detail?.files?.length || 0;
                existing.files = (detail?.files || []).map(f => ({
                  filename: f.filename,
                  status: f.status,
                  additions: f.additions,
                  deletions: f.deletions
                }));
                existing.githubAuthor = githubAuthor;
                existing.branch = branch.name;
                await existing.save();
                totalUpdated++;
              } catch (e) {
                console.warn(`Could not update detail for ${commitData.sha}: ${e.message}`);
              }
            }
            continue;
          }

          let detail = null;
          try {
            detail = await githubService.getCommitDetail(owner, repo, commitData.sha);
          } catch (e) {
            console.warn(`Could not fetch detail for ${commitData.sha}: ${e.message}`);
          }

          const newCommit = new Commit({
            projectId,
            githubCommitId: commitData.sha,
            message: commitData.commit.message,
            url: commitData.html_url,
            timestamp: new Date(commitData.commit.author.date),
            branch: branch.name,
            githubAuthor,
            filesChanged: detail?.files?.length || 0,
            insertions: detail?.stats?.additions || 0,
            deletions: detail?.stats?.deletions || 0,
            files: (detail?.files || []).map(f => ({
              filename: f.filename,
              status: f.status,
              additions: f.additions,
              deletions: f.deletions
            }))
          });

          try {
            await newCommit.save();
            totalSynced++;
          } catch (e) {
            if (e.code !== 11000) console.error(`Save error: ${e.message}`);
          }
        }
      }

      sendProgress({
        status: 'Terminé !',
        progress: 100,
        complete: true,
        newCount: totalSynced,
        updatedCount: totalUpdated,
        totalProcessed
      });

      res.end();
    } catch (err) {
      console.error('Sync error:', err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }

  static async getBranches(req, res) {
    try {
      const { projectId } = req.params;
      const Project = require('../models/Project');
      const project = await Project.findById(projectId);

      if (!project || !project.repositoryUrl) {
        return res.json({ success: true, branches: [] });
      }

      const parsed = GitHubService.parseRepositoryUrl(project.repositoryUrl);
      if (!parsed) return res.json({ success: true, branches: [] });

      const user = await User.findById(req.user.id);
      const githubService = new GitHubService(user.githubToken || null);
      const branches = await githubService.getRepositoryBranches(parsed.owner, parsed.repo);

      res.json({ success: true, branches: branches.map(b => ({ name: b.name, protected: b.protected })) });
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
      const githubService = new GitHubService(user.githubToken || null);
      const stats = await githubService.getRepositoryStats(owner, repo);

      res.json({ success: true, stats });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = CommitController;
