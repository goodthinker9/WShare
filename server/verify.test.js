/**
 * WolloShare - Verification & Resource Access Integration Test
 *
 * Tests the verification state machine and resource-access protection:
 *   - Pending  -> no academic resource access
 *   - Approved -> active academic information + authorized resources
 *   - Rejected -> no academic resource access + rejection reason
 *   - Resubmitted -> re-approved; academic info preserved/restored
 *   - Directly calling protected resource APIs (bypassing UI)
 *   - Stale-token bypass attempts are blocked
 *
 * Run: node verify.test.js
 * Requires the server running on port 3000 with seeded data.
 */
const BASE = 'http://localhost:3000/api';

async function request(method, path, { token, body } = {}) {
  const options = { method, headers: {} };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, options);
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data, ok: res.ok };
}

let passed = 0;
let failed = 0;
function check(name, condition, extra = '') {
  if (condition) { passed++; console.log(`  \u2705 PASS: ${name}`); }
  else { failed++; console.log(`  \u274c FAIL: ${name} ${extra}`); }
}

async function main() {
  console.log('=== WolloShare Verification & Access Test ===');

  // 1. Admin login
  console.log('--- Admin login ---');
  const adminLogin = await request('POST', '/auth/login', { body: { identifier: 'admin@wollo.edu.et', password: 'Admin@123' } });
  check('Admin login succeeds (200)', adminLogin.status === 200, `got ${adminLogin.status}`);
  if (adminLogin.status !== 200) { console.log('  Cannot continue without admin token.'); process.exit(1); }
  const adminToken = adminLogin.data?.data?.accessToken;
  check('Admin token obtained', !!adminToken);

  // 2. Create a test student directly in the DB (pending with declared academic info)
  console.log('--- Create test student (PENDING) ---');
  const { pool, bcrypt } = await prepareDbDeps();
  const uniqueId = Math.floor(1000 + Math.random() * 9000);
  const batch = 16 + Math.floor(Math.random() * 4);
  const studentId = `WOUR/${uniqueId}/${batch}`;
  const email = `test${uniqueId}@wollo.edu.et`;
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash('Test@12345', salt);
  const { rows: ins } = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, student_id, university_id,
       department_id, academic_level_id, semester_id, role, account_status, verification_status)
    VALUES ('Test Student', $1, $2, $3, 1, 2, 5, 1, 'student', 'pending', 'pending')
    RETURNING id`,
    [email, hash, studentId]
  );
  const studentUserId = ins[0].id;
  check('Test student created in DB', !!studentUserId);

  // 3. Pending student cannot login
  console.log('--- Pending student login attempt ---');
  const pendingLogin = await request('POST', '/auth/login', { body: { identifier: studentId, password: 'Test@12345' } });
  check('Pending student cannot login (403)', pendingLogin.status === 403, `got ${pendingLogin.status}`);
  check('Pending login blocked (PENDING_VERIFICATION)', pendingLogin.data?.error === 'PENDING_VERIFICATION', JSON.stringify(pendingLogin.data));

  // 4. Admin approves
  console.log('--- Admin approves student ---');
  const approve = await request('PUT', `/users/${studentUserId}/verify`, { token: adminToken, body: { action: 'approved' } });
  check('Admin approve (200)', approve.status === 200, `got ${approve.status} ${JSON.stringify(approve.data)}`);

  // 5. Approved student can login + access dashboard
  console.log('--- Approved student login + access ---');
  const approvedLogin = await request('POST', '/auth/login', { body: { identifier: studentId, password: 'Test@12345' } });
  check('Approved student can login (200)', approvedLogin.status === 200, `got ${approvedLogin.status} ${JSON.stringify(approvedLogin.data)}`);
  const approvedToken = approvedLogin.data?.data?.accessToken;
  check('Approved student token obtained', !!approvedToken);

  const dash1 = await request('GET', '/resources/dashboard?page=1&limit=5', { token: approvedToken });
  check('Approved student can access dashboard (200)', dash1.status === 200, `got ${dash1.status} ${JSON.stringify(dash1.data)}`);

  // 6. Admin rejects
  console.log('--- Admin rejects student ---');
  const reject = await request('PUT', `/users/${studentUserId}/verify`, { token: adminToken, body: { action: 'rejected', reason: 'ID card image is unclear' } });
  check('Admin reject (200)', reject.status === 200, `got ${reject.status} ${JSON.stringify(reject.data)}`);

  // 7. Rejected student profile: status + reason, declared info preserved
  console.log('--- Rejected student profile state ---');
  const rejectedProfile = await request('GET', `/users/${studentUserId}`, { token: adminToken });
  check('Rejected student profile fetched (200)', rejectedProfile.status === 200, `got ${rejectedProfile.status}`);
  if (rejectedProfile.ok) {
    const u = rejectedProfile.data?.data;
    check('verification_status = rejected', u.verification_status === 'rejected', JSON.stringify(u.verification_status));
    check('account_status = pending', u.account_status === 'pending', JSON.stringify(u.account_status));
    check('rejection_reason preserved', u.rejection_reason === 'ID card image is unclear', JSON.stringify(u.rejection_reason));
    check('declared department preserved (IT=2)', u.department_id === 2, `got ${u.department_id}`);
    check('declared level preserved (Year 4=5)', u.academic_level_id === 5, `got ${u.academic_level_id}`);
    check('declared semester preserved (S1=1)', u.semester_id === 1, `got ${u.semester_id}`);
  }

  // 8. Rejected student cannot login
  console.log('--- Rejected student login attempt ---');
  const rejectedLogin = await request('POST', '/auth/login', { body: { identifier: studentId, password: 'Test@12345' } });
  check('Rejected student cannot login (403)', rejectedLogin.status === 403, `got ${rejectedLogin.status}`);

  // 9. STALE-TOKEN test: use the approved token (minted before rejection) to hit protected API
  console.log('--- Stale token direct API access (must be blocked) ---');
  const staleDash = await request('GET', '/resources/dashboard?page=1&limit=5', { token: approvedToken });
  check('Stale (rejected) token blocked from dashboard (403)', staleDash.status === 403, `got ${staleDash.status} ${JSON.stringify(staleDash.data)}`);
  check('Stale token error is rejection/inactive',
    staleDash.data?.error === 'VERIFICATION_REJECTED' || staleDash.data?.error === 'NOT_VERIFIED' || staleDash.data?.error === 'ACCOUNT_INACTIVE',
    JSON.stringify(staleDash.data));
  const staleGet = await request('GET', '/resources/1', { token: approvedToken });
  check('Stale (rejected) token blocked from getById (403)', staleGet.status === 403, `got ${staleGet.status}`);
  const staleFile = await request('GET', '/resources/1/file', { token: approvedToken });
  check('Stale (rejected) token blocked from file preview (403)', staleFile.status === 403, `got ${staleFile.status}`);

  // 10. Resubmission: admin re-approves -> academic info restored + access
  console.log('--- Resubmission (re-approve) ---');
  const reapprove = await request('PUT', `/users/${studentUserId}/verify`, { token: adminToken, body: { action: 'approved' } });
  check('Admin re-approve (200)', reapprove.status === 200, `got ${reapprove.status} ${JSON.stringify(reapprove.data)}`);

  const reapprovedProfile = await request('GET', `/users/${studentUserId}`, { token: adminToken });
  if (reapprovedProfile.ok) {
    const u = reapprovedProfile.data?.data;
    check('verification_status = approved', u.verification_status === 'approved', JSON.stringify(u.verification_status));
    check('account_status = active', u.account_status === 'active', JSON.stringify(u.account_status));
    check('department restored (IT=2)', u.department_id === 2, `got ${u.department_id}`);
    check('level restored (Year 4=5)', u.academic_level_id === 5, `got ${u.academic_level_id}`);
    check('semester restored (S1=1)', u.semester_id === 1, `got ${u.semester_id}`);
  }

  const reapprovedLogin = await request('POST', '/auth/login', { body: { identifier: studentId, password: 'Test@12345' } });
  check('Re-approved student can login (200)', reapprovedLogin.status === 200, `got ${reapprovedLogin.status}`);
  const reapprovedToken = reapprovedLogin.data?.data?.accessToken;
  const dash2 = await request('GET', '/resources/dashboard?page=1&limit=5', { token: reapprovedToken });
  check('Re-approved student can access dashboard (200)', dash2.status === 200, `got ${dash2.status}`);

  // 11. Unauthenticated access blocked
  console.log('--- Unauthenticated access ---');
  const noToken = await request('GET', '/resources/dashboard?page=1&limit=5');
  check('No token blocked from dashboard (401)', noToken.status === 401, `got ${noToken.status}`);

  // Cleanup test user
  await pool.query('DELETE FROM users WHERE id = $1', [studentUserId]);

  console.log(`=== RESULTS: ${passed} passed, ${failed} failed ===`);
  process.exit(failed ? 1 : 0);
}

async function prepareDbDeps() {
  const pool = require('./config/database');
  const bcrypt = require('bcrypt');
  return { pool, bcrypt };
}

main().catch((e) => {
  console.error('Test crashed:', e);
  process.exit(1);
});
