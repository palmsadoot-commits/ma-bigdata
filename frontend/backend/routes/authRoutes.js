const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// LINE Auth Routes
router.get('/line', authController.lineLogin);
router.get('/line/callback', authController.lineCallback);
router.get('/line/link', authController.linkLine);

// Google Auth Routes
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);
router.get('/google/link', authController.linkGoogle);

module.exports = router;
