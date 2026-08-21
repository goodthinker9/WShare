import { useState, useEffect } from 'react';
import { courseAPI, departmentAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    departmentId: '',
    academicLevelId: '',
    semesterId: '',
    creditHours: '',
  });
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, deptsRes, levsRes, semsRes] = await Promise.all([
          courseAPI.getAll({ page, limit: 50 }),
          departmentAPI.getAll(),
          departmentAPI.getLevels(),
          departmentAPI.getSemesters(),
        ]);
        setCourses(coursesRes.data.data || []);
        setPagination(coursesRes.data.pagination);
        setDepartments(deptsRes.data.data || []);
        setLevels(levsRes.data.data || []);
        setSemesters(semsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await courseAPI.update(editingCourse.id, formData);
        toast.success('Course updated!');
      } else {
        await courseAPI.create(formData);
        toast.success('Course created!');
      }
      setShowModal(false);
      setEditingCourse(null);
      setFormData({ name: '', code: '', description: '', departmentId: '', academicLevelId: '', semesterId: '', creditHours: '' });
      const { data } = await courseAPI.getAll({ page, limit: 50 });
      setCourses(data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed.');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code || '',
      description: course.description || '',
      departmentId: course.department_id || '',
      academicLevelId: course.academic_level_id || '',
      semesterId: course.semester_id || '',
      creditHours: course.credit_hours || '',
    });
    setShowModal(true);
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Code', accessor: 'code' },
    { header: 'Department', accessor: 'department_name' },
    { header: 'Level', accessor: 'academic_level_name' },
    { header: 'Semester', accessor: 'semester_name' },
    { header: 'Credit Hrs', accessor: 'credit_hours' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
        <button onClick={() => { setEditingCourse(null); setFormData({ name: '', code: '', description: '', departmentId: '', academicLevelId: '', semesterId: '', creditHours: '' }); setShowModal(true); }} className="btn-primary">
          Add Course
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">No courses yet. Click "Add Course" to get started.</p>
        </div>
      ) : (
        <div>
          {/* Group courses by Department */}
          {(() => {
            const groups = {};
            courses.forEach(c => {
              const dept = c.department_name || 'General / All Departments';
              if (!groups[dept]) groups[dept] = [];
              groups[dept].push(c);
            });
            return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([deptName, deptCourses]) => (
              <div key={deptName} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-1 bg-primary-500 rounded-full"></div>
                  <h2 className="text-lg font-bold text-gray-900">{deptName}</h2>
                  <span className="text-sm text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {deptCourses.length} {deptCourses.length === 1 ? 'course' : 'courses'}
                  </span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Hrs</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deptCourses.map(course => (
                        <tr key={course.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleEdit(course)}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{course.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{course.code || '—'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{course.academic_level_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{course.semester_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{course.credit_hours || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-gray-500 self-center">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary text-sm">Next</button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCourse ? 'Edit Course' : 'Add Course'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="input-field" placeholder="e.g., SWE301" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-field" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})} className="input-field">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
              <select value={formData.academicLevelId} onChange={(e) => setFormData({...formData, academicLevelId: e.target.value})} className="input-field" required>
                <option value="">Select</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
              <select value={formData.semesterId} onChange={(e) => setFormData({...formData, semesterId: e.target.value})} className="input-field" required>
                <option value="">Select</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Hours</label>
              <input type="number" step="0.5" min="0.5" max="10" value={formData.creditHours} onChange={(e) => setFormData({...formData, creditHours: e.target.value})} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingCourse ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

