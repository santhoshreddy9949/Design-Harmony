const db = require('../config/db');

// --- PRODUCTS ---
exports.getProducts = (req, res) => {
  try {
    const { category, search } = req.query;
    let products = db.find('products');

    if (category) {
      products = products.filter(p => p.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.product_name.toLowerCase().includes(q) || 
        (p.material && p.material.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProductById = (req, res) => {
  try {
    const product = db.findById('products', req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Find inventory details
    const inv = db.findOne('inventory', { product_id: product.id });
    res.json({
      ...product,
      inventory: inv
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createProduct = (req, res) => {
  try {
    const { product_name, category, material, dimensions, price, quantity, description, images, purchase_price, supplier_id, reorder_level } = req.body;

    if (!product_name || !category || !price) {
      return res.status(400).json({ message: 'Product name, category, and price are required' });
    }

    const prod = db.insert('products', {
      product_name,
      category,
      material,
      dimensions,
      price: parseFloat(price),
      quantity: quantity ? parseInt(quantity) : 0,
      description,
      images: images || []
    });

    // Create inventory record
    db.insert('inventory', {
      product_id: prod.id,
      stock_quantity: prod.quantity,
      supplier_id: supplier_id ? parseInt(supplier_id) : null,
      purchase_price: purchase_price ? parseFloat(purchase_price) : Math.round(parseFloat(price) * 0.6),
      selling_price: parseFloat(price),
      reorder_level: reorder_level ? parseInt(reorder_level) : 5
    });

    res.status(201).json(prod);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, category, material, dimensions, price, quantity, description, images, purchase_price, supplier_id, reorder_level } = req.body;

    const product = db.findById('products', id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProd = db.update('products', id, {
      product_name,
      category,
      material,
      dimensions,
      price: price ? parseFloat(price) : product.price,
      quantity: quantity !== undefined ? parseInt(quantity) : product.quantity,
      description,
      images: images !== undefined ? images : product.images
    });

    // Update inventory record
    const inv = db.findOne('inventory', { product_id: product.id });
    if (inv) {
      db.update('inventory', inv.id, {
        stock_quantity: quantity !== undefined ? parseInt(quantity) : inv.stock_quantity,
        supplier_id: supplier_id ? parseInt(supplier_id) : inv.supplier_id,
        purchase_price: purchase_price ? parseFloat(purchase_price) : inv.purchase_price,
        selling_price: price ? parseFloat(price) : inv.selling_price,
        reorder_level: reorder_level ? parseInt(reorder_level) : inv.reorder_level
      });
    }

    res.json(updatedProd);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProduct = (req, res) => {
  try {
    const deleted = db.delete('products', req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Cascades or manually deletes inventory
    const inv = db.findOne('inventory', { product_id: parseInt(req.params.id) });
    if (inv) {
      db.delete('inventory', inv.id);
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- STOCK IN / OUT ---
exports.adjustStock = (req, res) => {
  try {
    const { product_id, quantity, type } = req.body; // type: 'in' or 'out'
    if (!product_id || quantity === undefined || !type) {
      return res.status(400).json({ message: 'Product ID, quantity, and type are required' });
    }

    const product = db.findById('products', product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const inv = db.findOne('inventory', { product_id: product.id });
    if (!inv) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }

    let newQty = product.quantity;
    if (type === 'in') {
      newQty += parseInt(quantity);
    } else if (type === 'out') {
      newQty -= parseInt(quantity);
      if (newQty < 0) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
    }

    // Update Product & Inventory
    db.update('products', product.id, { quantity: newQty });
    db.update('inventory', inv.id, { stock_quantity: newQty });

    // Check reorder level
    if (newQty <= inv.reorder_level) {
      db.insert('notifications', {
        user_id: null,
        role: 'inventory_manager',
        title: 'Low Stock Warning',
        message: `${product.product_name} is running low (Remaining: ${newQty}). Reorder level: ${inv.reorder_level}.`,
        type: 'Low Stock'
      });
    }

    res.json({ message: 'Stock adjusted successfully', current_quantity: newQty });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- SUPPLIERS ---
exports.getSuppliers = (req, res) => {
  try {
    res.json(db.find('suppliers'));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createSupplier = (req, res) => {
  try {
    const { name, phone_number, email, address, gst_number } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }
    const newSup = db.insert('suppliers', { name, phone_number, email, address, gst_number });
    res.status(201).json(newSup);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSupplier = (req, res) => {
  try {
    const { id } = req.params;
    const updated = db.update('suppliers', id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadImage = (req, res) => {
  try {
    const { id } = req.params;
    const product = db.findById('products', id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const images = product.images || [];
    images.push(fileUrl);

    const updated = db.update('products', id, { images });
    res.json({ message: 'Product image uploaded successfully', product: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
