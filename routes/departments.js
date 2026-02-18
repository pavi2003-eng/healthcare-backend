const express = require('express');
const Department = require('../models/Department');
const router = express.Router();

// GET all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new department
router.post('/', async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();
    res.status(201).json({ message: 'Department created', department });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update a department
router.put('/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department updated', department });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a department
router.delete('/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;