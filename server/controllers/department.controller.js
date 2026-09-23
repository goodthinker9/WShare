const pool = require('../config/database');

class DepartmentController {
  async getAll(req, res, next) {
    try {
      const { rows: departments } = await pool.query(
        `SELECT d.id, d.name, d.code, f.name AS faculty_name, f.id AS faculty_id
         FROM departments d
         JOIN faculties f ON d.faculty_id = f.id
         WHERE d.is_active = TRUE
         ORDER BY f.name, d.name`
      );

      res.json({ success: true, data: departments });
    } catch (error) {
      next(error);
    }
  }

  async getLevels(req, res, next) {
    try {
      const { rows: levels } = await pool.query(
        'SELECT id, name, display_order, is_freshman FROM academic_levels WHERE is_active = TRUE ORDER BY display_order'
      );

      res.json({ success: true, data: levels });
    } catch (error) {
      next(error);
    }
  }

  async getSemesters(req, res, next) {
    try {
      const { rows: semesters } = await pool.query(
        'SELECT id, name, short_name, display_order FROM semesters WHERE is_active = TRUE ORDER BY display_order'
      );

      res.json({ success: true, data: semesters });
    } catch (error) {
      next(error);
    }
  }

  async getFaculties(req, res, next) {
    try {
      const { rows: faculties } = await pool.query(
        'SELECT id, name, short_name FROM faculties WHERE is_active = TRUE ORDER BY name'
      );

      res.json({ success: true, data: faculties });
    } catch (error) {
      next(error);
    }
  }

  async getCourses(req, res, next) {
    try {
      const { departmentId, academicLevelId, semesterId } = req.query;

      let sql = `
        SELECT c.id, c.name, c.code, c.credit_hours
        FROM courses c
        WHERE c.is_active = TRUE
      `;
      const params = [];

      if (departmentId) {
        sql += ` AND c.department_id = $${params.length + 1}`;
        params.push(departmentId);
      }
      if (academicLevelId) {
        sql += ` AND c.academic_level_id = $${params.length + 1}`;
        params.push(academicLevelId);
      }
      if (semesterId) {
        sql += ` AND c.semester_id = $${params.length + 1}`;
        params.push(semesterId);
      }

      sql += ` ORDER BY c.name`;

      const { rows: courses } = await pool.query(sql, params);

      res.json({ success: true, data: courses });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DepartmentController();

