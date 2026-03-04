const Commit = require('../models/Commit');
const User = require('../models/User');
const GitHubService = require('../services/githubService');

class CommitController {
  static async getCommits(req, res) {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 10, branch } = req.query;

      const query = { projectId };
      if (branch && branch !== 'all') {
        query.branch = branch;
      }

      const total = await Commit.countDocuments(query);

      // Si limit=all, retourner tous les commits sans pagination
      if (limit === 'all' || limit === '0') {
        const commits = await Commit.find(query).sort({ timestamp: -1 });
        return res.json({
          success: true,
          commits,
          pagination: { page: 1, limit: total, total, pages: 1 }
        });
      }

      const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);
      const commits = await Commit.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number.Number.parseInt(limit));

      res.json({
        success: true,
        commits,
        pagination: {
          page: Number.Number.parseInt(page),
          limit: Number.Number.parseInt(limit),
          total,
          pages: Math.ceil(total / Number.parseInt(limit))
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async syncRepository(projectId, repositoryUrl, userId) {

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
    let rateLimitHit = false;

    // 4. Synchronisation
    for (const branch of branches) {
      let commits = [];
      try {
        commits = await githubService.getRepositoryCommits(owner, repo, branch.name);
      } catch (e) {
        if (e.response?.status === 403) {
          rateLimitHit = true;
          break;
        }
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

        // Séparer le titre (première ligne) et la description (reste du message)
        const fullMessage = commitData.commit.message || '';
        const messageParts = fullMessage.split('\n');
        const messageTitle = messageParts[0] || '';
        const messageDescription = messageParts.slice(1).join('\n').trim();
        const verified = commitData.commit?.verification?.verified || false;

        const existing = await Commit.findOne({ githubCommitId: commitData.sha, projectId });

        if (existing) {
          // Mettre à jour les commits existants qui ont 0 en stats, pas de description, ou pas d'auteur GitHub
          const needsUpdate = (existing.insertions === 0 && existing.deletions === 0)
            || !existing.description
            || existing.verified === undefined;
          if (needsUpdate) {
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
              existing.message = messageTitle;
              existing.description = messageDescription;
              existing.verified = verified;
              await existing.save();
              totalUpdated++;
            } catch (e) {
              if (e.response?.status === 403) {
                rateLimitHit = true;
                break;
              }
              console.warn(`Could not update detail for ${commitData.sha}: ${e.message}`);
            }
          }
          continue;
        }

        // Nouveau commit : enregistrer d'abord sans détails pour éviter rate limiting
        const newCommit = new Commit({
          projectId,
          githubCommitId: commitData.sha,
          message: messageTitle,
          description: messageDescription,
          url: commitData.html_url,
          timestamp: new Date(commitData.commit.author.date),
          branch: branch.name,
          githubAuthor,
          verified,
          filesChanged: 0,
          insertions: 0,
          deletions: 0,
          files: []
        });

        try {
          await newCommit.save();
          totalSynced++;

          // Essayer de récupérer les détails, mais ne pas bloquer si ça échoue
          try {
            const detail = await githubService.getCommitDetail(owner, repo, commitData.sha);
            if (detail) {
              newCommit.filesChanged = detail?.files?.length || 0;
              newCommit.insertions = detail?.stats?.additions || 0;
              newCommit.deletions = detail?.stats?.deletions || 0;
              newCommit.files = (detail?.files || []).map(f => ({
                filename: f.filename,
                status: f.status,
                additions: f.additions,
                deletions: f.deletions
              }));
              await newCommit.save();
            }
          } catch (detailError) {
            if (detailError.response?.status === 403) {
              rateLimitHit = true;
            }
          }
        } catch (e) {
          if (e.code !== 11000) console.error(`Save error: ${e.message}`);
        }
      }

      if (rateLimitHit) break;
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
      console.log(`\n========== SYNC START for project ${projectId} ==========`);

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
        console.log('[SYNC] No repository URL found');
        sendProgress({ error: 'Aucune URL de dépôt trouvée pour ce projet.' });
        return res.end();
      }
      const parsed = GitHubService.parseRepositoryUrl(project.repositoryUrl);
      if (!parsed) {
        console.log('[SYNC] Invalid GitHub URL:', project.repositoryUrl);
        sendProgress({ error: 'URL GitHub invalide.' });
        return res.end();
      }
      const owner = parsed.owner;
      const repo = parsed.repo;
      console.log(`[SYNC] Repository: ${owner}/${repo}`);

      const user = await User.findById(req.user.id);
      console.log(`[SYNC] User: ${user.email}, GitHub token: ${user.githubToken ? 'YES' : 'NO'}`);
      const githubService = new GitHubService(user.githubToken || null);

      sendProgress({ status: 'Récupération des branches...', progress: 0 });

      let branches = [];
      try {
        branches = await githubService.getRepositoryBranches(owner, repo);
        console.log(`[SYNC] Branches found: ${branches.map(b => b.name).join(', ')}`);
      } catch (e) {
        console.error(`[SYNC] Error fetching branches:`, e.message);
        if (e.response && (e.response.status === 404 || e.response.status === 403) && !user.githubToken) {
          sendProgress({
            error: 'Ce dépôt semble être privé. Connectez votre compte GitHub dans les Paramètres pour synchroniser des dépôts privés.',
            complete: true
          });
          return res.end();
        }
        branches = [{ name: 'main' }];
        console.log('[SYNC] Fallback to main branch only');
      }

      sendProgress({ status: `${branches.length} branche(s) trouvée(s)`, progress: 5 });

      let totalSynced = 0;
      let totalUpdated = 0;
      let totalProcessed = 0;
      let totalSkipped = 0;
      let rateLimitHit = false;

      // Traitement branche par branche (fetch unique par branche)
      for (let branchIdx = 0; branchIdx < branches.length; branchIdx++) {
        const branch = branches[branchIdx];
        const branchProgress = Math.round(5 + (branchIdx / branches.length) * 90);

        console.log(`\n--- Processing branch: ${branch.name} (${branchIdx + 1}/${branches.length}) ---`);
        sendProgress({ status: `Récupération des commits de ${branch.name}...`, progress: branchProgress });

        let commits = [];
        try {
          commits = await githubService.getRepositoryCommits(owner, repo, branch.name);
          console.log(`[SYNC] Branch ${branch.name}: ${commits.length} commits found`);
        } catch (e) {
          console.error(`[SYNC] Error fetching commits for ${branch.name}:`, e.message);
          if (e.response?.status === 403) {
            rateLimitHit = true;
            break;
          }
          continue;
        }

        sendProgress({
          status: `${commits.length} commit(s) sur ${branch.name}`,
          progress: branchProgress,
          processed: totalProcessed,
          total: commits.length
        });

        for (let i = 0; i < commits.length; i++) {
          const commitData = commits[i];
          totalProcessed++;

          // Séparer le titre et la description
          const fullMessage = commitData.commit.message || '';
          const messageParts = fullMessage.split('\n');
          const messageTitle = messageParts[0] || '';
          const messageDescription = messageParts.slice(1).join('\n').trim();
          const verified = commitData.commit?.verification?.verified || false;

          // Calcul de la progression
          const withinBranchProgress = Math.round((i / commits.length) * (90 / branches.length));
          const progress = Math.min(95, branchProgress + withinBranchProgress);
          sendProgress({
            status: `[${branch.name}] ${messageTitle.substring(0, 50)}...`,
            progress,
            processed: totalProcessed,
            total: 0
          });

          const githubAuthor = {
            login: commitData.author?.login || commitData.commit?.author?.name || 'unknown',
            avatarUrl: commitData.author?.avatar_url || null,
            name: commitData.commit?.author?.name || 'Unknown'
          };

          const existing = await Commit.findOne({ githubCommitId: commitData.sha, projectId });

          if (existing) {
            // Toujours ajouter la branche courante à la liste des branches
            if (!existing.branches.includes(branch.name)) {
              existing.branches.push(branch.name);
            }
            const needsUpdate = (existing.insertions === 0 && existing.deletions === 0)
              || !existing.description
              || existing.verified === undefined;
            if (needsUpdate) {
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
                existing.message = messageTitle;
                existing.description = messageDescription;
                existing.verified = verified;
                await existing.save();
                totalUpdated++;
              } catch (e) {
                console.warn(`[SYNC] Could not update detail for ${commitData.sha}: ${e.message}`);
                try { await existing.save(); } catch (_) { }
              }
            } else {
              try { await existing.save(); } catch (_) { }
              totalSkipped++;
            }
            continue;
          }

          let detail = null;
          try {
            detail = await githubService.getCommitDetail(owner, repo, commitData.sha);
          } catch (e) {
            console.warn(`[SYNC] Could not fetch detail for ${commitData.sha}: ${e.message}`);
          }

          const newCommit = new Commit({
            projectId,
            githubCommitId: commitData.sha,
            message: messageTitle,
            description: messageDescription,
            url: commitData.html_url,
            timestamp: new Date(commitData.commit.author.date),
            branch: branch.name,
            branches: [branch.name],
            githubAuthor,
            verified,
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
            console.log(`[SYNC] NEW commit saved: ${commitData.sha.substring(0, 7)} - ${messageTitle.substring(0, 40)}`);
          } catch (e) {
            if (e.code !== 11000) console.error(`Save error: ${e.message}`);
          }
        }

        if (rateLimitHit) break;
      }

      console.log(`\n========== SYNC COMPLETE for project ${projectId} ==========`);
      console.log(`- New commits: ${totalSynced}`);
      console.log(`- Updated details: ${totalUpdated}`);
      console.log(`- Skipped (already exists): ${totalSkipped}`);
      console.log(`- Total processed: ${totalProcessed}`);

      sendProgress({
        status: rateLimitHit ? 'Synchronisation partielle (Limite API)' : 'Synchronisation terminée !',
        progress: 100,
        complete: true,
        newCount: totalSynced,
        updatedCount: totalUpdated,
        totalProcessed
      });

      res.end();
    } catch (err) {
      console.error('[SYNC] FATAL ERROR:', err);
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
