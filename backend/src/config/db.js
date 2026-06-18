const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache
const dbCache = {};

function getFilePath(table) {
  return path.join(DATA_DIR, `${table}.json`);
}

function readData(table) {
  if (dbCache[table]) return dbCache[table];
  const filePath = getFilePath(table);
  if (!fs.existsSync(filePath)) {
    dbCache[table] = [];
    writeData(table, []);
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    dbCache[table] = JSON.parse(raw);
    return dbCache[table];
  } catch (err) {
    console.error(`Error reading ${table} db:`, err);
    return [];
  }
}

function writeData(table, data) {
  dbCache[table] = data;
  const filePath = getFilePath(table);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${table} db:`, err);
  }
}

// Helper to auto-increment ID
function getNextId(table) {
  const data = readData(table);
  if (data.length === 0) return 1;
  return Math.max(...data.map(item => item.id || 0)) + 1;
}

// Database client API
const db = {
  find: (table, query = {}) => {
    const list = readData(table);
    return list.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findOne: (table, query = {}) => {
    const list = readData(table);
    return list.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },

  findById: (table, id) => {
    const list = readData(table);
    return list.find(item => item.id === parseInt(id)) || null;
  },

  insert: (table, record) => {
    const list = readData(table);
    const newRecord = {
      id: getNextId(table),
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.push(newRecord);
    writeData(table, list);
    return newRecord;
  },

  update: (table, id, updates) => {
    const list = readData(table);
    const index = list.findIndex(item => item.id === parseInt(id));
    if (index === -1) return null;
    const updated = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    list[index] = updated;
    writeData(table, list);
    return updated;
  },

  delete: (table, id) => {
    const list = readData(table);
    const index = list.findIndex(item => item.id === parseInt(id));
    if (index === -1) return false;
    list.splice(index, 1);
    writeData(table, list);
    return true;
  },

  // Seed default data
  initialize: async () => {
    console.log('Initializing database tables...');
    
    // Seed Users
    const users = readData('users');
    if (users.length === 0) {
      console.log('Seeding default users...');
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('Password123', salt);

      const defaultUsers = [
        { name: 'Admin User', email: 'admin@harmony.com', password_hash: hashedPassword, role: 'admin', status: 'Active' },
        { name: 'Sarah Designer', email: 'designer@harmony.com', password_hash: hashedPassword, role: 'designer', status: 'Active' },
        { name: 'John Sales', email: 'sales@harmony.com', password_hash: hashedPassword, role: 'sales_executive', status: 'Active' },
        { name: 'Marcus Inventory', email: 'inventory@harmony.com', password_hash: hashedPassword, role: 'inventory_manager', status: 'Active' },
        { name: 'Emma Accountant', email: 'accountant@harmony.com', password_hash: hashedPassword, role: 'accountant', status: 'Active' }
      ];

      defaultUsers.forEach(u => db.insert('users', u));
    }

    // Seed Suppliers
    const suppliers = readData('suppliers');
    if (suppliers.length === 0) {
      console.log('Seeding default suppliers...');
      const defaultSuppliers = [
        { name: 'Timberland Hardwoods', phone_number: '+91 98765 43210', email: 'info@timberland.com', address: 'Plot 42, Industrial Area, Hyderabad, TS', gst_number: '36AAAAA1111A1Z1' },
        { name: 'Lux Fabrications & Foams', phone_number: '+91 87654 32109', email: 'sales@luxfabrics.com', address: '12 Gachibowli Road, Hyderabad, TS', gst_number: '36BBBBB2222B2Z2' },
        { name: 'Golden Accent Decor & Fittings', phone_number: '+91 76543 21098', email: 'orders@goldenaccent.com', address: 'Sector 5, Jubilee Hills, Hyderabad, TS', gst_number: '36CCCCC3333C3Z3' }
      ];
      defaultSuppliers.forEach(s => db.insert('suppliers', s));
    }

    // Seed Products & Inventory
    const products = readData('products');
    if (products.length === 0) {
      console.log('Seeding default products and inventory...');
      const defaultProducts = [
        { product_name: 'Royal Velvet Chesterfield Sofa', category: 'Sofa', material: 'Teak Wood & Velvet Fabric', dimensions: '84" W x 38" D x 33" H', price: 85000, quantity: 8, images: ['/images/sofa_chesterfield.png'], description: 'A timeless Chesterfield sofa upholstered in premium royal blue velvet with deep button tufting and solid teak legs.' },
        { product_name: 'Minimalist Oak Dining Table', category: 'Dining Table', material: 'Solid Oak Wood', dimensions: '72" L x 36" W x 30" H', price: 62000, quantity: 4, images: ['/images/dining_table.png'], description: 'Elegant and contemporary solid white oak dining table with a clear matte polyurethane finish.' },
        { product_name: 'Mid-Century Modern Lounge Chair', category: 'Chair', material: 'Bentwood & Leather', dimensions: '32" W x 32" D x 33" H', price: 28000, quantity: 15, images: ['/images/lounge_chair.png'], description: 'Classic mid-century lounge chair featuring premium black top-grain leather and molded walnut veneer shells.' },
        { product_name: 'Luxury Tufted King Bed', category: 'Bed', material: 'Engineered Wood & Linen', dimensions: '86" L x 80" W x 54" H', price: 78000, quantity: 3, images: ['/images/king_bed.png'], description: 'A plush upholstered king bed with a tall diamond-tufted headboard in an off-white linen blend.' },
        { product_name: 'Executive Walnut Office Desk', category: 'Office Furniture', material: 'Walnut Wood & Powder-coated Steel', dimensions: '60" W x 30" D x 30" H', price: 45000, quantity: 2, images: ['/images/office_desk.png'], description: 'Sleek executive desk featuring a solid walnut top and black metal legs with integrated cable management.' },
        { product_name: 'Brass Inlay Wall Panels', category: 'Interior Materials', material: 'MDF & Brass Inlays', dimensions: '8ft x 4ft sheets', price: 12000, quantity: 25, images: ['/images/brass_panels.png'], description: 'Premium decorative wall paneling with geometric brass strip inlays, perfect for focal walls.' }
      ];

      const sups = readData('suppliers');
      const supplierId = sups[0]?.id || 1;

      defaultProducts.forEach((p) => {
        const prod = db.insert('products', p);
        db.insert('inventory', {
          product_id: prod.id,
          stock_quantity: prod.quantity,
          supplier_id: supplierId,
          purchase_price: Math.round(prod.price * 0.6),
          selling_price: prod.price,
          reorder_level: 5
        });
      });
    }

    // Seed Customers
    const customers = readData('customers');
    if (customers.length === 0) {
      console.log('Seeding default customers...');
      const defaultCustomers = [
        { name: 'Aditya Reddy', mobile_number: '+91 99001 12233', email: 'aditya.reddy@gmail.com', address: 'Villa 14, Gated Green, Narsingi', city: 'Hyderabad', state: 'Telangana', pin_code: '500075', project_type: 'Home Design', budget: 1500000, notes: 'Full villa design project including living, master bedroom and custom modular kitchen. Prefers gold accents and neutral palettes.' },
        { name: 'Nisha Sharma', mobile_number: '+91 98480 22338', email: 'nisha.sharma@yahoo.com', address: 'Apt 402, Signature Towers, Madhapur', city: 'Hyderabad', state: 'Telangana', pin_code: '500081', project_type: 'Home Design', budget: 750000, notes: '3BHK apartment renovation. Focus on spaces saving designs, wardrobes, and modern dining setup.' },
        { name: 'V-Serve Corp Offices', mobile_number: '+91 40 4567 8901', email: 'facilities@vserve.co.in', address: 'Level 5, WaveRock IT Park, Gachibowli', city: 'Hyderabad', state: 'Telangana', pin_code: '500032', project_type: 'Office Design', budget: 3500000, notes: 'Corporate office space design for 50 employees. Needs modern workstations, executive cabins, boardrooms and reception lobby.' }
      ];
      defaultCustomers.forEach(c => db.insert('customers', c));
    }

    // Seed Projects
    const projects = readData('projects');
    if (projects.length === 0) {
      console.log('Seeding default projects...');
      const custs = readData('customers');
      const designers = readData('users').filter(u => u.role === 'designer');
      const designerId = designers[0]?.id || 2;

      if (custs.length > 0) {
        db.insert('projects', {
          customer_id: custs[0].id,
          project_name: 'Aditya Reddy Villa Interior',
          project_type: 'Home Design',
          description: 'Contemporary interior design for 4BHK villa at Narsingi with custom furnishings.',
          start_date: '2026-05-01',
          end_date: '2026-08-30',
          budget: 1500000,
          assigned_designer_id: designerId,
          status: 'In Progress',
          progress_percentage: 45,
          timeline_milestones: [
            { id: 1, title: 'Concept Presentation', date: '2026-05-10', completed: true },
            { id: 2, title: 'Material Selection & Layouts', date: '2026-06-05', completed: true },
            { id: 3, title: 'Civil Works & False Ceiling', date: '2026-06-25', completed: false },
            { id: 4, title: 'Modular Woodwork Installation', date: '2026-07-20', completed: false },
            { id: 5, title: 'Decor & Handover', date: '2026-08-25', completed: false }
          ],
          notes: 'False ceiling layout is approved. Electrical work in progress.'
        });

        db.insert('projects', {
          customer_id: custs[1].id,
          project_name: 'Nisha Sharma 3BHK Renovation',
          project_type: 'Home Design',
          description: 'Sleek modern renovation of living room and bedrooms.',
          start_date: '2026-06-10',
          end_date: '2026-07-25',
          budget: 750000,
          assigned_designer_id: designerId,
          status: 'Designing',
          progress_percentage: 15,
          timeline_milestones: [
            { id: 1, title: 'Initial Measurement', date: '2026-06-12', completed: true },
            { id: 2, title: '3D Render Walkthrough', date: '2026-06-25', completed: false },
            { id: 3, title: 'Procurement confirmation', date: '2026-07-05', completed: false }
          ],
          notes: 'Initial site measures completed. Currently developing 3D floor layout designs.'
        });
      }
    }

    // Seed Orders, Invoices & Payments
    const orders = readData('orders');
    if (orders.length === 0) {
      console.log('Seeding default orders & invoices...');
      const custs = readData('customers');
      const prods = readData('products');

      if (custs.length > 0 && prods.length > 0) {
        // Create Order 1
        const order1 = db.insert('orders', {
          customer_id: custs[0].id,
          project_id: 1,
          status: 'Confirmed',
          order_date: '2026-06-01',
          delivery_date: '2026-07-10',
          tracking_id: 'TRK-DH-88092',
          delivery_address: 'Villa 14, Gated Green, Narsingi',
          total_amount: 198000
        });

        db.insert('order_items', {
          order_id: order1.id,
          product_id: prods[0].id, // Royal Velvet Chesterfield Sofa
          product_name: prods[0].product_name,
          quantity: 2,
          unit_price: prods[0].price,
          total_price: prods[0].price * 2
        });

        db.insert('order_items', {
          order_id: order1.id,
          product_id: prods[2].id, // Mid-Century Modern Lounge Chair
          product_name: prods[2].product_name,
          quantity: 1,
          unit_price: prods[2].price,
          total_price: prods[2].price
        });

        // Create Invoice for Order 1
        const invSubtotal = (prods[0].price * 2) + prods[2].price;
        const invTax = Math.round(invSubtotal * 0.18);
        const invGrandTotal = invSubtotal + invTax;

        const invoice1 = db.insert('invoices', {
          order_id: order1.id,
          invoice_number: 'DH-2026-0001',
          customer_id: custs[0].id,
          issue_date: '2026-06-02',
          due_date: '2026-06-30',
          discount: 0,
          tax_rate: 18.00,
          sub_total: invSubtotal,
          tax_amount: invTax,
          discount_amount: 0,
          grand_total: invGrandTotal,
          payment_status: 'Partially Paid'
        });

        db.insert('invoice_items', {
          invoice_id: invoice1.id,
          product_id: prods[0].id,
          product_name: prods[0].product_name,
          quantity: 2,
          unit_price: prods[0].price,
          gst_rate: 18.00,
          gst_amount: Math.round(prods[0].price * 2 * 0.18),
          total_price: prods[0].price * 2
        });

        db.insert('invoice_items', {
          invoice_id: invoice1.id,
          product_id: prods[2].id,
          product_name: prods[2].product_name,
          quantity: 1,
          unit_price: prods[2].price,
          gst_rate: 18.00,
          gst_amount: Math.round(prods[2].price * 0.18),
          total_price: prods[2].price
        });

        // Add partial payment
        db.insert('payments', {
          invoice_id: invoice1.id,
          amount: 100000,
          payment_date: '2026-06-03T10:00:00.000Z',
          payment_method: 'Bank Transfer',
          transaction_reference: 'TXN1029384756',
          status: 'Paid'
        });
      }
    }

    // Seed Employees
    const employees = readData('employees');
    if (employees.length === 0) {
      console.log('Seeding default employees...');
      const systemUsers = readData('users');
      const emp1 = systemUsers.find(u => u.role === 'designer');
      const emp2 = systemUsers.find(u => u.role === 'sales_executive');
      const emp3 = systemUsers.find(u => u.role === 'accountant');

      const defaultEmployees = [
        { user_id: emp1?.id || 2, employee_name: 'Sarah Designer', role: 'Lead Interior Designer', contact_number: '+91 99999 88888', email: 'designer@harmony.com', joining_date: '2025-01-15', salary: 65000, attendance_summary: { present: 22, absent: 1, leave: 1 }, performance_rating: 4.8 },
        { user_id: emp2?.id || 3, employee_name: 'John Sales', role: 'Senior Sales Executive', contact_number: '+91 88888 77777', email: 'sales@harmony.com', joining_date: '2025-03-01', salary: 45000, attendance_summary: { present: 24, absent: 0, leave: 0 }, performance_rating: 4.5 },
        { user_id: emp3?.id || 5, employee_name: 'Emma Accountant', role: 'Head Accountant', contact_number: '+91 77777 66666', email: 'accountant@harmony.com', joining_date: '2025-02-10', salary: 55000, attendance_summary: { present: 21, absent: 2, leave: 1 }, performance_rating: 4.6 }
      ];
      defaultEmployees.forEach(e => db.insert('employees', e));
    }

    // Seed Notifications
    const notifications = readData('notifications');
    if (notifications.length === 0) {
      console.log('Seeding default notifications...');
      const defaultNotifications = [
        { user_id: null, role: 'admin', title: 'Low Stock Alert', message: 'Royal Velvet Chesterfield Sofa has dropped below reorder level (Remaining: 2).', type: 'Low Stock', is_read: false },
        { user_id: null, role: 'accountant', title: 'Payment Reminder', message: 'Invoice DH-2026-0001 for Aditya Reddy is partially paid and past due.', type: 'Invoice Due', is_read: false },
        { user_id: null, role: 'admin', title: 'New Order Received', message: 'A new order has been created for customer Nisha Sharma.', type: 'New Order', is_read: false }
      ];
      defaultNotifications.forEach(n => db.insert('notifications', n));
    }

    console.log('Database seeded and initialized successfully!');
  }
};

module.exports = db;
