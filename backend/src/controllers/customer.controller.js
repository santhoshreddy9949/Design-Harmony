const db = require('../config/db');

exports.getCustomers = (req, res) => {
  try {
    const { search } = req.query;
    let customers = db.find('customers');

    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.mobile_number.includes(q) || 
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    }

    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCustomerById = (req, res) => {
  try {
    const customer = db.findById('customers', req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Attach projects history
    const projects = db.find('projects', { customer_id: customer.id });
    const invoices = db.find('invoices', { customer_id: customer.id });
    
    res.json({
      ...customer,
      projects,
      invoices
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCustomer = (req, res) => {
  try {
    const { name, mobile_number, email, address, city, state, pin_code, project_type, budget, notes } = req.body;
    if (!name || !mobile_number) {
      return res.status(400).json({ message: 'Name and mobile number are required' });
    }

    const newCust = db.insert('customers', {
      name,
      mobile_number,
      email: email ? email.toLowerCase() : null,
      address,
      city,
      state,
      pin_code,
      project_type,
      budget: budget ? parseFloat(budget) : 0,
      notes
    });

    res.status(201).json(newCust);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCustomer = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.budget) updates.budget = parseFloat(updates.budget);
    if (updates.email) updates.email = updates.email.toLowerCase();

    const updated = db.update('customers', id, updates);
    if (!updated) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCustomer = (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.delete('customers', id);
    if (!deleted) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
