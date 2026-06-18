const db = require('../config/db');

exports.getProjects = (req, res) => {
  try {
    const { status, designer_id } = req.query;
    let projects = db.find('projects');

    if (status) {
      projects = projects.filter(p => p.status === status);
    }
    if (designer_id) {
      projects = projects.filter(p => p.assigned_designer_id === parseInt(designer_id));
    }

    // Attach customer and designer details
    const enriched = projects.map(p => {
      const customer = db.findById('customers', p.customer_id);
      const designer = db.findById('users', p.assigned_designer_id);
      return {
        ...p,
        customer_name: customer ? customer.name : 'Unknown Customer',
        designer_name: designer ? designer.name : 'Unassigned'
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProjectById = (req, res) => {
  try {
    const project = db.findById('projects', req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const customer = db.findById('customers', project.customer_id);
    const designer = db.findById('users', project.assigned_designer_id);

    res.json({
      ...project,
      customer,
      designer: designer ? { id: designer.id, name: designer.name, email: designer.email } : null
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createProject = (req, res) => {
  try {
    const { customer_id, project_name, project_type, description, start_date, end_date, budget, assigned_designer_id, notes } = req.body;
    
    if (!customer_id || !project_name || !project_type || !budget) {
      return res.status(400).json({ message: 'Customer ID, project name, type, and budget are required' });
    }

    // Check if customer exists
    const customer = db.findById('customers', customer_id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Create default milestones
    const defaultMilestones = [
      { id: 1, title: 'Concept Presentation', date: start_date || new Date().toISOString().split('T')[0], completed: false },
      { id: 2, title: 'Material Selection & Layouts', date: '', completed: false },
      { id: 3, title: 'Execution & Assembly', date: '', completed: false },
      { id: 4, title: 'Handover & Signoff', date: end_date || '', completed: false }
    ];

    const project = db.insert('projects', {
      customer_id: parseInt(customer_id),
      project_name,
      project_type,
      description,
      start_date,
      end_date,
      budget: parseFloat(budget),
      assigned_designer_id: assigned_designer_id ? parseInt(assigned_designer_id) : null,
      status: 'New',
      progress_percentage: 0,
      timeline_milestones: defaultMilestones,
      designs: [],
      documents: [],
      notes
    });

    // Notify Designer if assigned
    if (assigned_designer_id) {
      db.insert('notifications', {
        user_id: parseInt(assigned_designer_id),
        title: 'New Project Assignment',
        message: `You have been assigned to project: ${project_name} for ${customer.name}.`,
        type: 'Project Update'
      });
    }

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProject = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.budget) updates.budget = parseFloat(updates.budget);
    if (updates.customer_id) updates.customer_id = parseInt(updates.customer_id);
    if (updates.assigned_designer_id) updates.assigned_designer_id = parseInt(updates.assigned_designer_id);
    if (updates.progress_percentage !== undefined) updates.progress_percentage = parseInt(updates.progress_percentage);

    const project = db.findById('projects', id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const updated = db.update('projects', id, updates);

    // Notify about status updates
    if (updates.status && updates.status !== project.status) {
      db.insert('notifications', {
        user_id: null,
        role: 'admin',
        title: 'Project Status Updated',
        message: `Project "${project.project_name}" has moved from ${project.status} to ${updates.status}.`,
        type: 'Project Update'
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadDesign = (req, res) => {
  try {
    const { id } = req.params;
    const project = db.findById('projects', id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const designs = project.designs || [];
    designs.push(fileUrl);

    const updated = db.update('projects', id, { designs });
    res.json({ message: 'Design uploaded successfully', project: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadDocument = (req, res) => {
  try {
    const { id } = req.params;
    const project = db.findById('projects', id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const documents = project.documents || [];
    documents.push(fileUrl);

    const updated = db.update('projects', id, { documents });
    res.json({ message: 'Document uploaded successfully', project: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProject = (req, res) => {
  try {
    const deleted = db.delete('projects', req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
