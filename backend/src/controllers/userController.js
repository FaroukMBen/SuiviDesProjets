const User = require('../models/User');

class UserController {
    static async searchUsers(req, res) {
        try {
            const { q } = req.query; // query string

            if (!q) {
                return res.json({ success: true, users: [] });
            }

            console.log('Searching users with query:', q);
            console.log('Requester ID:', req.user.id);

            // Search by name or email, case insensitive
            // Exclude the current user from results (optional, but good UX)
            // Exclude sensitive fields like password
            const users = await User.find({
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } }
                ],
                _id: { $ne: req.user.id }
            }).select('name email profilePicture');

            res.json({ success: true, users });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async getStudents(req, res) {
        try {
            const { year, group, search } = req.query;
            
            // Filtre de base : on ne veut que les étudiants
            let query = { role: 'student' };

            // Filtres dynamiques
            if (year) query.academicYear = year;
            if (group) query.group = group;
            
            // Recherche par nom (insensible à la casse)
            if (search) {
            query.name = { $regex: search, $options: 'i' };
            }

            // On récupère id, nom, email, année, groupe (pas le mot de passe !)
            const students = await User.find(query).select('-password');
            
            res.status(200).json({ success: true, count: students.length, students });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    };
}

module.exports = UserController;
