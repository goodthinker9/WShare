import { useState, useEffect } from 'react';
import { resourceAPI, departmentAPI, courseAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import toast from 'react-hot-toast';

export default function AdminResources() {
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Review modal
  const [selectedResource, setSelectedResource] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);

  // Upload modal (admin)
  const [showUploadModal, setShowUploadModal] = useState(false);
const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    departmentId: '',
    academicLevelId: '',
    semesterId: '',
    courseId: '',
    category: 'course_material',
    chapter: '',
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Delete confirm modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      const { data } = await resourceAPI.getAll({
        page,
        limit: 50,
        status: statusFilter,
        search: searchQuery || undefined,
        departmentId: selectedDept || undefined,
        category: selectedCategory || undefined,
      });
      setResources(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, [page, filter, searchQuery, selectedDept, selectedCategory]);

  // Load departments/levels/semesters for edit & upload forms
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [deptRes, levelRes, semRes] = await Promise.all([
          departmentAPI.getAll(),
          departmentAPI.getLevels(),
          departmentAPI.getSemesters(),
        ]);
        setDepartments(deptRes.data.data || []);
        setLevels(levelRes.data.data || []);
        setSemesters(semRes.data.data || []);
      } catch (error) {
        console.error('Failed to load form data:', error);
      }
    };
    loadFormData();
  }, []);

  // Load courses when department/level/semester changes (for upload & edit)
  const loadCourses = async (departmentId, academicLevelId, semesterId) => {
    try {
      const params = {};
      if (departmentId) params.departmentId = departmentId;
      if (academicLevelId) params.academicLevelId = academicLevelId;
      if (semesterId) params.semesterId = semesterId;
      const res = await courseAPI.getAll({ limit: 200, ...params });
      setCourses(res.data.data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  useEffect(() => {
    if (uploadData.departmentId && uploadData.academicLevelId && uploadData.semesterId) {
      loadCourses(uploadData.departmentId, uploadData.academicLevelId, uploadData.semesterId);
    }
  }, [uploadData.departmentId, uploadData.academicLevelId, uploadData.semesterId]);

  const handleApprove = async () => {
    try {
      await resourceAPI.review(selectedResource.id, { status: 'approved' });
      toast.success('Resource approved!');
      setShowReviewModal(false);
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    }
  };

  const handleReject = async () => {
    try {
      await resourceAPI.review(selectedResource.id, {
        status: 'rejected',
        rejectionReason,
      });
      toast.success('Resource rejected.');
      setShowReviewModal(false);
      setRejectionReason('');
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    }
  };

  const handlePreview = async (resource, e) => {
    if (e) e.stopPropagation();
    try {
      const response = await resourceAPI.previewFile(resource.id);
      const contentType = response.headers?.['content-type'] || '';
      const blob = response.data;

      if (blob instanceof Blob && contentType && !contentType.includes('json')) {
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);
        if (contentType.includes('pdf')) setPreviewType('pdf');
        else if (contentType.includes('image')) setPreviewType('image');
        else if (contentType.includes('video')) setPreviewType('video');
        else setPreviewType('download');
      } else {
        // JSON response for non-previewable types
        setPreviewUrl(null);
        setPreviewType('download');
      }
      setShowPreviewModal(true);
    } catch (error) {
      const msg = error.response?.data?.message || 'Preview not available.';
      toast.error(msg);
    }
  };

const openEditModal = (resource) => {
    setEditingResource(resource);
    setEditForm({
      title: resource.title,
      description: resource.description || '',
      departmentId: resource.department_id || '',
      academicLevelId: resource.academic_level_id || '',
      semesterId: resource.semester_id || '',
      courseId: resource.course_id || '',
      category: resource.category || 'course_material',
      chapter: resource.chapter || '',
    });
    loadCourses(resource.department_id, resource.academic_level_id, resource.semester_id);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await resourceAPI.update(editingResource.id, {
        title: editForm.title,
        description: editForm.description,
        departmentId: editForm.departmentId,
        academicLevelId: editForm.academicLevelId,
        semesterId: editForm.semesterId,
        courseId: editForm.courseId,
        category: editForm.category,
        chapter: editForm.chapter,
      });
      toast.success('Resource updated!');
      setShowEditModal(false);
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed.');
    }
  };

  const handleEditFieldChange = async (field, value, resource) => {
    const next = { ...editForm, [field]: value };
    setEditForm(next);
    if (field === 'departmentId' || field === 'academicLevelId' || field === 'semesterId') {
      loadCourses(next.departmentId, next.academicLevelId, next.semesterId);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await resourceAPI.delete(resourceToDelete.id);
      toast.success('Resource deleted!');
      setShowDeleteModal(false);
      setResourceToDelete(null);
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a file to upload.');
      return;
    }
    if (!uploadData.departmentId || !uploadData.academicLevelId || !uploadData.semesterId) {
      toast.error('Please select department, level, and semester.');
      return;
    }

setUploading(true);
    const fd = new FormData();
    fd.append('title', uploadData.title);
    fd.append('description', uploadData.description);
    fd.append('category', uploadData.category);
    if (uploadData.chapter) fd.append('chapter', uploadData.chapter);
    fd.append('departmentId', uploadData.departmentId);
    fd.append('academicLevelId', uploadData.academicLevelId);
    fd.append('semesterId', uploadData.semesterId);
    if (uploadData.courseId) fd.append('courseId', uploadData.courseId);
    fd.append('file', uploadFile);

    try {
      const { data } = await resourceAPI.upload(fd);
      toast.success(data.message);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadData({ title: '', description: '', departmentId: '', academicLevelId: '', semesterId: '', courseId: '', category: 'course_material', chapter: '' });
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const openUploadForDept = (departmentId) => {
    setUploadData((prev) => ({ ...prev, departmentId: departmentId || '', courseId: '' }));
    setShowUploadModal(true);
  };

  const handleSelectDept = (id) => {
    setSelectedDept(id);
    setSelectedCategory(null);
    setPage(1);
  };

  const selectedDeptName = departments.find(d => d.id === Number(selectedDept))?.name || 'All Departments';

  const categories = [
    { value: 'course_material', label: 'Course Material' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'past_exam', label: 'Past Exam' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => { setFilter('all'); setPage(1); }} className={`btn-secondary text-sm ${filter === 'all' ? 'bg-primary-50 text-primary-700' : ''}`}>All</button>
          <button onClick={() => { setFilter('pending'); setPage(1); }} className={`btn-secondary text-sm ${filter === 'pending' ? 'bg-yellow-50 text-yellow-700' : ''}`}>Pending</button>
          <button onClick={() => { setFilter('approved'); setPage(1); }} className={`btn-secondary text-sm ${filter === 'approved' ? 'bg-green-50 text-green-700' : ''}`}>Approved</button>
          <button onClick={() => openUploadForDept(selectedDept)} className="btn-primary text-sm">
            + Upload Resource
          </button>
        </div>
      </div>

      {/* Departments row */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-sm font-semibold text-gray-600 mr-1">Departments:</span>
          <button
            onClick={() => handleSelectDept(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!selectedDept ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
          >
            All Departments
          </button>
          {departments.map(d => (
            <button
              key={d.id}
              onClick={() => handleSelectDept(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${Number(selectedDept) === d.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {selectedDept && (
          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-600 mr-1">Category:</span>
            <button
              onClick={() => { setSelectedCategory(null); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!selectedCategory ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.value}
                onClick={() => { setSelectedCategory(c.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedCategory === c.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                {c.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-500">
              Showing resources for <span className="font-semibold">{selectedDeptName}</span>
            </span>
          </div>
        )}
      </div>

      <div className="mb-6">
        <SearchBar onSearch={setSearchQuery} placeholder="Search resources by title, uploader, or course..." />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">No resources found.</p>
        </div>
      ) : (
        <div>
          {/* Group resources by Department, then by Level * Semester */}
          {(() => {
            const deptGroups = {};
            resources.forEach(r => {
              const deptKey = r.department_name || 'Unassigned';
              if (!deptGroups[deptKey]) deptGroups[deptKey] = [];
              deptGroups[deptKey].push(r);
            });

            return Object.entries(deptGroups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([deptName, deptResources]) => {
                // Within each department, group by Level • Semester
                const levelGroups = {};
                deptResources.forEach(r => {
                  const key = `${r.academic_level_name || 'Unassigned'} • ${r.semester_name || 'No Semester'}`;
                  if (!levelGroups[key]) levelGroups[key] = [];
                  levelGroups[key].push(r);
                });
                const levelOrder = ['Freshman Semester 1', 'Freshman Semester 2', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Unassigned'];
                const sortedLevels = Object.entries(levelGroups).sort(([a], [b]) => {
                  const aL = a.split(' • ')[0], bL = b.split(' • ')[0];
                  const aI = levelOrder.indexOf(aL), bI = levelOrder.indexOf(bL);
                  if (aI !== bI) return aI - bI;
                  return a.localeCompare(b);
                });

                return (
                  <div key={deptName} className="mb-10">
                    {/* Department header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-1 bg-primary-500 rounded-full"></div>
                      <h2 className="text-lg font-bold text-gray-900">{deptName}</h2>
                      <span className="text-sm text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                        {deptResources.length} {deptResources.length === 1 ? 'resource' : 'resources'}
                      </span>
                    </div>

                    {/* Level • Semester sub-groups */}
                    {sortedLevels.map(([levelName, levelResources]) => (
                      <div key={levelName} className="ml-4 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-semibold text-gray-700">{levelName}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {levelResources.length}
                          </span>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
<tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploader</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {levelResources.map(row => (
                                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                      {row.title}
                                      {row.chapter && <span className="block text-xs text-gray-400 mt-0.5">{row.chapter}</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{row.course_name || '—'}</td>
                                    <td className="px-6 py-4">
                                      <span className="capitalize text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                                        {(row.category || 'course_material').replace(/_/g, ' ')}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{row.uploader_name}</td>
                                    <td className="px-6 py-4">
                                      <span className={`capitalize ${row.status === 'approved' ? 'badge-success' : row.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                                        {row.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(row.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                      <div className="flex gap-2 flex-wrap">
                                        <button onClick={() => handlePreview(row)} className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors">
                                          Preview
                                        </button>
                                        {row.status === 'pending' && (
                                          <button onClick={() => { setSelectedResource(row); setRejectionReason(''); setShowReviewModal(true); }} className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors">
                                            Review
                                          </button>
                                        )}
                                        <button onClick={() => openEditModal(row)} className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                                          Edit
                                        </button>
                                        <button onClick={() => { setResourceToDelete(row); setShowDeleteModal(true); }} className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              });
          })()}

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="btn-secondary text-sm">Previous</button>
              <span className="text-sm text-gray-500 self-center">Page {pagination.page} of {pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary text-sm">Next</button>
            </div>
          )}
        </div>
      )}

      {/* ============ Review Modal ============ */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Review Resource">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900">{selectedResource?.title}</h3>
            <p className="text-sm text-gray-500 mt-1">Uploaded by {selectedResource?.uploader_name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedResource?.department_name} • {selectedResource?.academic_level_name} • {selectedResource?.semester_name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (required for rejection)</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Enter reason if rejecting..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowReviewModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReject} className="btn-danger">Reject</button>
            <button onClick={handleApprove} className="btn-primary">Approve</button>
          </div>
        </div>
      </Modal>

      {/* ============ Preview Modal ============ */}
      <Modal isOpen={showPreviewModal} onClose={() => { setShowPreviewModal(false); setPreviewUrl(null); }} title="File Preview" size="xl">
        {previewType === 'pdf' && previewUrl && (
          <iframe src={previewUrl} className="w-full h-[75vh] rounded-lg border border-gray-200" title="PDF Preview" />
        )}
        {previewType === 'image' && previewUrl && (
          <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
          </div>
        )}
        {previewType === 'video' && previewUrl && (
          <video controls className="w-full h-auto rounded-lg border border-gray-200" src={previewUrl}>
            Your browser does not support video playback.
          </video>
        )}
        {previewType === 'download' && (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-sm text-gray-500">
              This file type cannot be previewed inline in the browser.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => { setShowPreviewModal(false); setPreviewUrl(null); }} className="btn-secondary">Close</button>
        </div>
      </Modal>

      {/* ============ Edit Modal ============ */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Resource" size="lg">
        {editingResource && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className={`${labelClass}`} htmlFor="edit-title">Title *</label>
              <input
                id="edit-title"
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className={inputClass}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Department</label>
                <select
                  value={editForm.departmentId}
                  onChange={(e) => handleEditFieldChange('departmentId', e.target.value, editingResource)}
                  className={inputClass}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Academic Level</label>
                <select
                  value={editForm.academicLevelId}
                  onChange={(e) => handleEditFieldChange('academicLevelId', e.target.value, editingResource)}
                  className={inputClass}
                >
                  <option value="">Select Level</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Semester</label>
                <select
                  value={editForm.semesterId}
                  onChange={(e) => handleEditFieldChange('semesterId', e.target.value, editingResource)}
                  className={inputClass}
                >
                  <option value="">Select Semester</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
<div>
                <label className={labelClass}>Course</label>
                <select
                  value={editForm.courseId}
                  onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">No course (general)</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className={inputClass}
                >
                  <option value="course_material">Course Material</option>
                  <option value="assignment">Assignment</option>
                  <option value="past_exam">Past Exam</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Chapter</label>
                <input
                  type="text"
                  value={editForm.chapter || ''}
                  onChange={(e) => setEditForm({ ...editForm, chapter: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Chapter 3 - Process Management"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ============ Upload Modal (Admin) ============ */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Resource" size="lg">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input
              type="text"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              className={inputClass}
              placeholder="e.g., Operating Systems Final Exam"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              className={inputClass}
              rows={3}
              placeholder="Short description..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Department *</label>
              <select
                value={uploadData.departmentId}
                onChange={(e) => setUploadData({ ...uploadData, departmentId: e.target.value, courseId: '' })}
                className={inputClass}
                required
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Academic Level *</label>
              <select
                value={uploadData.academicLevelId}
                onChange={(e) => setUploadData({ ...uploadData, academicLevelId: e.target.value, courseId: '' })}
                className={inputClass}
                required
              >
                <option value="">Select Level</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Semester *</label>
              <select
                value={uploadData.semesterId}
                onChange={(e) => setUploadData({ ...uploadData, semesterId: e.target.value, courseId: '' })}
                className={inputClass}
                required
              >
                <option value="">Select Semester</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
<div>
            <label className={labelClass}>Course</label>
            <select
              value={uploadData.courseId}
              onChange={(e) => setUploadData({ ...uploadData, courseId: e.target.value })}
              className={inputClass}
            >
              <option value="">No course (general resource)</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={uploadData.category}
                onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                className={inputClass}
              >
                <option value="course_material">Course Material</option>
                <option value="assignment">Assignment</option>
                <option value="past_exam">Past Exam</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Chapter</label>
              <input
                type="text"
                value={uploadData.chapter}
                onChange={(e) => setUploadData({ ...uploadData, chapter: e.target.value })}
                className={inputClass}
                placeholder="e.g., Chapter 3 - Process Management"
                maxLength={100}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>File *</label>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className={inputClass}
              required
              accept=".pdf,.docx,.doc,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mkv,.mov"
            />
            <p className="mt-1 text-xs text-gray-400">Supported: PDF, DOCX, DOC, PPT, PPTX, ZIP, RAR, Images, Videos. Max 50MB.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={uploading} className="btn-primary">
              {uploading ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                  Uploading...
                </>
              ) : 'Upload Resource'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============ Delete Confirm Modal ============ */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setResourceToDelete(null); }} title="Delete Resource">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <span className="font-semibold">{resourceToDelete?.title}</span>?
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This will hide the resource from all students. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowDeleteModal(false); setResourceToDelete(null); }} className="btn-secondary">Cancel</button>
            <button onClick={confirmDelete} disabled={deleting} className="btn-danger">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

