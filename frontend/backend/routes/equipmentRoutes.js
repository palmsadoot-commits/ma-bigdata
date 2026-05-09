const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, equipmentController.getEquipments);
router.post('/', authenticateToken, requireRole(['admin']), equipmentController.createEquipment);
router.put('/:id', authenticateToken, requireRole(['admin']), equipmentController.updateEquipment);
router.put('/:id/status', authenticateToken, requireRole(['admin']), equipmentController.updateEquipmentStatus);
router.delete('/:id', authenticateToken, requireRole(['admin']), equipmentController.deleteEquipment);

module.exports = router;
