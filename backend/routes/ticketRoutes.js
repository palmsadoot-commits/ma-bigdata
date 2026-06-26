const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/upload');

const validate = require('../middleware/validate');
const { createTicketSchema, updateTicketStatusSchema, createTicketLogSchema } = require('../schemas/ticketSchema');

router.get('/', authenticateToken, ticketController.getTickets);
router.get('/dashboard-by-milestone', authenticateToken, ticketController.getDashboardByMilestone);
router.post('/', authenticateToken, upload.single('attachment'), validate({ body: createTicketSchema }), ticketController.createTicket);
router.get('/:id', authenticateToken, ticketController.getTicketById);
router.put('/:id/update-status', authenticateToken, upload.array('attachments', 10), validate({ body: updateTicketStatusSchema }), ticketController.updateTicketStatus);
router.put('/:id/assign', authenticateToken, ticketController.assignTicket); // ✅ คืนค่าเส้นทาง assign
router.delete('/:id', authenticateToken, requireRole(['admin']), ticketController.deleteTicket);


// Ticket Logs
router.get('/:id/logs', authenticateToken, ticketController.getTicketLogs);
router.post('/:id/logs', authenticateToken, validate({ body: createTicketLogSchema }), ticketController.createTicketLog);

module.exports = router;
