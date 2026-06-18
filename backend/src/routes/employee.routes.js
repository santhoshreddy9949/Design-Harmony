const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, authorize(['admin', 'accountant']), employeeController.getEmployees);
router.get('/:id', authenticate, authorize(['admin', 'accountant']), employeeController.getEmployeeById);
router.post('/', authenticate, authorize(['admin']), employeeController.createEmployee);
router.put('/:id', authenticate, authorize(['admin']), employeeController.updateEmployee);
router.post('/:id/attendance', authenticate, authorize(['admin']), employeeController.markAttendance);
router.delete('/:id', authenticate, authorize(['admin']), employeeController.deleteEmployee);

module.exports = router;
