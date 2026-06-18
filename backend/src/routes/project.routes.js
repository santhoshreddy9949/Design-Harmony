const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', authenticate, projectController.getProjects);
router.get('/:id', authenticate, projectController.getProjectById);
router.post('/', authenticate, authorize(['admin', 'designer']), projectController.createProject);
router.put('/:id', authenticate, authorize(['admin', 'designer']), projectController.updateProject);
router.delete('/:id', authenticate, authorize(['admin']), projectController.deleteProject);

// Upload endpoints
router.post('/:id/upload-design', authenticate, authorize(['admin', 'designer']), upload.single('design'), projectController.uploadDesign);
router.post('/:id/upload-document', authenticate, authorize(['admin', 'designer']), upload.single('document'), projectController.uploadDocument);

module.exports = router;
