import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceAPI, departmentAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function UploadResource() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [resourceTypes, setResourceTypes] = useState([]);
const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    resourceTypeId: '',
    category: 'course_material',
    chapter: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes] = await Promise.all([
          courseAPI.getAll({ limit: 100 }),
        ]);
        setCourses(coursesRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch form data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    const fd = new FormData();
fd.append('title', formData.title);
    fd.append('description', formData.description);
    fd.append('category', formData.category);
    if (formData.chapter) fd.append('chapter', formData.chapter);
    if (formData.courseId) fd.append('courseId', formData.courseId);
    if (formData.resourceTypeId) fd.append('resourceTypeId', formData.resourceTypeId);
    fd.append('file', file);

    try {
      const { data } = await resourceAPI.upload(fd);
      toast.success(data.message);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="section-title">Upload Resource</h1>
        <p className="text-gray-500">
          Share academic materials with your department. Your upload will be reviewed by an admin.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="e.g., Operating Systems Chapter 1 Notes"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={4}
              placeholder="Brief description of the resource..."
            />
          </div>

<div>
            <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <select
              id="courseId"
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              className="input-field"
            >
              <option value="">Select a course (optional)</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} {course.code ? `(${course.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
            >
              <option value="course_material">Course Material</option>
              <option value="assignment">Assignment</option>
              <option value="past_exam">Past Exam</option>
            </select>
          </div>

          <div>
            <label htmlFor="chapter" className="block text-sm font-medium text-gray-700 mb-1">
              Chapter
            </label>
            <input
              id="chapter"
              type="text"
              value={formData.chapter}
              onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
              className="input-field"
              placeholder="e.g., Chapter 3 - Process Management"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department (auto-assigned)
            </label>
            <input
              type="text"
              value={user?.department_name || 'Assigned by admin'}
              className="input-field bg-gray-50"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File *
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="input-field"
              required
              accept=".pdf,.docx,.doc,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mkv,.mov"
            />
            <p className="mt-1 text-xs text-gray-400">
              Supported: PDF, DOCX, DOC, PPT, PPTX, ZIP, RAR, Images, Videos. Max 50MB.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Resource'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

