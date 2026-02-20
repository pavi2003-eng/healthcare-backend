const Department = require('../models/Department');
const asyncHandler = require('../../common/utils/asyncHandler');

// GET all departments (public)
exports.getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find();
  res.json(departments);
});

// GET a single department by ID
exports.getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    return res.status(404).json({ message: 'Department not found' });
  }
  res.json(department);
});

// POST a new department (admin only)
exports.createDepartment = asyncHandler(async (req, res) => {
  const department = new Department(req.body);
  await department.save();
  res.status(201).json({ message: 'Department created', department });
});

// PUT update a department (admin only)
exports.updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!department) {
    return res.status(404).json({ message: 'Department not found' });
  }
  res.json({ message: 'Department updated', department });
});

// DELETE a department (admin only)
exports.deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) {
    return res.status(404).json({ message: 'Department not found' });
  }
  res.json({ message: 'Department deleted' });
});