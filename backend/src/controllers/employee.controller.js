const db = require('../config/db');

exports.getEmployees = (req, res) => {
  try {
    const employees = db.find('employees');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEmployeeById = (req, res) => {
  try {
    const emp = db.findById('employees', req.params.id);
    if (!emp) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createEmployee = (req, res) => {
  try {
    const { employee_name, role, contact_number, email, joining_date, salary, performance_rating } = req.body;
    if (!employee_name || !role || !contact_number || !email || !salary) {
      return res.status(400).json({ message: 'All mandatory fields are required' });
    }

    const emp = db.insert('employees', {
      employee_name,
      role,
      contact_number,
      email: email.toLowerCase(),
      joining_date: joining_date || new Date().toISOString().split('T')[0],
      salary: parseFloat(salary),
      attendance_summary: { present: 0, absent: 0, leave: 0 },
      performance_rating: performance_rating ? parseFloat(performance_rating) : 5.0
    });

    res.status(201).json(emp);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEmployee = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.salary) updates.salary = parseFloat(updates.salary);
    if (updates.performance_rating) updates.performance_rating = parseFloat(updates.performance_rating);

    const updated = db.update('employees', id, updates);
    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAttendance = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'present', 'absent', or 'leave'

    if (!['present', 'absent', 'leave'].includes(status)) {
      return res.status(400).json({ message: 'Invalid attendance status' });
    }

    const emp = db.findById('employees', id);
    if (!emp) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const summary = emp.attendance_summary || { present: 0, absent: 0, leave: 0 };
    summary[status] = (summary[status] || 0) + 1;

    const updated = db.update('employees', id, { attendance_summary: summary });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEmployee = (req, res) => {
  try {
    const deleted = db.delete('employees', req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
