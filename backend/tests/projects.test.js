const request = require('supertest');
const app = require('../src/index'); 
const Project = require('../src/models/Project'); 
const Task = require('../src/models/Task'); // Nécessaire pour le deleteProject
const jwt = require('jsonwebtoken');

// --- MOCKS ---

// 1. Mock du modèle Task (car le contrôleur l'utilise pour supprimer les tâches liées)
jest.mock('../src/models/Task', () => ({
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 5 })
}));

// 2. Mock du modèle Project (plus complet)
jest.mock('../src/models/Project', () => {
  // Le constructeur pour le POST
  const MockProject = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = 'fake_project_id';
    this.owner = { _id: '507f1f77bcf86cd799439011', toString: () => '507f1f77bcf86cd799439011' };
    this.members = [];
    this.files = [];
    
    this.save = jest.fn().mockResolvedValue(this);
    this.populate = jest.fn().mockImplementation(() => Promise.resolve(this));
  });

  // Méthodes statiques (find, findById, etc.)
  MockProject.find = jest.fn();
  MockProject.findById = jest.fn();
  MockProject.findByIdAndDelete = jest.fn();

  return MockProject;
});

// --- VARIABLES GLOBALES ---

const mockUserId = '507f1f77bcf86cd799439011'; // ID de l'étudiant connecté
const otherUserId = '607f1f77bcf86cd799439099'; // Un autre ID pour tester la sécurité

const token = jwt.sign(
  { id: mockUserId, role: 'student' },
  process.env.JWT_SECRET || 'test_secret',
  { expiresIn: '1h' }
);

// Objet Project standard pour les retours de findById
const mockProjectInstance = {
  _id: 'fake_project_id',
  title: 'Projet Existant',
  description: 'Description',
  owner: { _id: mockUserId, toString: () => mockUserId, name: 'Moi' }, // Je suis le owner
  members: [],
  populate: jest.fn().mockReturnThis(), // Pour le chaînage
  save: jest.fn().mockResolvedValue(true)
};

describe('Project API (Full Coverage)', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- TEST CRÉATION (DÉJÀ FAIT) ---
  describe('POST /api/projects', () => {
    it('devrait créer un projet', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Nouveau', deadline: new Date() });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
    });
  });

  // --- TEST RÉCUPÉRATION PAR ID ---
  describe('GET /api/projects/:id', () => {
    it('devrait renvoyer un projet si l\'utilisateur est autorisé', async () => {
      // Simulation : findById renvoie un objet qui a une méthode populate
      Project.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProjectInstance)
      });

      const res = await request(app)
        .get('/api/projects/fake_project_id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.project.title).toBe('Projet Existant');
    });

    it('devrait renvoyer 404 si le projet n\'existe pas', async () => {
      // Simulation : findById renvoie null après populate
      Project.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .get('/api/projects/inconnu')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  // --- TEST MISE À JOUR (UPDATE) ---
  describe('PUT /api/projects/:id', () => {
    it('devrait mettre à jour le projet', async () => {
      // 1. On récupère le projet
      Project.findById.mockResolvedValue(mockProjectInstance);

      // 2. On lance la requête
      const res = await request(app)
        .put('/api/projects/fake_project_id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Titre Modifié' });

      expect(res.statusCode).toEqual(200);
      // Vérifie que le save() a bien été appelé sur l'instance
      expect(mockProjectInstance.save).toHaveBeenCalled();
      // Vérifie que le titre a changé dans la réponse (mockée) ou via l'appel
      // Note: Dans un vrai mock complet, on vérifierait mockProjectInstance.title
    });

    it('devrait interdire la modification à un non-propriétaire (403)', async () => {
      // On simule un projet qui appartient à quelqu'un d'autre
      const otherProject = {
        ...mockProjectInstance,
        owner: { _id: otherUserId, toString: () => otherUserId }, // Pas moi !
        members: []
      };
      Project.findById.mockResolvedValue(otherProject);

      const res = await request(app)
        .put('/api/projects/fake_project_id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Hacking attempt' });

      expect(res.statusCode).toEqual(403);
    });
  });

  // --- TEST SUPPRESSION (DELETE) ---
  describe('DELETE /api/projects/:id', () => {
    it('devrait supprimer le projet et ses tâches associées', async () => {
      // 1. Mock du findById (pour vérifier les droits)
      Project.findById.mockResolvedValue(mockProjectInstance);
      
      // 2. Mock du findByIdAndDelete (pour la suppression réelle)
      Project.findByIdAndDelete.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/projects/fake_project_id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('deleted');
      
      // Vérifie qu'on a bien nettoyé les tâches liées 
      expect(Task.deleteMany).toHaveBeenCalledWith({ projectId: 'fake_project_id' });
    });
  });
});