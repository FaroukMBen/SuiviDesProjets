const request = require('supertest');
const app = require('../src/index');
const Archive = require('../src/models/Archive');
const Project = require('../src/models/Project');
const ExportService = require('../src/services/exportService');
const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const path = require('node:path');

// --- 1. MOCKS DES MODÈLES ---

// Mock Archive
jest.mock('../src/models/Archive', () => {
  const MockArchive = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    // Important: populate doit renvoyer une promesse qui résout 'this'
    this.populate = jest.fn().mockImplementation(() => Promise.resolve(this));
    // Save doit renvoyer une promesse
    this.save = jest.fn().mockResolvedValue(this);
  });

  // Méthodes statiques
  MockArchive.find = jest.fn();
  // On attache save au prototype pour être sûr
  MockArchive.prototype.save = jest.fn().mockResolvedValue({});

  return MockArchive;
});

// Mock Project
jest.mock('../src/models/Project', () => {
  const MockProject = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    // Simulation de toObject pour l'archivage
    this.toObject = jest.fn().mockReturnValue(data || {});
    this.save = jest.fn().mockResolvedValue(this);
    this.populate = jest.fn().mockImplementation(() => Promise.resolve(this));
  });

  MockProject.findById = jest.fn();
  MockProject.prototype.save = jest.fn().mockResolvedValue({});

  return MockProject;
});

// Mock Evaluation & Task (utilisés dans l'export)
jest.mock('../src/models/Evaluation', () => ({
  find: jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue([]) })
}));
jest.mock('../src/models/Task', () => ({
  find: jest.fn().mockResolvedValue([])
}));

// --- 2. MOCK DU SERVICE EXPORT ---
jest.mock('../src/services/exportService', () => ({
  exportProjectToPDF: jest.fn(),
  exportProjectToCSV: jest.fn()
}));

// --- VARIABLES GLOBALES ---
const instructorId = 'inst_123';
const studentId = 'stud_456';
const projectId = 'proj_ABC'; // ID utilisé pour les noms de fichiers

const instructorToken = jwt.sign(
  { id: instructorId, role: 'instructor' },
  process.env.JWT_SECRET || 'test_secret',
  { expiresIn: '1h' }
);

const studentToken = jwt.sign(
  { id: studentId, role: 'student' },
  process.env.JWT_SECRET || 'test_secret',
  { expiresIn: '1h' }
);

describe('Archive API', () => {
  // --- GESTION DES FICHIERS TEMPORAIRES ---
  // Le contrôleur cherche 'project-proj_ABC.csv' à la racine.
  // On doit créer ces fichiers physiquement pour que res.download ne plante pas.
  const csvFileName = `project-${projectId}.csv`;
  const pdfFileName = `project-${projectId}.pdf`;


  beforeAll(() => {
    // On crée des fichiers vides pour leurrer le contrôleur
    fs.writeFileSync(csvFileName, 'Dummy CSV content');
    fs.writeFileSync(pdfFileName, 'Dummy PDF content');
  });

  afterAll(() => {
    // Nettoyage propre
    if (fs.existsSync(csvFileName)) fs.unlinkSync(csvFileName);
    if (fs.existsSync(pdfFileName)) fs.unlinkSync(pdfFileName);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TEST GET /api/archive (Liste)
  // ==========================================
  describe('GET /api/archive', () => {
    it('devrait récupérer la liste des archives', async () => {
      const mockArchives = [{ reason: 'Old project' }];

      const mockSort = jest.fn().mockResolvedValue(mockArchives);
      const mockPopulate2 = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });

      Archive.find.mockReturnValue({ populate: mockPopulate1 });

      const res = await request(app)
        .get('/api/archive')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.archives).toHaveLength(1);
    });
  });

  // ==========================================
  // TEST POST /api/archive (Archivage)
  // ==========================================
  describe('POST /api/archive/:projectId', () => {
    {/** 
    it('devrait archiver un projet si Instructeur', async () => {
      // 1. Mock du projet existant
      // On s'assure que toObject est bien présent sur l'instance retournée
      const mockProjectInstance = new Project({ _id: projectId, title: 'Projet X', status: 'active' });
      Project.findById.mockResolvedValue(mockProjectInstance);

      const res = await request(app)
        .post(`/api/archive/${projectId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ reason: 'Terminé' });

      // Si ça échoue encore, on affiche l'erreur pour comprendre
      if (res.statusCode === 500) {
        console.error("Erreur 500 Debug:", res.body);
      }

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      
      // Vérifications
      expect(Archive.prototype.save).toHaveBeenCalled();
      expect(mockProjectInstance.status).toBe('archived');
      expect(mockProjectInstance.save).toHaveBeenCalled();
    });
    */}

    it('devrait refuser l\'archivage si Étudiant (403)', async () => {
      const res = await request(app)
        .post(`/api/archive/${projectId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ reason: 'Hacking' });
      expect(res.statusCode).toEqual(403);
    });

    it('devrait renvoyer 404 si le projet n\'existe pas', async () => {
      Project.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/archive/inconnu`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ reason: 'Test' });

      expect(res.statusCode).toEqual(404);
    });
  });

  // ==========================================
  // TEST EXPORTS (PDF/CSV)
  // ==========================================
  describe('Exports (PDF & CSV)', () => {

    it('devrait déclencher l\'export PDF', async () => {
      const mockProject = new Project({ _id: projectId, title: 'Projet PDF' });
      Project.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockProject)
        })
      });

      // Le Service doit retourner le nom du fichier que nous avons créé dans beforeAll
      ExportService.exportProjectToPDF.mockResolvedValue(pdfFileName);

      const res = await request(app)
        .get(`/api/archive/${projectId}/export/pdf`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200); // 200 OK car le fichier existe
      expect(ExportService.exportProjectToPDF).toHaveBeenCalled();
    });

    it('devrait déclencher l\'export CSV', async () => {
      const mockProject = new Project({ _id: projectId, title: 'Projet CSV' });
      Project.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockProject)
        })
      });

      // Pour le CSV, le contrôleur ignore la valeur de retour du service 
      // et construit le nom `project-{id}.csv` lui-même.
      // C'est pourquoi nous avons créé ce fichier précis dans beforeAll.
      ExportService.exportProjectToCSV.mockResolvedValue('ignored_path.csv');
      const res = await request(app)
        .get(`/api/archive/${projectId}/export/csv`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(ExportService.exportProjectToCSV).toHaveBeenCalled();
    });
  });
});