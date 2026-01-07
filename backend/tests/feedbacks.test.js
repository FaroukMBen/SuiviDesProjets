const request = require('supertest');
const app = require('../src/index');
const Feedback = require('../src/models/Feedback');
const jwt = require('jsonwebtoken');

// --- MOCK DU MODÈLE FEEDBACK ---
jest.mock('../src/models/Feedback', () => {
  const MockFeedback = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = 'fake_feedback_id';
    this.replies = [];
    
    // Populate sur l'instance (utilisé dans createFeedback)
    this.populate = jest.fn().mockImplementation(() => Promise.resolve(this));
  });

  // Save sur le prototype (Crucial pour createFeedback)
  MockFeedback.prototype.save = jest.fn().mockResolvedValue(this);

  // Méthodes statiques
  MockFeedback.find = jest.fn();
  MockFeedback.findById = jest.fn();
  MockFeedback.findByIdAndUpdate = jest.fn();
  MockFeedback.findByIdAndDelete = jest.fn();

  return MockFeedback;
});

// --- VARIABLES GLOBALES ---
const userId = 'user_123';
const adminId = 'admin_999';
const otherUserId = 'stranger_000';
const projectId = 'proj_456';

const userToken = jwt.sign(
  { id: userId, role: 'student' },
  process.env.JWT_SECRET || 'test_secret',
  { expiresIn: '1h' }
);

const adminToken = jwt.sign(
  { id: adminId, role: 'admin' },
  process.env.JWT_SECRET || 'test_secret',
  { expiresIn: '1h' }
);

const otherUserToken = jwt.sign(
  { id: otherUserId, role: 'student' },
  process.env.JWT_SECRET || 'test_secret',
  { expiresIn: '1h' }
);

describe('Feedback API', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TEST POST (Création)
  // ==========================================
  describe('POST /api/feedback', () => {
    it('devrait créer un feedback', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectId,
          content: 'Super projet !',
          type: 'suggestion'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.feedback.content).toBe('Super projet !');
      // Vérifie que save a été appelé sur l'instance
      expect(Feedback.prototype.save).toHaveBeenCalled();
    });
  });

  // ==========================================
  // TEST GET (Lecture avec chaînage complexe)
  // ==========================================
  describe('GET /api/feedback/project/:projectId', () => {
    it('devrait récupérer les feedbacks avec populate multiple', async () => {
      const mockFeedbacks = [{ content: 'Test', replies: [] }];
      
      // Simulation de la chaîne : find().populate().populate().sort()
      const mockSort = jest.fn().mockResolvedValue(mockFeedbacks);
      const mockPopulate2 = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      
      Feedback.find.mockReturnValue({ populate: mockPopulate1 });

      const res = await request(app)
        .get(`/api/feedback/project/${projectId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.feedback).toHaveLength(1);
      // On vérifie que populate a été appelé deux fois (chainage)
      expect(mockPopulate1).toHaveBeenCalled();
      expect(mockPopulate2).toHaveBeenCalled();
    });
  });

  // ==========================================
  // TEST REPLY (Ajout réponse)
  // ==========================================
  describe('POST /api/feedback/:id/reply', () => {
    it('devrait ajouter une réponse à un feedback', async () => {
      // Mock de l'objet retourné après mise à jour
      const updatedFeedback = {
        _id: 'fake_feedback_id',
        content: 'Original',
        replies: [{ content: 'Ma réponse', author: userId }]
      };

      // Simulation chaîne : findByIdAndUpdate().populate().populate()
      const mockPopulate2 = jest.fn().mockResolvedValue(updatedFeedback);
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      
      Feedback.findByIdAndUpdate.mockReturnValue({ populate: mockPopulate1 });

      const res = await request(app)
        .post('/api/feedback/fake_feedback_id/reply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Ma réponse' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.feedback.replies[0].content).toBe('Ma réponse');
      
      // Vérifie l'appel update avec $push
      expect(Feedback.findByIdAndUpdate).toHaveBeenCalledWith(
        'fake_feedback_id',
        expect.objectContaining({
          $push: expect.objectContaining({
            replies: expect.objectContaining({ content: 'Ma réponse' })
          })
        }),
        { new: true }
      );
    });

    it('devrait renvoyer 404 si le feedback n\'existe pas', async () => {
      // Si findByIdAndUpdate retourne null (via la chaîne)
      const mockPopulate2 = jest.fn().mockResolvedValue(null);
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      Feedback.findByIdAndUpdate.mockReturnValue({ populate: mockPopulate1 });

      const res = await request(app)
        .post('/api/feedback/inconnu/reply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Test' });

      expect(res.statusCode).toEqual(404);
    });
  });

  // ==========================================
  // TEST DELETE (Autorisations)
  // ==========================================
  describe('DELETE /api/feedback/:id', () => {
    
    // Cas 1 : Je suis l'auteur -> OK
    it('devrait supprimer si c\'est mon feedback', async () => {
      const myFeedback = { author: { toString: () => userId } };
      Feedback.findById.mockResolvedValue(myFeedback);
      Feedback.findByIdAndDelete.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/feedback/fake_id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Feedback deleted');
    });

    // Cas 2 : Je suis Admin -> OK
    it('devrait supprimer si je suis ADMIN (même si pas auteur)', async () => {
      const otherFeedback = { author: { toString: () => 'other_guy' } };
      Feedback.findById.mockResolvedValue(otherFeedback);
      Feedback.findByIdAndDelete.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/feedback/fake_id')
        .set('Authorization', `Bearer ${adminToken}`); // Token Admin

      expect(res.statusCode).toEqual(200);
    });

    // Cas 3 : Je suis un autre étudiant -> Interdit
    it('devrait refuser (403) si ce n\'est pas mon feedback', async () => {
      const notMyFeedback = { author: { toString: () => userId } }; // Appartient à user_123
      Feedback.findById.mockResolvedValue(notMyFeedback);

      const res = await request(app)
        .delete('/api/feedback/fake_id')
        .set('Authorization', `Bearer ${otherUserToken}`); // Token Stranger

      expect(res.statusCode).toEqual(403);
      expect(Feedback.findByIdAndDelete).not.toHaveBeenCalled();
    });

    // Cas 4 : Feedback introuvable
    it('devrait renvoyer 404 si non trouvé', async () => {
      Feedback.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/feedback/inconnu')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });

});