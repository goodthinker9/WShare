import { useEffect, useState } from 'react';
import { departmentAPI, invitationCodeAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export default function InvitationCodes() {
  const [codes, setCodes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ departmentId: '', academicLevelId: '', semesterId: '', maxUses: 30, expiresAt: '' });

  const loadData = async () => {
    try {
      const [codeRes, deptRes, levelRes, semesterRes] = await Promise.all([
        invitationCodeAPI.getAll(), departmentAPI.getAll(), departmentAPI.getLevels(), departmentAPI.getSemesters()
      ]);
      setCodes(codeRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setLevels(levelRes.data.data || []);
      setSemesters(semesterRes.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load invitation codes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    const department = departments.find(item => String(item.id) === String(formData.departmentId));
    try {
      await invitationCodeAPI.create({ ...formData, facultyId: department.faculty_id, maxUses: Number(formData.maxUses), expiresAt: formData.expiresAt || null });
      toast.success('Invitation code created.');
      setShowModal(false);
      setFormData({ departmentId: '', academicLevelId: '', semesterId: '', maxUses: 30, expiresAt: '' });
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create invitation code.');
    }
  };

  const disableCode = async (id) => {
    try { await invitationCodeAPI.disable(id); toast.success('Invitation code disabled.'); await loadData(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not disable invitation code.'); }
  };

  const deleteCode = async (id) => {
    if (!window.confirm('Delete this unused invitation code?')) return;
    try { await invitationCodeAPI.delete(id); toast.success('Invitation code deleted.'); await loadData(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not delete invitation code.'); }
  };

  const statusFor = (code) => {
    if (!code.is_active) return 'Disabled';
    if (code.used_count >= code.max_uses) return 'Used up';
    if (code.expires_at && new Date(code.expires_at) <= new Date()) return 'Expired';
    return 'Active';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitation Codes</h1>
          <p className="mt-1 text-sm text-gray-500">Create controlled access for student registration.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">Create Code</button>
      </div>

      {isLoading ? <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">Loading invitation codes...</div> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              {['Code', 'Department', 'Level', 'Semester', 'Uses', 'Expiration', 'Status', 'Actions'].map(label => <th key={label} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {codes.map(code => <tr key={code.id}>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{code.code}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{code.department_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{code.academic_level_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{code.semester_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{code.used_count} / {code.max_uses}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}</td>
                <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusFor(code) === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{statusFor(code)}</span></td>
                <td className="px-6 py-4 text-sm whitespace-nowrap space-x-3">
                  {code.is_active && <button onClick={() => disableCode(code.id)} className="text-amber-600 hover:text-amber-800">Disable</button>}
                  {code.used_count === 0 && <button onClick={() => deleteCode(code.id)} className="text-red-600 hover:text-red-800">Delete</button>}
                </td>
              </tr>)}
              {codes.length === 0 && <tr><td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-500">No invitation codes yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Invitation Code">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><select value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })} className="input-field" required><option value="">Select department</option>{departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Academic Level</label><select value={formData.academicLevelId} onChange={e => setFormData({ ...formData, academicLevelId: e.target.value })} className="input-field" required><option value="">Select level</option>{levels.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Semester</label><select value={formData.semesterId} onChange={e => setFormData({ ...formData, semesterId: e.target.value })} className="input-field" required><option value="">Select semester</option>{semesters.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Maximum Uses</label><input type="number" min="1" max="10000" value={formData.maxUses} onChange={e => setFormData({ ...formData, maxUses: e.target.value })} className="input-field" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label><input type="datetime-local" value={formData.expiresAt} onChange={e => setFormData({ ...formData, expiresAt: e.target.value })} className="input-field" /></div></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
