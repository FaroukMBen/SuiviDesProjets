const User = require('../models/User');
const bcrypt = require('bcryptjs'); // <--- 1. IMPORT MANQUANT AJOUTÉ

class UserController {

  // 1. CRÉER UN UTILISATEUR
  static async createUser(req, res) {
    try {
      const { name, email, password, role, academicYear, group } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Cet email est déjà utilisé." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role,
        academicYear: role === 'student' ? academicYear : undefined,
        group: role === 'student' ? group : undefined
      });

      await newUser.save();
      res.status(201).json({ success: true, user: newUser });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // 2. MODIFIER UN UTILISATEUR
  static async updateUser(req, res) {
    try {
      const { password, ...updateData } = req.body;

      if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (updateData.role !== 'student') {
        updateData.academicYear = undefined;
        updateData.group = undefined;
      }

      const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // 3. SUPPRIMER UN UTILISATEUR
  static async deleteUser(req, res) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "Utilisateur supprimé" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // 4. LISTER TOUS LES UTILISATEURS
  static async getAllUsers(req, res) {
    try {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      res.json({ success: true, users });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // 5. RECHERCHER (Pour l'admin ou général)
  static async searchUsers(req, res) {
    try {
      const { q, role } = req.query;
      if (!q && !role) return res.json({ success: true, users: [] });

      let filter = {};
      if (q) {
        filter.name = { $regex: q, $options: 'i' };
      }
      if (role) {
        filter.role = role;
      }

      const users = await User.find(filter).select('-password');

      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 6. RÉCUPÉRER LES ÉTUDIANTS (Filtres)
  static async getStudents(req, res) {
    try {
      const { year, group, search } = req.query;

      let query = { role: 'student' };

      if (year) query.academicYear = year;
      if (group) query.group = group;
      if (search) query.name = { $regex: search, $options: 'i' };

      const students = await User.find(query).select('-password');
      res.json({ success: true, count: students.length, students });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = UserController; // <--- 2. EXPORT MANQUANT AJOUTÉ