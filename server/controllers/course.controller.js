const pool = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, paginatedResponse } = require('../utils/helpers');

class CourseController {
  async getAll(req, res, next) {
    try {
      const { p, l, offset } = getPagination(req.query.page, req.query.limit);

      let sql = `
        SELECT c.id, c.name, c.code, c.credit_hours, c.description,
               d.name AS department_name,
               al.name AS academic_level_name,
               s.name AS semester_name
        FROM courses c
        LEFT JOIN departments d ON c.department_id = d.id
        JOIN academic_levels al ON c.academic_level_id = al.id
        JOIN semesters s ON c.semester_id = s.id
        WHERE c.is_active = TRUE
      `;
      const params = [];

      if (req.query.departmentId) {
        sql += ` AND c.department_id = $${params.length + 1}`;
        params.push(req.query.departmentId);
      }
      if (req.query.academicLevelId) {
        sql += ` AND c.academic_level_id = $${params.length + 1}`;
        params.push(req.query.academicLevelId);
      }
      if (req.query.semesterId) {
        sql += ` AND c.semester_id = $${params.length + 1}`;
        params.push(req.query.semesterId);
      }

      const { rows: countResult } = await pool.query(
        `SELECT COUNT(*) as total FROM courses c WHERE c.is_active = TRUE`,
        []
      );

      sql += ` ORDER BY c.name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(l, offset);

      const { rows: courses } = await pool.query(sql, params);

      res.json(paginatedResponse(courses, countResult[0].total, p, l));
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { rows: courses } = await pool.query(
        `SELECT c.*, d.name AS department_name, al.name AS academic_level_name, s.name AS semester_name
         FROM courses c
         LEFT JOIN departments d ON c.department_id = d.id
         JOIN academic_levels al ON c.academic_level_id = al.id
         JOIN semesters s ON c.semester_id = s.id
         WHERE c.id = $1`,
        [req.params.id]
      );

      if (courses.length === 0) {
        throw new AppError('Course not found.', 404, 'COURSE_NOT_FOUND');
      }

      res.json({ success: true, data: courses[0] });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name, code, description, departmentId, academicLevelId, semesterId, creditHours } = req.body;

      const { rows: result } = await pool.query(
        `INSERT INTO courses (name, code, description, department_id, academic_level_id, semester_id, credit_hours)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [name.trim(), code || null, description || null, departmentId || null, academicLevelId, semesterId, creditHours || null]
      );

      res.status(201).json({
        success: true,
        message: 'Course created successfully.',
        data: { id: result[0].id }
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { rows: courses } = await pool.query('SELECT id FROM courses WHERE id = $1', [req.params.id]);
      if (courses.length === 0) {
        throw new AppError('Course not found.', 404, 'COURSE_NOT_FOUND');
      }

      const updates = [];
      const params = [];

      if (req.body.name) { updates.push(`name = $${params.length + 1}`); params.push(req.body.name.trim()); }
      if (req.body.code !== undefined) { updates.push(`code = $${params.length + 1}`); params.push(req.body.code); }
      if (req.body.description !== undefined) { updates.push(`description = $${params.length + 1}`); params.push(req.body.description); }
      if (req.body.departmentId) { updates.push(`department_id = $${params.length + 1}`); params.push(req.body.departmentId); }
      if (req.body.academicLevelId) { updates.push(`academic_level_id = $${params.length + 1}`); params.push(req.body.academicLevelId); }
      if (req.body.semesterId) { updates.push(`semester_id = $${params.length + 1}`); params.push(req.body.semesterId); }
      if (req.body.creditHours !== undefined) { updates.push(`credit_hours = $${params.length + 1}`); params.push(req.body.creditHours); }

      if (updates.length === 0) {
        throw new AppError('No fields to update.', 400, 'NO_UPDATES');
      }

      params.push(req.params.id);
      await pool.query(`UPDATE courses SET ${updates.join(', ')} WHERE id = $${params.length + 1}`, params);

      res.json({ success: true, message: 'Course updated successfully.' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { rows: courses } = await pool.query('SELECT id FROM courses WHERE id = $1', [req.params.id]);
      if (courses.length === 0) {
        throw new AppError('Course not found.', 404, 'COURSE_NOT_FOUND');
      }

      await pool.query('UPDATE courses SET is_active = FALSE WHERE id = $1', [req.params.id]);

      res.json({ success: true, message: 'Course deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CourseController();

