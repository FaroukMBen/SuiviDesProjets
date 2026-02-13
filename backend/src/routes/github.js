const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Étape 1: Rediriger l'utilisateur vers GitHub pour autorisation
// Le frontend redirige vers cette URL directement (pas via notre backend)
// On génère simplement l'URL de redirection
router.get('/connect-url', authenticate, (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
        return res.status(500).json({ success: false, message: 'GitHub OAuth non configuré sur le serveur.' });
    }

    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
    // On passe le userId dans le state pour retrouver l'utilisateur au callback
    const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64');

    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user&state=${state}`;

    res.json({ success: true, url: githubUrl });
});

// Étape 2: Callback de GitHub — échange le code contre un token
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code || !state) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?github=error&reason=missing_params`);
        }

        // Décoder le state pour récupérer le userId
        let stateData;
        try {
            stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        } catch (e) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?github=error&reason=invalid_state`);
        }

        // Échanger le code contre un access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`
        }, {
            headers: { Accept: 'application/json' }
        });

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?github=error&reason=no_token`);
        }

        // Récupérer les infos du profil GitHub
        const profileResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${accessToken}` }
        });

        const githubProfile = profileResponse.data;

        // Mettre à jour l'utilisateur avec les infos GitHub
        await User.findByIdAndUpdate(stateData.userId, {
            githubId: githubProfile.id.toString(),
            githubUsername: githubProfile.login,
            githubToken: accessToken,
            profilePicture: githubProfile.avatar_url
        });

        // Rediriger vers la page settings avec succès
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?github=success&username=${githubProfile.login}`);
    } catch (err) {
        console.error('GitHub OAuth callback error:', err.message);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?github=error&reason=server_error`);
    }
});

// Déconnecter GitHub
router.post('/disconnect', authenticate, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $unset: { githubId: 1, githubUsername: 1, githubToken: 1 }
        });
        res.json({ success: true, message: 'Compte GitHub déconnecté.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Vérifier le statut de connexion GitHub
router.get('/status', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            success: true,
            connected: !!user.githubToken,
            username: user.githubUsername || null,
            avatarUrl: user.profilePicture || null
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
