const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Fonction utilitaire (gardée locale au fichier ou mise dans utils)
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
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = new User({ name, email, password, role: 'student' });
      await user.save();

      const token = generateToken(user._id, user.email, user.role);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
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
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user._id, user.email, user.role);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async githubCallback(req, res) {
    // Note : req.user est rempli par Passport avant d'arriver ici
    const token = generateToken(req.user._id, req.user.email, req.user.role);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json({ success: true, user });
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
}

module.exports = AuthController;