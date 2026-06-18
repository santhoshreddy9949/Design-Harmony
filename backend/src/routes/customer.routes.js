const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All authenticated users can view, but only sales, designers, or admins can edit/delete
router.get('/', authenticate, customerController.getCustomers);
router.get('/:id', authenticate, customerController.getCustomerById);
router.post('/', authenticate, authorize(['admin', 'sales_executive', 'designer']), customerController.createCustomer);
router.put('/:id', authenticate, authorize(['admin', 'sales_executive', 'designer']), customerController.updateCustomer);
router.delete('/:id', authenticate, authorize(['admin']), customerController.deleteCustomer);

module.exports = router;
