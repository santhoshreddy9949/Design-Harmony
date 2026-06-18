const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Quotations
router.get('/quotations', authenticate, orderController.getQuotations);
router.post('/quotations', authenticate, authorize(['admin', 'sales_executive']), orderController.createQuotation);
router.post('/quotations/:id/approve', authenticate, authorize(['admin', 'sales_executive']), orderController.approveQuotation);

// Orders
router.get('/orders', authenticate, orderController.getOrders);
router.get('/orders/:id', authenticate, orderController.getOrderById);
router.put('/orders/:id/status', authenticate, authorize(['admin', 'sales_executive', 'inventory_manager']), orderController.updateOrderStatus);

// Payments
router.get('/payments', authenticate, orderController.getPayments);
router.post('/payments', authenticate, authorize(['admin', 'accountant']), orderController.createPayment);

module.exports = router;
