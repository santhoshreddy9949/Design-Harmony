const db = require('../config/db');

exports.getInvoices = (req, res) => {
  try {
    const invoices = db.find('invoices');
    const enriched = invoices.map(inv => {
      const customer = db.findById('customers', inv.customer_id);
      const order = inv.order_id ? db.findById('orders', inv.order_id) : null;
      return {
        ...inv,
        customer_name: customer ? customer.name : 'Unknown Customer',
        order_status: order ? order.status : 'N/A'
      };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInvoiceById = (req, res) => {
  try {
    const invoice = db.findById('invoices', req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const customer = db.findById('customers', invoice.customer_id);
    const items = db.find('invoice_items', { invoice_id: invoice.id });
    const payments = db.find('payments', { invoice_id: invoice.id });

    res.json({
      ...invoice,
      customer,
      items,
      payments
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createInvoice = (req, res) => {
  try {
    const { order_id, customer_id, issue_date, due_date, items, discount, tax_rate } = req.body;

    if (!customer_id || !items || !items.length) {
      return res.status(400).json({ message: 'Customer ID and invoice items are required' });
    }

    // Generate Auto Invoice Number: DH-YYYY-xxxx
    const year = new Date().getFullYear();
    const invoices = db.find('invoices');
    const count = invoices.length + 1;
    const invoice_number = `DH-${year}-${count.toString().padStart(4, '0')}`;

    let sub_total = 0;
    let tax_amount = 0;

    const itemsData = items.map(item => {
      const price = parseFloat(item.unit_price);
      const qty = parseInt(item.quantity);
      const itemTotal = price * qty;
      const gstRate = item.gst_rate !== undefined ? parseFloat(item.gst_rate) : 18.00;
      const gstAmt = Math.round(itemTotal * (gstRate / 100));

      sub_total += itemTotal;
      tax_amount += gstAmt;

      return {
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: qty,
        unit_price: price,
        gst_rate: gstRate,
        gst_amount: gstAmt,
        total_price: itemTotal + gstAmt
      };
    });

    const discount_amount = discount ? parseFloat(discount) : 0.00;
    const grand_total = sub_total + tax_amount - discount_amount;

    const invoice = db.insert('invoices', {
      order_id: order_id ? parseInt(order_id) : null,
      invoice_number,
      customer_id: parseInt(customer_id),
      issue_date: issue_date || new Date().toISOString().split('T')[0],
      due_date: due_date || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days due
      discount: discount_amount,
      tax_rate: tax_rate !== undefined ? parseFloat(tax_rate) : 18.00,
      sub_total,
      tax_amount,
      discount_amount,
      grand_total,
      payment_status: 'Pending'
    });

    // Write Invoice Items
    itemsData.forEach(item => {
      db.insert('invoice_items', {
        invoice_id: invoice.id,
        ...item
      });
    });

    // Trigger Notification for Due Invoice
    db.insert('notifications', {
      user_id: null,
      role: 'accountant',
      title: 'Invoice Generated',
      message: `Invoice ${invoice_number} generated for customer. Grand Total: ₹${grand_total}.`,
      type: 'Invoice Payments Due'
    });

    res.status(201).json({ invoice, items: itemsData });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendInvoiceEmail = (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.findById('invoices', id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    const customer = db.findById('customers', invoice.customer_id);
    if (!customer || !customer.email) {
      return res.status(400).json({ message: 'Customer has no registered email' });
    }

    // Simulate sending email
    res.json({ message: `Invoice ${invoice.invoice_number} successfully emailed to ${customer.email}.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
