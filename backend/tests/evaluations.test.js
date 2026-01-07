const request = require('supertest');
const app = require('../src/index');
const Task = require('../src/models/Task');
const Project = require('../src/models/Project');
const jwt = require('jsonwebtoken');

// --- 1. MOCK PROJECT ---
jest.mock('../src/models/Project', () => ({
  findById: jest.fn()
}));

// --- 2. MOCK TASK (CORRIGÉ) ---
jest.mock('../src/models/Task', () => {
  const MockTask = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = 'fake_task_id';
    
    // populate sur l'instance
    this.populate = jest.fn().mockImplementation((field) => {
      if (field === 'assignee') {
        this.assignee = { _id: 'user_id', name: 'Test User' };
      }
      return Promise.resolve(this);
    });
  });

  // --- CORRECTION ICI : save sur le PROTOTYPE ---
  MockTask.prototype.save = jest.fn().mockImplementation(function() {
    return Promise.resolve(this);
  });

  MockTask.find = jest.fn();
  MockTask.findOne = jest.fn();
  MockTask.findById = jest.fn();
  MockTask.findByIdAndUpdate = jest.fn();
  MockTask.findByIdAndDelete = jest.fn();

  return MockTask;
});

const userId = 'user_123';
const projectId = 'proj_456';
const token = jwt.sign(
  { id: userId, role: 'student' },
  process.env.JWT_SECRET || 'test_secret',
  { expiresIn: '1h' }
);

describe('Task API', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('devrait récupérer les tâches de l\'utilisateur connecté', async () => {
      const mockTasks = [{ title: 'Ma Tâche', assignee: userId }];
      const mockSort = jest.fn().mockResolvedValue(mockTasks);
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      Task.find.mockReturnValue({ populate: mockPopulate });

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.tasks).toHaveLength(1);
    });
  });

  describe('GET /api/tasks/project/:projectId', () => {
    it('devrait récupérer les tâches d\'un projet', async () => {
      const mockTasks = [{ title: 'Tâche Projet', projectId: projectId }];
      const mockSort = jest.fn().mockResolvedValue(mockTasks);
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      Task.find.mockReturnValue({ populate: mockPopulate });

      const res = await request(app)
        .get(`/api/tasks/project/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
    });
  });

  describe('POST /api/tasks', () => {
    it('devrait créer une tâche si le projet existe', async () => {
      Project.findById.mockResolvedValue({ _id: projectId, title: 'Projet Test' });

      const mockSelect = jest.fn().mockResolvedValue({ order: 5 });
      const mockSort = jest.fn().mockReturnValue({ select: mockSelect });
      Task.findOne.mockReturnValue({ sort: mockSort });

      const newTaskData = {
        projectId: projectId,
        title: 'Nouvelle Tâche',
        priority: 'high',
        dueDate: new Date().toISOString()
      };

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(newTaskData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.task.order).toBe(6);
    });

    it('devrait refuser si le projet n\'existe pas (404)', async () => {
      Project.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ projectId: 'fake_id', title: 'Tâche orpheline' });

      expect(res.statusCode).toEqual(404);
      
      // MAINTENANT CELA VA MARCHER :
      expect(Task.prototype.save).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('devrait mettre à jour une tâche', async () => {
      const mockTaskInstance = new Task({ title: 'Ancien Titre' });
      // Important : mockTaskInstance hérite de Task.prototype, donc .save() est dispo
      Task.findById.mockResolvedValue(mockTaskInstance);

      const res = await request(app)
        .put('/api/tasks/fake_task_id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Nouveau Titre', status: 'done' });

      expect(res.statusCode).toEqual(200);
      expect(mockTaskInstance.title).toBe('Nouveau Titre');
      expect(Task.prototype.save).toHaveBeenCalled();
    });

    it('devrait renvoyer 404 si la tâche n\'existe pas', async () => {
      Task.findById.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/tasks/inconnu')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test' });

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /api/tasks/reorder', () => {
    it('devrait réorganiser les tâches', async () => {
      Task.findByIdAndUpdate.mockResolvedValue(true);
      const tasksToReorder = [{ id: 't1' }, { id: 't2' }, { id: 't3' }];

      const res = await request(app)
        .post('/api/tasks/reorder')
        .set('Authorization', `Bearer ${token}`)
        .send({ tasks: tasksToReorder });

      expect(res.statusCode).toEqual(200);
      expect(Task.findByIdAndUpdate).toHaveBeenCalledTimes(3);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('devrait supprimer une tâche', async () => {
      Task.findByIdAndDelete.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/tasks/fake_task_id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
    });
  });
});