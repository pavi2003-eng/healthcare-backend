const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

// GET all departments (public)
router.get('/', departmentController.getAllDepartments);

// GET a single department by ID
router.get('/:id', departmentController.getDepartmentById);

// POST a new department (admin only)
router.post('/', auth, authorize('admin'), departmentController.createDepartment);

// PUT update a department (admin only)
router.put('/:id', auth, authorize('admin'), departmentController.updateDepartment);

// DELETE a department (admin only)
router.delete('/:id', auth, authorize('admin'), departmentController.deleteDepartment);

module.exports = router;