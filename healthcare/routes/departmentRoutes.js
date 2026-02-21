const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', auth, authorize('admin'), departmentController.createDepartment);
router.put('/:id', auth, authorize('admin'), departmentController.updateDepartment);
router.delete('/:id', auth, authorize('admin'), departmentController.deleteDepartment);

module.exports = router;