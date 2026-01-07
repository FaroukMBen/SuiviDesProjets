const request = require('supertest');
const app = require('../src/index');
const Commit = require('../src/models/Commit');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

// --- 1. MOCK DE GITHUB SERVICE ---
const mockGetRepositoryCommits = jest.fn();
const mockGetRepositoryStats = jest.fn();

jest.mock('../src/services/githubService', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getRepositoryCommits: mockGetRepositoryCommits,
      getRepositoryStats: mockGetRepositoryStats
    };
  });
});

// --- 2. MOCK DU MODÈLE USER ---
jest.mock('../src/models/User', () => ({
  findById: jest.fn()
}));

// --- 3. MOCK DU MODÈLE COMMIT (CORRIGÉ) ---
jest.mock('../src/models/Commit', () => {
  const MockCommit = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = 'fake_commit_id';
    // populate reste sur l'instance pour le chaînage facile
    this.populate = jest.fn().mockImplementation(() => Promise.resolve(this));
  });

  // --- CORRECTION ICI : On attache save au PROTOTYPE ---
  // Cela permet à 'expect(Commit.prototype.save)' de fonctionner
  MockCommit.prototype.save = jest.fn().mockImplementation(function() {
    return Promise.resolve(this);
  });

  MockCommit.find = jest.fn();
  MockCommit.findOne = jest.fn(); 

  return MockCommit;
});

// --- VARIABLES GLOBALES ---
const userId = 'user_123';
const projectId = 'proj_456';
const token = jwt.sign(
  { id: userId, role: 'student' },
  process.env.JWT_SECRET || 'test_secret',
  { expiresIn: '1h' }
);

describe('Commit API', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/commits', () => {
    it('devrait créer un commit manuellement', async () => {
      const res = await request(app)
        .post('/api/commits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId,
          message: 'Initial commit',
          githubCommitId: 'sha123',
          filesChanged: 5
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/commits/project/:projectId', () => {
    it('devrait récupérer la liste des commits', async () => {
      const mockCommits = [{ message: 'Fix bug', githubCommitId: '123' }];
      
      const mockLimit = jest.fn().mockResolvedValue(mockCommits);
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      Commit.find.mockReturnValue({ populate: mockPopulate });

      const res = await request(app)
        .get(`/api/commits/project/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.commits).toHaveLength(1);
    });
  });

  describe('GET /api/commits/project/:projectId/stats', () => {
    it('devrait calculer les statistiques correctement', async () => {
      const mockCommits = [
        { filesChanged: 2, insertions: 10, deletions: 5 },
        { filesChanged: 4, insertions: 20, deletions: 5 }
      ];
      Commit.find.mockResolvedValue(mockCommits);

      const res = await request(app)
        .get(`/api/commits/project/${projectId}/stats`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.stats.totalFilesChanged).toBe(6);
    });
  });

  describe('POST /api/commits/sync/:projectId', () => {
    it('devrait synchroniser les commits depuis GitHub (Succès)', async () => {
      User.findById.mockResolvedValue({ _id: userId, githubToken: 'fake_gh_token' });

      const mockGitHubResponse = [
        {
          sha: 'new_sha_123',
          html_url: 'http://github.com/...',
          commit: { 
            message: 'Sync update', 
            author: { date: new Date().toISOString() } 
          },
          files: [{ additions: 10, deletions: 2 }]
        }
      ];
      mockGetRepositoryCommits.mockResolvedValue(mockGitHubResponse);
      Commit.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/commits/sync/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ owner: 'user', repo: 'repo' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('Synced 1 new commits');
      
      // MAINTENANT CELA VA MARCHER :
      expect(Commit.prototype.save).toHaveBeenCalled();
    });

    it('devrait refuser la sync si l\'utilisateur n\'a pas de token GitHub (400)', async () => {
      User.findById.mockResolvedValue({ _id: userId, githubToken: null });

      const res = await request(app)
        .post(`/api/commits/sync/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ owner: 'user', repo: 'repo' });

      expect(res.statusCode).toEqual(400);
      expect(mockGetRepositoryCommits).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/commits/github-stats', () => {
    it('devrait renvoyer les stats GitHub via le service', async () => {
      User.findById.mockResolvedValue({ _id: userId, githubToken: 'token' });
      mockGetRepositoryStats.mockResolvedValue({ stars: 10, forks: 2 });

      const res = await request(app)
        .post('/api/commits/github-stats')
        .set('Authorization', `Bearer ${token}`)
        .send({ owner: 'user', repo: 'repo' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.stats.stars).toBe(10);
    });
  });
});