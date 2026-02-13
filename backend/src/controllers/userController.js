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

  // 7. IMPORT CSV
  static async importStudents(req, res) {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    }

    const results = {
      total: 0,
      created: 0,
      updated: 0,
      errors: 0,
      errorDetails: []
    };

    try {
      // Parsing manuel du buffer CSV
      // On suppose un encodage UTF-8 (ou latin1, mais souvent UTF-8 en web)
      const fileContent = req.file.buffer.toString('utf-8');

      // Découpage en lignes
      const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

      if (lines.length < 2) {
        return res.status(400).json({ success: false, message: "Le fichier CSV semble vide ou ne contient pas d'en-tête." });
      }

      // Extraction de l'en-tête pour identifier les colonnes
      // On attend : name, email, academicYear, group
      const headers = lines[0].split(/[;,]/).map(h => h.trim().toLowerCase().replace(/"/g, ''));

      // Mapping des index
      const idxName = headers.indexOf('name');
      const idxEmail = headers.indexOf('email');
      const idxYear = headers.indexOf('academicyear');
      const idxGroup = headers.indexOf('group');

      if (idxName === -1 || idxEmail === -1) {
        return res.status(400).json({ success: false, message: "Le fichier doit contenir au moins les colonnes 'name' et 'email'." });
      }

      // Traitement des lignes de données (à partir de l'index 1)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.split(/[;,]/).map(c => c.trim().replace(/^"|"$/g, '')); // Gestion basique des guillemets

        if (cols.length < headers.length) {
          // Ligne incomplète ou vide
          continue;
        }

        results.total++;

        const name = cols[idxName];
        const email = cols[idxEmail];
        // Si colonnes absentes, on met undefined ou val par défaut
        const academicYear = idxYear !== -1 ? cols[idxYear] : 'BUT1';
        const group = idxGroup !== -1 ? cols[idxGroup] : '';

        if (!name || !email) {
          results.errors++;
          results.errorDetails.push(`Ligne ${i + 1}: Nom ou email manquant.`);
          continue;
        }

        try {
          // On cherche si l'utilisateur existe
          let user = await User.findOne({ email });

          if (user) {
            // UPDATE
            user.name = name;
            user.role = 'student'; // On force le rôle étudiant
            if (idxYear !== -1) user.academicYear = academicYear;
            if (idxGroup !== -1) user.group = group;

            await user.save();
            results.updated++;
          } else {
            // CREATE
            // Génération mot de passe par défaut (ex: 'changeme' + année)
            // Idéalement on envoie un mail, mais ici on reste simple
            const defaultPassword = await bcrypt.hash('changeme123', 10);

            user = new User({
              name,
              email,
              password: defaultPassword,
              role: 'student',
              academicYear,
              group
            });

            await user.save();
            results.created++;
          }

        } catch (rowError) {
          results.errors++;
          results.errorDetails.push(`Ligne ${i + 1} (${email}): ${rowError.message}`);
        }
      }

      res.json({ success: true, results });

    } catch (error) {
      console.error("Erreur import CSV:", error);
      res.status(500).json({ success: false, message: "Erreur lors du traitement du fichier CSV." });
    }
  }
}

module.exports = UserController; // <--- 2. EXPORT MANQUANT AJOUTÉ