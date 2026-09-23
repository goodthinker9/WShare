const crypto = require('crypto');
const pool = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const generateCode = (departmentCode, levelName, semesterName) => {
  const department = String(departmentCode || 'WS').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const level = String(levelName || 'LEVEL').replace(/[^A-Z0-9]/gi, '').toUpperCase().replace('YEAR', 'Y');
  const semester = String(semesterName || 'S1').match(/S[12]/i)?.[0].toUpperCase() || 'S1';
  return `WS-${department}-${level}-${semester}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

class InvitationCodeService {
  async list() {
    const { rows } = await pool.query(`
      SELECT ic.id, ic.code, ic.max_uses, ic.used_count, ic.expires_at, ic.is_active, ic.created_at,
             d.name AS department_name, d.code AS department_code,
             al.name AS academic_level_name, s.name AS semester_name,
             f.name AS faculty_name, un.name AS university_name
      FROM invitation_codes ic
      JOIN departments d ON d.id = ic.department_id
      JOIN academic_levels al ON al.id = ic.academic_level_id
      JOIN semesters s ON s.id = ic.semester_id
      JOIN faculties f ON f.id = ic.faculty_id
      JOIN universities un ON un.id = ic.university_id
      ORDER BY ic.created_at DESC
    `);
    return rows;
  }

  async create({ adminId, facultyId, departmentId, academicLevelId, semesterId, maxUses, expiresAt }) {
    const { rows: matches } = await pool.query(`
      SELECT d.code AS department_code, al.name AS level_name, s.short_name AS semester_name,
             f.university_id
      FROM departments d
      JOIN faculties f ON f.id = d.faculty_id
      JOIN academic_levels al ON al.id = $1
      JOIN semesters s ON s.id = $2
      WHERE d.id = $3 AND d.faculty_id = $4 AND d.is_active = TRUE AND f.is_active = TRUE
        AND al.is_active = TRUE AND s.is_active = TRUE
    `, [academicLevelId, semesterId, departmentId, facultyId]);
    if (matches.length === 0) throw new AppError('Invalid academic assignment.', 400, 'INVALID_ASSIGNMENT');

    const universityId = matches[0].university_id;
    let code;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      code = generateCode(matches[0].department_code, matches[0].level_name, matches[0].semester_name);
      const { rows: existing } = await pool.query('SELECT id FROM invitation_codes WHERE code = $1', [code]);
      if (existing.length === 0) break;
    }

    const { rows: result } = await pool.query(`
      INSERT INTO invitation_codes
        (code, university_id, faculty_id, department_id, academic_level_id, semester_id, created_by, max_uses, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [code, universityId, facultyId, departmentId, academicLevelId, semesterId, adminId, maxUses, expiresAt || null]);
    return { id: result[0].id, code };
  }

  async disable(id) {
    const result = await pool.query('UPDATE invitation_codes SET is_active = FALSE WHERE id = $1', [id]);
    if (result.rowCount === 0) throw new AppError('Invitation code not found.', 404, 'INVITATION_NOT_FOUND');
    return { message: 'Invitation code disabled.' };
  }

  async deleteUnused(id) {
    const result = await pool.query('DELETE FROM invitation_codes WHERE id = $1 AND used_count = 0', [id]);
    if (result.rowCount === 0) throw new AppError('Only unused invitation codes can be deleted.', 409, 'INVITATION_IN_USE');
    return { message: 'Invitation code deleted.' };
  }
}

module.exports = new InvitationCodeService();