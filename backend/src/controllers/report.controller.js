const db = require('../config/db');

exports.getDashboardData = (req, res) => {
  try {
    const customers = db.find('customers');
    const projects = db.find('projects');
    const orders = db.find('orders');
    const products = db.find('products');
    const invoices = db.find('invoices');
    const inventory = db.find('inventory');

    const totalCustomers = customers.length;
    const activeProjects = projects.filter(p => ['New', 'Designing', 'Approval Pending', 'In Progress'].includes(p.status)).length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const pendingOrders = orders.filter(o => ['Pending', 'Confirmed', 'Manufacturing', 'Ready'].includes(o.status)).length;

    // Monthly revenue calculation (sum of Paid/Partially Paid invoices issued this month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = invoices
      .filter(inv => {
        const date = new Date(inv.issue_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear && inv.payment_status !== 'Pending';
      })
      .reduce((sum, inv) => sum + inv.grand_total, 0);

    // Low stock count
    const lowStockAlerts = inventory.filter(inv => {
      const prod = db.findById('products', inv.product_id);
      return prod ? prod.quantity <= inv.reorder_level : false;
    }).map(inv => {
      const prod = db.findById('products', inv.product_id);
      return {
        product_id: inv.product_id,
        product_name: prod ? prod.product_name : 'Unknown Product',
        current_quantity: prod ? prod.quantity : 0,
        reorder_level: inv.reorder_level
      };
    });

    // Recent activities (mock combine of recently updated entities)
    const recentActivities = [
      ...projects.slice(-3).map(p => ({ title: 'Project Updated', desc: `Project "${p.project_name}" is currently ${p.status}.`, time: p.updated_at })),
      ...orders.slice(-2).map(o => ({ title: 'New Order Placed', desc: `Order #${o.id} for ₹${o.total_amount} registered.`, time: o.created_at })),
      ...invoices.slice(-2).map(inv => ({ title: 'Invoice Issued', desc: `Invoice ${inv.invoice_number} created with status: ${inv.payment_status}.`, time: inv.created_at }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    // Sales Trend Graph Data
    const salesTrend = [
      { name: 'Mon', sales: 45000 },
      { name: 'Tue', sales: 28000 },
      { name: 'Wed', sales: 75000 },
      { name: 'Thu', sales: 50000 },
      { name: 'Fri', sales: 95000 },
      { name: 'Sat', sales: 40000 },
      { name: 'Sun', sales: 15000 }
    ];

    // Revenue Trend Graph Data (last 6 months)
    const revenueTrend = [
      { name: 'Jan', revenue: 150000 },
      { name: 'Feb', revenue: 220000 },
      { name: 'Mar', revenue: 180000 },
      { name: 'Apr', revenue: 310000 },
      { name: 'May', revenue: 250000 },
      { name: 'Jun', revenue: monthlyRevenue || 340000 }
    ];

    res.json({
      totalCustomers,
      activeProjects,
      completedProjects,
      pendingOrders,
      monthlyRevenue,
      lowStockCount: lowStockAlerts.length,
      lowStockAlerts,
      recentActivities,
      salesTrend,
      revenueTrend
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReports = (req, res) => {
  try {
    const { type, start_date, end_date } = req.query; // type: sales, inventory, projects, customer
    
    if (type === 'sales') {
      const invoices = db.find('invoices');
      const filtered = invoices.filter(inv => {
        if (start_date && inv.issue_date < start_date) return false;
        if (end_date && inv.issue_date > end_date) return false;
        return true;
      }).map(inv => {
        const cust = db.findById('customers', inv.customer_id);
        return {
          invoice_number: inv.invoice_number,
          customer_name: cust ? cust.name : 'Unknown',
          issue_date: inv.issue_date,
          sub_total: inv.sub_total,
          tax: inv.tax_amount,
          total: inv.grand_total,
          status: inv.payment_status
        };
      });
      return res.json(filtered);
    }

    if (type === 'inventory') {
      const products = db.find('products');
      const report = products.map(p => {
        const inv = db.findOne('inventory', { product_id: p.id });
        const supplier = inv ? db.findById('suppliers', inv.supplier_id) : null;
        return {
          product_name: p.product_name,
          category: p.category,
          stock: p.quantity,
          purchase_price: inv ? inv.purchase_price : 0,
          selling_price: p.price,
          supplier_name: supplier ? supplier.name : 'N/A',
          reorder_level: inv ? inv.reorder_level : 0
        };
      });
      return res.json(report);
    }

    if (type === 'projects') {
      const projects = db.find('projects');
      const report = projects.map(p => {
        const cust = db.findById('customers', p.customer_id);
        const designer = db.findById('users', p.assigned_designer_id);
        return {
          project_name: p.project_name,
          customer_name: cust ? cust.name : 'Unknown',
          designer_name: designer ? designer.name : 'Unassigned',
          status: p.status,
          progress: p.progress_percentage,
          budget: p.budget,
          start_date: p.start_date,
          end_date: p.end_date
        };
      });
      return res.json(report);
    }

    // Default or Customer Report
    const customers = db.find('customers');
    const report = customers.map(c => {
      const custProjects = db.find('projects', { customer_id: c.id });
      const custInvoices = db.find('invoices', { customer_id: c.id });
      const totalSpend = custInvoices.reduce((sum, inv) => sum + inv.grand_total, 0);
      return {
        customer_name: c.name,
        email: c.email,
        mobile: c.mobile_number,
        city: c.city,
        projects_count: custProjects.length,
        total_spend: totalSpend
      };
    });
    res.json(report);

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- SYSTEM NOTIFICATIONS ---
exports.getNotifications = (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let notifications = db.find('notifications');
    
    // Filter matching notifications
    const filtered = notifications.filter(n => {
      if (n.user_id === userId) return true;
      if (n.role && n.role === role) return true;
      if (!n.user_id && !n.role) return true; // general notification
      return false;
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markNotificationRead = (req, res) => {
  try {
    const { id } = req.params;
    const updated = db.update('notifications', id, { is_read: true });
    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
