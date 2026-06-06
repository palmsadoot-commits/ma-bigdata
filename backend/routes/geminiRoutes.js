const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/geminiController');
const { authenticateToken } = require('../middleware/auth');

router.get('/sessions', authenticateToken, geminiController.getSessions);
router.post('/sessions', authenticateToken, geminiController.createSession);
router.get('/messages/:sessionId', authenticateToken, geminiController.getMessages);
router.post('/send', authenticateToken, geminiController.sendMessage);
router.delete('/sessions/:sessionId', authenticateToken, geminiController.deleteSession);

module.exports = router;
