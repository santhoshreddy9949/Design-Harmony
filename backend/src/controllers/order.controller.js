const db = require('../config/db');

// --- QUOTATIONS ---
exports.getQuotations = (req, res) => {
  try {
    const quotations = db.find('quotations');
    const enriched = quotations.map(q => {
      const customer = db.findById('customers', q.customer_id);
      const project = q.project_id ? db.findById('projects', q.project_id) : null;
      return {
        ...q,
        customer_name: customer ? customer.name : 'Unknown Customer',
        project_name: project ? project.project_name : 'No Project'
      };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createQuotation = (req, res) => {
  try {
    const { customer_id, project_id, items, discount, tax_rate } = req.body;
    if (!customer_id || !items || !items.length) {
      return res.status(400).json({ message: 'Customer ID and quotation items are required' });
    }

    let subTotal = 0;
    const itemsData = items.map(item => {
      const total = item.quantity * item.unit_price;
      subTotal += total;
      return {
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: total
      };
    });

    const taxVal = tax_rate !== undefined ? parseFloat(tax_rate) : 18.00;
    const discountVal = discount ? parseFloat(discount) : 0.00;
    const taxAmount = Math.round(subTotal * (taxVal / 100));
    const totalAmount = subTotal + taxAmount - discountVal;

    const quotation = db.insert('quotations', {
      customer_id: parseInt(customer_id),
      project_id: project_id ? parseInt(project_id) : null,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days expiry
      tax_rate: taxVal,
      discount: discountVal,
      total_amount: totalAmount,
      pdf_url: null
    });

    // Save quotation items
    itemsData.forEach(item => {
      db.insert('quotation_items', {
        quotation_id: quotation.id,
        ...item
      });
    });

    res.status(201).json({ quotation, items: itemsData });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveQuotation = (req, res) => {
  try {
    const { id } = req.params;
    const quotation = db.findById('quotations', id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    db.update('quotations', id, { status: 'Approved' });

    // Auto-create an Order from the approved quotation!
    const qItems = db.find('quotation_items', { quotation_id: quotation.id });
    
    const order = db.insert('orders', {
      customer_id: quotation.customer_id,
      project_id: quotation.project_id,
      status: 'Confirmed',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks delivery
      total_amount: quotation.total_amount
    });

    // Insert order items
    qItems.forEach(item => {
      db.insert('order_items', {
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      });

      // Deduct stock quantity
      if (item.product_id) {
        const prod = db.findById('products', item.product_id);
        if (prod) {
          const newQty = Math.max(0, prod.quantity - item.quantity);
          db.update('products', prod.id, { quantity: newQty });

          const inv = db.findOne('inventory', { product_id: prod.id });
          if (inv) {
            db.update('inventory', inv.id, { stock_quantity: newQty });

            // Trigger stock notification if reorder level crossed
            if (newQty <= inv.reorder_level) {
              db.insert('notifications', {
                user_id: null,
                role: 'inventory_manager',
                title: 'Low Stock Alert',
                message: `${prod.product_name} stock is low (${newQty} left) following Order creation.`,
                type: 'Low Stock'
              });
            }
          }
        }
      }
    });

    // Send notifications to Admin/Sales
    db.insert('notifications', {
      user_id: null,
      role: 'admin',
      title: 'Quotation Approved',
      message: `Quotation #${quotation.id} approved. Order #${order.id} generated automatically.`,
      type: 'New Order'
    });

    res.json({ message: 'Quotation approved and order created', order_id: order.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- ORDERS ---
exports.getOrders = (req, res) => {
  try {
    const orders = db.find('orders');
    const enriched = orders.map(o => {
      const customer = db.findById('customers', o.customer_id);
      const project = o.project_id ? db.findById('projects', o.project_id) : null;
      return {
        ...o,
        customer_name: customer ? customer.name : 'Unknown Customer',
        project_name: project ? project.project_name : 'No Project'
      };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrderById = (req, res) => {
  try {
    const order = db.findById('orders', req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const customer = db.findById('customers', order.customer_id);
    const items = db.find('order_items', { order_id: order.id });
    res.json({
      ...order,
      customer,
      items
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOrderStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_id, delivery_date } = req.body;

    const order = db.findById('orders', id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updated = db.update('orders', id, { status, tracking_id, delivery_date });

    // Notify about status updates
    db.insert('notifications', {
      user_id: null,
      role: 'sales_executive',
      title: 'Order Status Update',
      message: `Order #${order.id} status changed from ${order.status} to ${status}.`,
      type: 'New Order'
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- PAYMENTS ---
exports.getPayments = (req, res) => {
  try {
    const payments = db.find('payments');
    const enriched = payments.map(p => {
      const invoice = db.findById('invoices', p.invoice_id);
      const customer = invoice ? db.findById('customers', invoice.customer_id) : null;
      return {
        ...p,
        invoice_number: invoice ? invoice.invoice_number : 'N/A',
        customer_name: customer ? customer.name : 'Unknown Customer'
      };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPayment = (req, res) => {
  try {
    const { invoice_id, amount, payment_method, transaction_reference } = req.body;

    if (!invoice_id || !amount || !payment_method) {
      return res.status(400).json({ message: 'Invoice ID, amount, and payment method are required' });
    }

    const invoice = db.findById('invoices', invoice_id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const payment = db.insert('payments', {
      invoice_id: parseInt(invoice_id),
      amount: parseFloat(amount),
      payment_method,
      transaction_reference,
      status: 'Paid'
    });

    // Recalculate invoice payment status
    const allPayments = db.find('payments', { invoice_id: invoice.id });
    const paidSum = allPayments.reduce((sum, p) => sum + p.amount, 0);

    let newStatus = 'Pending';
    if (paidSum >= invoice.grand_total) {
      newStatus = 'Paid';
    } else if (paidSum > 0) {
      newStatus = 'Partially Paid';
    }

    db.update('invoices', invoice.id, { payment_status: newStatus });

    // Notify Accountant
    db.insert('notifications', {
      user_id: null,
      role: 'accountant',
      title: 'Payment Received',
      message: `A payment of ₹${amount} received for invoice ${invoice.invoice_number}. Invoice status: ${newStatus}.`,
      type: 'Invoice Payments Due'
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
