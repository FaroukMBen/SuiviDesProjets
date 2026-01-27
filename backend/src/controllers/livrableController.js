const Livrable = require('../models/Livrable');
const Project = require('../models/Project');

class LivrableController {

    static async getAllLivrables(req, res) {
        try {
            const { project, status, student } = req.query;
            let filter = {};

            if (project) filter.projectId = project;
            if (status) filter.status = status;
            if (student) filter.studentId = student;
            if (req.user.role === 'student' && !filter.studentId) {
                filter.studentId = req.user.id;
            }

            const livrables = await Livrable.find(filter)
                .populate('studentId', 'name email profilePicture group')
                .populate('projectId', 'title members')
                .populate('validatedBy', 'name')
                .sort({ uploadDate: -1 });

            res.json({ success: true, count: livrables.length, livrables });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Récupérer un livrable par ID
    static async getLivrableById(req, res) {
        try {
            const livrable = await Livrable.findById(req.params.id)
                .populate('studentId', 'name email profilePicture')
                .populate('projectId', 'title')
                .populate('validatedBy', 'name');

            if (!livrable) {
                return res.status(404).json({ success: false, message: 'Livrable non trouvé' });
            }

            res.json({ success: true, livrable });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Valider ou rejeter un livrable (Enseignant/Admin seulement)
    static async validateLivrable(req, res) {
        try {
            const { status, feedback } = req.body;
            const { id } = req.params;

            // Vérification du rôle
            if (req.user.role === 'student') {
                return res.status(403).json({ success: false, message: 'Accès non autorisé. Réservé aux enseignants.' });
            }

            const livrable = await Livrable.findById(id);
            if (!livrable) {
                return res.status(404).json({ success: false, message: 'Livrable non trouvé' });
            }

            // Mise à jour
            if (status) livrable.status = status;
            if (feedback !== undefined) livrable.feedback = feedback;

            livrable.validatedBy = req.user.id;
            livrable.validatedAt = Date.now();

            await livrable.save();

            // Populate pour le retour
            await livrable.populate('studentId', 'name profilePicture');
            await livrable.populate('projectId', 'title');
            await livrable.populate('validatedBy', 'name');

            // TODO: Créer une notification pour l'étudiant

            res.json({ success: true, livrable });

        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = LivrableController;
