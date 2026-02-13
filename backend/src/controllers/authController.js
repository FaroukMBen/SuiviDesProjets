const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Fonction utilitaire
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

class AuthController {

  static async register(req, res) {
    try {
      const { firstName, lastName, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = new User({
        firstName,
        lastName,
        email,
        password,
        role: 'student'
      });
      await user.save();

      const token = generateToken(user._id, user.email, user.role);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          theme: user.theme
        }
      });
    } catch (err) {
      console.error("Erreur inscription:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await User.findOne({ email });
      const isMatch = user ? await user.comparePassword(password) : false;

      console.log(`[AUTH] Login attempt: ${email} - Found: ${!!user} - Match: ${isMatch}`);

      if (!isMatch) {
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      const token = generateToken(user._id, user.email, user.role);

      const effectiveLastName = user.lastName || user.name;
      const effectiveFirstName = user.firstName || 'inconnu';

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          firstName: effectiveFirstName,
          lastName: effectiveLastName,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          theme: user.theme,
          githubToken: user.githubToken ? '••••••••' : null
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async githubCallback(req, res) {
    const token = generateToken(req.user._id, req.user.email, req.user.role);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');

      const effectiveLastName = user.lastName || user.name;
      const effectiveFirstName = user.firstName || 'inconnu';

      res.json({
        success: true,
        user: {
          id: user._id,
          firstName: effectiveFirstName,
          lastName: effectiveLastName,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          academicYear: user.academicYear,
          group: user.group,
          theme: user.theme,
          githubToken: user.githubToken ? '••••••••' : null,
          githubUsername: user.githubUsername || null
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async refreshToken(req, res) {
    try {
      const token = generateToken(req.user.id, req.user.email, req.user.role);
      res.json({ success: true, token });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async logout(req, res) {
    res.json({ success: true, message: 'Logged out successfully' });
  }

  static async updateProfile(req, res) {
    try {
      const { firstName, lastName, email, password } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;

      // Vérifier si l'email change et s'il est déjà pris
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        user.email = email;
      }
      if (password) user.password = password;
      if (req.body.academicYear) user.academicYear = req.body.academicYear;
      if (req.body.group) user.group = req.body.group;
      if (req.body.theme) user.theme = req.body.theme;
      if (req.body.githubToken !== undefined) user.githubToken = req.body.githubToken;

      await user.save();

      const updatedUser = await User.findById(user._id).select('-password');

      res.json({
        success: true,
        user: {
          id: updatedUser._id,
          firstName: updatedUser.firstName || 'inconnu',
          lastName: updatedUser.lastName || updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          profilePicture: updatedUser.profilePicture,
          academicYear: updatedUser.academicYear,
          group: updatedUser.group,
          theme: updatedUser.theme,
          githubToken: updatedUser.githubToken ? '••••••••' : null,
          githubUsername: updatedUser.githubUsername || null
        },
        message: 'Profile updated successfully'
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = AuthController;