const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { statusSchema } = require('../schemas/statusSchema');

router.get('/', authenticateToken, statusController.getStatuses);
router.post('/', authenticateToken, requireRole(['admin']), validate({ body: statusSchema }), statusController.createStatus);
router.put('/:id', authenticateToken, requireRole(['admin']), validate({ body: statusSchema }), statusController.updateStatus);
router.delete('/:id', authenticateToken, requireRole(['admin']), statusController.deleteStatus);

module.exports = router;

