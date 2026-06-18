const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, invoiceController.getInvoices);
router.get('/:id', authenticate, invoiceController.getInvoiceById);
router.post('/', authenticate, authorize(['admin', 'accountant']), invoiceController.createInvoice);
router.post('/:id/email', authenticate, authorize(['admin', 'accountant']), invoiceController.sendInvoiceEmail);

module.exports = router;
