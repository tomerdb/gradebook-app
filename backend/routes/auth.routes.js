const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const {
    verifyToken
} = require('../middleware/auth.middleware');

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

// Protected routes
router.get('/profile', verifyToken, AuthController.profile);

module.exports = router;