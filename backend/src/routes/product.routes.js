const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Products CRUD
router.get('/', authenticate, productController.getProducts);
router.get('/:id', authenticate, productController.getProductById);
router.post('/', authenticate, authorize(['admin', 'inventory_manager']), productController.createProduct);
router.put('/:id', authenticate, authorize(['admin', 'inventory_manager']), productController.updateProduct);
router.delete('/:id', authenticate, authorize(['admin']), productController.deleteProduct);

// Upload product image
const upload = require('../middleware/upload.middleware');
router.post('/:id/upload-image', authenticate, authorize(['admin', 'inventory_manager']), upload.single('product_image'), productController.uploadImage);

// Stock control
router.post('/adjust-stock', authenticate, authorize(['admin', 'inventory_manager']), productController.adjustStock);

// Suppliers CRUD
router.get('/suppliers/all', authenticate, productController.getSuppliers);
router.post('/suppliers/all', authenticate, authorize(['admin', 'inventory_manager']), productController.createSupplier);
router.put('/suppliers/all/:id', authenticate, authorize(['admin', 'inventory_manager']), productController.updateSupplier);

module.exports = router;
