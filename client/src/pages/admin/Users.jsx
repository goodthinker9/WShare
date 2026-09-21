import { useState, useEffect } from 'react';
import { userAPI, departmentAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [faculties, setFaculties] = useState([]);

  // For viewing student registration data before verification
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [showStudentInfoModal, setShowStudentInfoModal] = useState(false);
  const [idCardUrl, setIdCardUrl] = useState(null);

  // Form states
  const [verifyAction, setVerifyAction] = useState('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignData, setAssignData] = useState({
    departmentId: '',
    academicLevelId: '',
    semesterId: '',
    facultyId: '',
  });
  const [statusAction, setStatusAction] = useState('active');
  const [statusReason, setStatusReason] = useState('');

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [depts, levs, sems, facs] = await Promise.all([
          departmentAPI.getAll(),
          departmentAPI.getLevels(),
          departmentAPI.getSemesters(),
          departmentAPI.getFaculties(),
        ]);
        setDepartments(depts.data.data || []);
        setLevels(levs.data.data || []);
        setSemesters(sems.data.data || []);
        setFaculties(facs.data.data || []);
      } catch (error) {
        console.error('Failed to fetch form data:', error);
      }
    };
    fetchFormData();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data } = await userAPI.getAll({
        page,
        limit: 20,
        search,
        status: statusFilter || undefined,
      });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, search, statusFilter]);

  const handleLoadStudentInfo = async (user) => {
    try {
      const { data } = await userAPI.getById(user.id);
      setSelectedUserData(data.data);
      setSelectedUser(user);
      setAssignData({
        departmentId: data.data.department_id || '',
        academicLevelId: data.data.academic_level_id || '',
        semesterId: data.data.semester_id || '',
        facultyId: data.data.faculty_id || '',
      });

      // Try to load ID card
      try {
        const response = await userAPI.getIDCard(user.id);
        if (response.data instanceof Blob) {
          const url = window.URL.createObjectURL(response.data);
          setIdCardUrl(url);
        } else {
          setIdCardUrl(null);
        }
      } catch {
        setIdCardUrl(null);
      }

      setShowStudentInfoModal(true);
    } catch (error) {
      toast.error('Failed to load student details.');
    }
  };

const handleVerify = async () => {
    if (verifyAction === 'approved' && (!assignData.departmentId || !assignData.academicLevelId || !assignData.semesterId)) {
      toast.error('Select the department, academic level, and semester before approving.');
      return;
    }

    try {
      await userAPI.verify(selectedUser.id, {
        action: verifyAction,
        reason: verifyAction === 'rejected' ? rejectionReason : undefined,
        departmentId: verifyAction === 'approved' ? assignData.departmentId : undefined,
        academicLevelId: verifyAction === 'approved' ? assignData.academicLevelId : undefined,
        semesterId: verifyAction === 'approved' ? assignData.semesterId : undefined,
        facultyId: verifyAction === 'approved' ? assignData.facultyId : undefined,
      });
      toast.success(`Student ${verifyAction} successfully!`);
      setShowVerifyModal(false);
      setShowStudentInfoModal(false);
      if (idCardUrl) window.URL.revokeObjectURL(idCardUrl);
      setIdCardUrl(null);
      setSelectedUserData(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await userAPI.updateStatus(selectedUser.id, {
        status: statusAction,
        reason: statusReason,
      });
      toast.success('Status updated!');
      setShowStatusModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    }
  };

  const handleAssign = async () => {
    try {
      await userAPI.updateAssignment(selectedUser.id, assignData);
      toast.success('Assignment updated!');
      setShowAssignModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Assignment failed.');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser || selectedUser.role !== 'student') return;

    const confirmed = window.confirm(
      `Delete ${selectedUser.full_name}'s account permanently? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await userAPI.delete(selectedUser.id);
      toast.success('Student deleted successfully.');
      if (idCardUrl) window.URL.revokeObjectURL(idCardUrl);
      setIdCardUrl(null);
      setSelectedUserData(null);
      setSelectedUser(null);
      setShowStudentInfoModal(false);
      await fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'full_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Student ID', accessor: 'student_id' },
    { header: 'Invitation Code', accessor: 'invitation_code', render: (row) => <span className="font-mono text-xs">{row.invitation_code || 'Not recorded'}</span> },
    { header: 'Role', accessor: 'role', render: (row) => <span className="capitalize badge-info">{row.role}</span> },
    { header: 'Status', accessor: 'account_status', render: (row) => (
      <span className={`capitalize ${row.account_status === 'active' ? 'badge-success' : row.account_status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
        {row.account_status}
      </span>
    )},
    { header: 'Verification', accessor: 'verification_status', render: (row) => (
      <span className={`capitalize ${row.verification_status === 'approved' ? 'badge-success' : row.verification_status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
        {row.verification_status}
      </span>
    )},
    { header: 'Department', accessor: 'department_name' },
    { header: 'Joined', accessor: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-48"
        >
          <option value="">All Users</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <div className="mb-4">
        <SearchBar onSearch={setSearch} placeholder="Search by name, email, or student ID..." />
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        onRowClick={handleLoadStudentInfo}
        emptyMessage="No users found."
      />

      {/* Action buttons when user selected */}
      {selectedUser && !showStudentInfoModal && (
        <div className="mt-4 flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <span className="text-sm font-medium text-gray-700">
            Selected: {selectedUser.full_name}
          </span>
          <button onClick={() => handleLoadStudentInfo(selectedUser)} className="btn-primary text-sm">
            Review & Verify
          </button>
          <button onClick={() => setShowAssignModal(true)} className="btn-secondary text-sm">
            Assign
          </button>
          <button onClick={() => setShowStatusModal(true)} className="btn-secondary text-sm">
            Change Status
          </button>
          {selectedUser.role === 'student' && (
            <button onClick={handleDelete} disabled={isDeleting} className="btn-danger text-sm">
              {isDeleting ? 'Deleting...' : 'Delete Student'}
            </button>
          )}
          <button onClick={() => setSelectedUser(null)} className="text-sm text-gray-500 hover:text-gray-700">
            Clear
          </button>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-gray-500 self-center">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary text-sm">Next</button>
        </div>
      )}

      {/* Student Info Review Modal - Shows full student data before verification */}
      <Modal isOpen={showStudentInfoModal} onClose={() => { setShowStudentInfoModal(false); if (idCardUrl) window.URL.revokeObjectURL(idCardUrl); setIdCardUrl(null); setSelectedUserData(null); }} title="Student Review" size="xl">
        {selectedUserData && (
          <div className="space-y-6">
            {/* Student Registration Data */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Submitted Registration Data</h3>
              {(!selectedUserData.email || !selectedUserData.department_id || !selectedUserData.academic_level_id || !selectedUserData.semester_id) && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  This student record is missing information from registration. Verify the student’s email and academic assignment before approval.
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{selectedUserData.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900">{selectedUserData.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Student ID</p>
                  <p className="text-sm font-mono font-medium text-gray-900">{selectedUserData.student_id || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Invitation Code</p>
                  <p className="text-sm font-mono font-medium text-primary-700">{selectedUserData.invitation_code || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Account Created</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(selectedUserData.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Selected Department</p>
                  <p className="text-sm font-medium text-primary-700">{selectedUserData.department_name || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Selected Academic Level</p>
                  <p className="text-sm font-medium text-gray-900">{selectedUserData.academic_level_name || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Selected Semester</p>
                  <p className="text-sm font-medium text-gray-900">{selectedUserData.semester_name || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Account Status</p>
                  <p className="text-sm font-medium">
                    <span className={`capitalize ${selectedUserData.account_status === 'active' ? 'badge-success' : selectedUserData.account_status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                      {selectedUserData.account_status}
                    </span>
                    {' '}
                    <span className={`ml-1 capitalize ${selectedUserData.verification_status === 'approved' ? 'badge-success' : selectedUserData.verification_status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                      {selectedUserData.verification_status}
                    </span>
                  </p>
                </div>
              </div>
              {selectedUserData.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">Rejection Reason</p>
                  <p className="text-sm text-red-700">{selectedUserData.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* University ID Card */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">University ID Card</h3>
              {idCardUrl ? (
                <div className="flex justify-center">
                  <img src={idCardUrl} alt="University ID Card" className="max-w-full max-h-80 object-contain rounded-lg border border-gray-300 shadow-sm" />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm">ID Card image not available</p>
                </div>
              )}
            </div>

            {/* Action area - Approve/Reject with Assign */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Verification Action</h3>

              {verifyAction === 'approved' && (
                <div className="mb-5 rounded-lg border border-primary-100 bg-primary-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-800">Academic Assignment</p>
                  <p className="mb-4 text-xs text-gray-600">
                    Confirm the department, academic level, and semester before approving this student.
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Department</label>
                      <select
                        value={assignData.departmentId}
                        onChange={(e) => setAssignData({ ...assignData, departmentId: e.target.value })}
                        className="input-field"
                        required
                      >
                        <option value="">Select department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>{department.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Academic Level</label>
                      <select
                        value={assignData.academicLevelId}
                        onChange={(e) => setAssignData({ ...assignData, academicLevelId: e.target.value })}
                        className="input-field"
                        required
                      >
                        <option value="">Select level</option>
                        {levels.map((level) => (
                          <option key={level.id} value={level.id}>{level.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Semester</label>
                      <select
                        value={assignData.semesterId}
                        onChange={(e) => setAssignData({ ...assignData, semesterId: e.target.value })}
                        className="input-field"
                        required
                      >
                        <option value="">Select semester</option>
                        {semesters.map((semester) => (
                          <option key={semester.id} value={semester.id}>{semester.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setVerifyAction('approved')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${verifyAction === 'approved' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-primary-50'}`}
                >
                  Approve
                </button>
                <button
                  onClick={() => setVerifyAction('rejected')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${verifyAction === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
                >
                  Reject
                </button>
              </div>

{verifyAction === 'rejected' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                  <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="input-field" rows={3} required placeholder="Explain why the student is being rejected..." />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button onClick={() => { setShowStudentInfoModal(false); if (idCardUrl) window.URL.revokeObjectURL(idCardUrl); setIdCardUrl(null); setSelectedUserData(null); }} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleVerify} className={verifyAction === 'approved' ? 'btn-primary' : 'btn-danger'}>
                  {verifyAction === 'approved' ? 'Approve Student' : 'Reject Student'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Legacy Verify Modal (kept for backward compatibility) */}
      {false && /* hidden - replaced by Student Info Modal above */
      <Modal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} title={verifyAction === 'approved' ? 'Verify Student' : 'Reject Student'}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {verifyAction === 'approved'
              ? `Approve ${selectedUser?.full_name} and assign academic details.`
              : `Reject ${selectedUser?.full_name}'s verification.`}
          </p>

          {verifyAction === 'rejected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="input-field" rows={3} required />
            </div>
          )}

          {verifyAction === 'approved' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
                <select value={assignData.facultyId} onChange={(e) => setAssignData({...assignData, facultyId: e.target.value})} className="input-field">
                  <option value="">Select Faculty</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select value={assignData.departmentId} onChange={(e) => setAssignData({...assignData, departmentId: e.target.value})} className="input-field" required>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Level *</label>
                <select value={assignData.academicLevelId} onChange={(e) => setAssignData({...assignData, academicLevelId: e.target.value})} className="input-field" required>
                  <option value="">Select Level</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                <select value={assignData.semesterId} onChange={(e) => setAssignData({...assignData, semesterId: e.target.value})} className="input-field" required>
                  <option value="">Select Semester</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowVerifyModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleVerify} className={verifyAction === 'approved' ? 'btn-primary' : 'btn-danger'}>
              {verifyAction === 'approved' ? 'Approve & Assign' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>}

      {/* Status Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Account Status">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
            <select value={statusAction} onChange={(e) => setStatusAction(e.target.value)} className="input-field">
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <textarea value={statusReason} onChange={(e) => setStatusReason(e.target.value)} className="input-field" rows={3} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowStatusModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleStatusUpdate} className="btn-primary">Update Status</button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Update Academic Assignment">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
            <select value={assignData.facultyId} onChange={(e) => setAssignData({...assignData, facultyId: e.target.value})} className="input-field">
              <option value="">Select Faculty</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select value={assignData.departmentId} onChange={(e) => setAssignData({...assignData, departmentId: e.target.value})} className="input-field">
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Level *</label>
            <select value={assignData.academicLevelId} onChange={(e) => setAssignData({...assignData, academicLevelId: e.target.value})} className="input-field">
              <option value="">Select Level</option>
              {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
            <select value={assignData.semesterId} onChange={(e) => setAssignData({...assignData, semesterId: e.target.value})} className="input-field">
              <option value="">Select Semester</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAssignModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAssign} className="btn-primary">Update Assignment</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

