const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
