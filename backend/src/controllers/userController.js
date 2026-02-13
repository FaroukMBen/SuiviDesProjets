const User = require('../models/User');
const bcrypt = require('bcryptjs'); // <--- 1. IMPORT MANQUANT AJOUTÉ

class UserController {

  // 1. CRÉER UN UTILISATEUR
  static async createUser(req, res) {
    try {
      const { firstName, lastName, name, email, password, role, academicYear, group } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Cet email est déjà utilisé." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        firstName: firstName || 'inconnu',
        lastName: lastName || name || 'inconnu',
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

  // 4. LISTER TOUS LES UTILISATEURS (Avec pagination)
  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalUsers = await User.countDocuments();
      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        users,
        pagination: {
          total: totalUsers,
          page,
          totalPages: Math.ceil(totalUsers / limit),
          limit
        }
      });
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
        const searchRegex = { $regex: q, $options: 'i' };
        filter.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { name: searchRegex },
          { email: searchRegex }
        ];
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

  // 6. RÉCUPÉRER LES ÉTUDIANTS (Filtres + Pagination)
  static async getStudents(req, res) {
    try {
      const { year, group, search, page = 1, limit = 12 } = req.query;

      let query = { role: 'student' };

      if (year) query.academicYear = year;
      if (group) query.group = group;

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        query.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { name: searchRegex }, // Fallback
          { email: searchRegex }
        ];
      }

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const totalStudents = await User.countDocuments(query);

      const students = await User.find(query)
        .select('-password')
        .sort({ lastName: 1, firstName: 1, name: 1 })
        .skip(skip)
        .limit(limitNum);

      const totalPages = Math.ceil(totalStudents / limitNum);

      res.json({
        success: true,
        students,
        pagination: {
          total: totalStudents,
          pages: totalPages,
          page: pageNum,
          limit: limitNum
        }
      });
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
      const idxFirstName = headers.indexOf('firstname');
      const idxLastName = headers.indexOf('lastname');
      const idxName = headers.indexOf('name');
      const idxEmail = headers.indexOf('email');
      const idxYear = headers.indexOf('academicyear');
      const idxGroup = headers.indexOf('group');

      if (idxEmail === -1 || (idxName === -1 && (idxFirstName === -1 || idxLastName === -1))) {
        return res.status(400).json({ success: false, message: "Le fichier doit contenir au moins les colonnes 'email' et ('firstname'/'lastname' ou 'name')." });
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

        const firstNameRaw = idxFirstName !== -1 ? cols[idxFirstName] : '';
        const lastNameRaw = idxLastName !== -1 ? cols[idxLastName] : '';
        const nameFallback = idxName !== -1 ? cols[idxName] : '';
        const email = cols[idxEmail];
        const academicYear = idxYear !== -1 ? cols[idxYear] : 'BUT1';
        const group = idxGroup !== -1 ? cols[idxGroup] : '';

        if (!email || (!nameFallback && !lastNameRaw)) {
          results.errors++;
          results.errorDetails.push(`Ligne ${i + 1}: Email ou nom manquant.`);
          continue;
        }

        try {
          let user = await User.findOne({ email });

          let firstName = firstNameRaw;
          let lastName = lastNameRaw;

          if (!lastName && nameFallback) {
            const parts = nameFallback.split(' ');
            if (parts.length > 1) {
              firstName = parts[0];
              lastName = parts.slice(1).join(' ');
            } else {
              lastName = nameFallback;
            }
          }

          if (user) {
            // UPDATE
            if (firstName) user.firstName = firstName;
            if (lastName) user.lastName = lastName;
            user.role = 'student';
            if (idxYear !== -1) user.academicYear = academicYear;
            if (idxGroup !== -1) user.group = group;

            await user.save();
            results.updated++;
          } else {
            // CREATE
            const defaultPassword = await bcrypt.hash('changeme123', 10);

            if (!firstName && !lastName) {
              firstName = 'inconnu';
              lastName = 'inconnu';
            }

            user = new User({
              firstName: firstName || 'inconnu',
              lastName: lastName || 'inconnu',
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