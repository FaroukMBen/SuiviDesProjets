const express = require('express');
const passport = require('passport');
const AuthController = require('../controllers/authController'); // Import du contrôleur
const { authenticate } = require('../middleware/auth');
const { validateRegister } = require('../middleware/validation');
const { loginLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Routes Auth classiques
router.post('/register', validateRegister, loginLimiter, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post('/refresh-token', authenticate, AuthController.refreshToken);

// Route Profil
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, AuthController.updateProfile);

// Routes GitHub (Passport reste ici car c'est un middleware spécifique)
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  AuthController.githubCallback
);

module.exports = router;