const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, vendorController.getVendors);
router.post('/', authenticateToken, requireRole(['admin']), vendorController.createVendor);
router.put('/:id', authenticateToken, requireRole(['admin']), vendorController.updateVendor);
router.delete('/:id', authenticateToken, requireRole(['admin']), vendorController.deleteVendor);

module.exports = router;
