const request = require('supertest');
const app = require('../src/index');
const User = require('../src/models/User');

// --- MOCK DU MODÈLE USER ---
jest.mock('../src/models/User', () => {
  // 1. Simulation du constructeur (new User(...))
  const MockUser = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = 'fake_user_id';
    this.role = 'student';
    
    // Méthodes d'instance
    this.save = jest.fn().mockResolvedValue(this);
    this.comparePassword = jest.fn().mockResolvedValue(false); // Par défaut: mot de passe faux
  });

  // 2. Simulation des méthodes statiques (User.findOne, etc.)
  MockUser.findOne = jest.fn();

  return MockUser;
});

describe('Auth API (Mocks)', () => {
  
  // Nettoyer les mocks après chaque test pour éviter les conflits
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TEST REGISTER (INSCRIPTION)
  // ==========================================
  describe('POST /api/auth/register', () => {
    
    it('devrait inscrire un nouvel utilisateur (201)', async () => {
      // Cas : L'email n'existe pas encore
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Nouvel Etudiant',
          email: 'new@test.com',
          password: 'Password123!' // Doit respecter ton validateur (si tu en as un strict)
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('new@test.com');
      // Vérifie que save() a été appelé
      expect(User).toHaveBeenCalled(); 
    });

    it('devrait refuser si l\'email existe déjà (400)', async () => {
      // Cas : L'email est déjà trouvé en base
      User.findOne.mockResolvedValue({ _id: 'existing_id', email: 'exist@test.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dupliqué',
          email: 'exist@test.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/already registered/i);
    });
  });

  // ==========================================
  // TEST LOGIN (CONNEXION)
  // ==========================================
  describe('POST /api/auth/login', () => {
    
    // Données d'un utilisateur fictif stocké en base
    const mockStoredUser = {
      _id: 'fake_user_id',
      name: 'Login User',
      email: 'login@test.com',
      password: 'hashed_password',
      role: 'student',
      // Important : on doit mocker comparePassword sur l'objet retourné par findOne
      comparePassword: jest.fn().mockResolvedValue(true) // Simule "Mot de passe OK"
    };

    it('devrait connecter l\'utilisateur avec les bons identifiants (200)', async () => {
      // Cas : User trouvé
      User.findOne.mockResolvedValue(mockStoredUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'BonPassword123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(mockStoredUser.comparePassword).toHaveBeenCalled(); // Vérifie qu'on a testé le mdp
    });

    it('devrait refuser si le mot de passe est incorrect (401)', async () => {
      // Cas : User trouvé MAIS mot de passe faux
      const wrongPassUser = { ...mockStoredUser };
      wrongPassUser.comparePassword = jest.fn().mockResolvedValue(false); // Simule "Mot de passe Faux"
      
      User.findOne.mockResolvedValue(wrongPassUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'MauvaisPassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });

    it('devrait refuser si l\'utilisateur n\'existe pas (401)', async () => {
      // Cas : User introuvable
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inconnu@test.com',
          password: 'Password123'
        });

      expect(res.statusCode).toEqual(401);
    });
  });
});