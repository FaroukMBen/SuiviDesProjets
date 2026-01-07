const request = require('supertest');
const app = require('../src/index'); 
const Campaign = require('../src/models/Campagne'); // Assure-toi que le chemin est bon
const jwt = require('jsonwebtoken');

// --- 1. MOCK DU MODÈLE CAMPAIGN ---
jest.mock('../src/models/Campagne', () => {
  // Le constructeur pour le new Campaign()
  const MockCampaign = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = 'fake_campaign_id';
    // Le controller attend que save() retourne l'objet
    this.save = jest.fn().mockResolvedValue(this);
  });

  // Méthodes statiques
  MockCampaign.find = jest.fn();
  MockCampaign.findById = jest.fn();
  MockCampaign.findByIdAndUpdate = jest.fn();

  return MockCampaign;
});

// --- 2. VARIABLES GLOBALES ---
const instructorId = 'inst_123';
const studentId = 'stud_456';

// Token Enseignant (Droit d'écriture)
const instructorToken = jwt.sign(
  { id: instructorId, role: 'instructor' },
  process.env.JWT_SECRET || 'test_secret',
  { expiresIn: '1h' }
);

// Token Étudiant (Lecture seule)
const studentToken = jwt.sign(
  { id: studentId, role: 'student' },
  process.env.JWT_SECRET || 'test_secret',
  { expiresIn: '1h' }
);

describe('Campagne API', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ======================================================
  // 1. TESTS DE LECTURE (GET) - Accessibles à tous
  // ======================================================
  
  describe('GET /api/campagne', () => {
    it('devrait récupérer la liste des campagnes (Accessible Etudiant)', async () => {
      // Simulation de la chaîne : find().populate().sort()
      const mockCampaigns = [{ title: 'Campagne 2024', status: 'active' }];
      
      const mockSort = jest.fn().mockResolvedValue(mockCampaigns);
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      Campaign.find.mockReturnValue({ populate: mockPopulate });

      const res = await request(app)
        .get('/api/campagne')
        .set('Authorization', `Bearer ${studentToken}`); // Étudiant OK

      expect(res.statusCode).toEqual(200);
      expect(res.body.campaigns).toHaveLength(1);
      expect(Campaign.find).toHaveBeenCalled();
    });
  });

  describe('GET /api/campagne/:id', () => {
    it('devrait récupérer une campagne par ID', async () => {
      const mockCampaign = { _id: '1', title: 'Campagne Unique' };

      // Simulation : findById().populate()
      const mockPopulate = jest.fn().mockResolvedValue(mockCampaign);
      Campaign.findById.mockReturnValue({ populate: mockPopulate });

      const res = await request(app)
        .get('/api/campagne/1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.campaign.title).toBe('Campagne Unique');
    });

    it('devrait renvoyer 404 si la campagne n\'existe pas', async () => {
      // Simulation : renvoie null
      const mockPopulate = jest.fn().mockResolvedValue(null);
      Campaign.findById.mockReturnValue({ populate: mockPopulate });

      const res = await request(app)
        .get('/api/campagne/999')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  // ======================================================
  // 2. TESTS D'ÉCRITURE (POST/PUT/DELETE) - Sécurité
  // ======================================================

  describe('POST /api/campagne', () => {
    it('devrait créer une campagne si Enseignant', async () => {
      const newCampaign = {
        title: 'Nouvelle Campagne',
        description: 'Test',
        startDate: new Date(),
        endDate: new Date()
      };

      const res = await request(app)
        .post('/api/campagne')
        .set('Authorization', `Bearer ${instructorToken}`) // <-- Token PROF
        .send(newCampaign);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      // Vérifie que le manager a bien été forcé à l'ID du prof
      expect(res.body.campaign.manager).toBe(instructorId);
    });

    it('devrait INTERDIRE la création si Étudiant (403)', async () => {
      const res = await request(app)
        .post('/api/campagne')
        .set('Authorization', `Bearer ${studentToken}`) // <-- Token ÉTUDIANT
        .send({ title: 'Hacking Attempt' });

      // Ton middleware requireInstructor doit renvoyer 403
      expect(res.statusCode).toEqual(403);
      // On vérifie que le contrôleur n'a jamais appelé save()
      // (Car le middleware bloque avant)
    });
  });

  describe('PUT /api/campagne/:id', () => {
    it('devrait mettre à jour si Enseignant', async () => {
      // On simule que findByIdAndUpdate renvoie l'objet modifié
      Campaign.findByIdAndUpdate.mockResolvedValue({ 
        _id: 'fake_id', 
        title: 'Titre Modifié' 
      });

      const res = await request(app)
        .put('/api/campagne/fake_id')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ title: 'Titre Modifié' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.campaign.title).toBe('Titre Modifié');
    });

    it('devrait INTERDIRE la modif si Étudiant (403)', async () => {
      const res = await request(app)
        .put('/api/campagne/fake_id')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Hacking' });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('DELETE /api/campagne/:id', () => {
    it('devrait archiver (soft delete) la campagne si Enseignant', async () => {
      // Le contrôleur fait un findByIdAndUpdate avec { status: 'archived' }
      Campaign.findByIdAndUpdate.mockResolvedValue({ _id: 'fake_id', status: 'archived' });

      const res = await request(app)
        .delete('/api/campagne/fake_id')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.statusCode).toEqual(200);
      // Vérifie qu'on a bien appelé Mongoose avec le statut 'archived'
      expect(Campaign.findByIdAndUpdate).toHaveBeenCalledWith(
        'fake_id', 
        { status: 'archived' }
      );
    });

    it('devrait INTERDIRE la suppression si Étudiant (403)', async () => {
      const res = await request(app)
        .delete('/api/campagne/fake_id')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(403);
      expect(Campaign.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

});