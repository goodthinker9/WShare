const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');

// Get all departments with faculty info
router.get(
  '/',
  departmentController.getAll
);

// Get academic levels
router.get(
  '/levels',
  departmentController.getLevels
);

// Get semesters
router.get(
  '/semesters',
  departmentController.getSemesters
);

// Get faculties
router.get(
  '/faculties',
  departmentController.getFaculties
);

// Get courses for a department/level/semester
router.get(
  '/courses',
  departmentController.getCourses
);

module.exports = router;

