import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { departmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    departmentId: '',
    academicLevelId: '',
    semesterId: '',
  });
  const [idCard, setIdCard] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAcademicData = async () => {
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
        console.error('Failed to load academic data:', error);
      }
    };
    loadAcademicData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Full name is required.');
      return false;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      toast.error('Password must contain uppercase, lowercase, number, and special character.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return false;
    }
    if (!/^WOUR\/\d{4}\/(1[6-9])$/.test(formData.studentId)) {
      toast.error('Student ID must be in format WOUR/XXXX/YY (e.g., WOUR/0014/16).');
      return false;
    }
if (!idCard) {
      toast.error('University ID card image is required.');
      return false;
    }
    if (!formData.departmentId) {
      toast.error('Department is required.');
      return false;
    }
    if (!formData.academicLevelId) {
      toast.error('Academic level is required.');
      return false;
    }
    if (!formData.semesterId) {
      toast.error('Semester is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const fd = new FormData();
    fd.append('fullName', formData.fullName);
    fd.append('password', formData.password);
    fd.append('confirmPassword', formData.confirmPassword);
    fd.append('studentId', formData.studentId);
    if (formData.departmentId) fd.append('departmentId', formData.departmentId);
    if (formData.academicLevelId) fd.append('academicLevelId', formData.academicLevelId);
    if (formData.semesterId) fd.append('semesterId', formData.semesterId);
    fd.append('universityIdCard', idCard);

    try {
      await register(fd);
      toast.success('Registration successful! Please wait for admin verification.');
      setFormData({
        fullName: '',
        password: '',
        confirmPassword: '',
        studentId: '',
        departmentId: '',
        academicLevelId: '',
        semesterId: '',
      });
      setIdCard(null);
      navigate('/login');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">WS</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">WolloShare</span>
          </Link>
          <p className="mt-2 text-gray-500">Create your student account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className={inputClass}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Min. 8 chars, mixed case + symbol"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">Must contain uppercase, lowercase, number &amp; special char</p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="studentId" className={labelClass}>
                Student ID
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                value={formData.studentId}
                onChange={handleChange}
                className={inputClass}
                placeholder="WOUR/0014/16"
                required
              />
              <p className="mt-1 text-xs text-gray-400">Format: WOUR/XXXX/YY (e.g., WOUR/0014/16)</p>
            </div>

            {/* Academic selection */}
            <div className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Academic Information</h3>
              <p className="text-xs text-gray-400 mb-4">
                Select your department and academic year. These will be confirmed by an administrator after verification.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="departmentId" className={labelClass}>
                    Department
                  </label>
<select
                    id="departmentId"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="academicLevelId" className={labelClass}>
                    Academic Year / Level
                  </label>
<select
                    id="academicLevelId"
                    name="academicLevelId"
                    value={formData.academicLevelId}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select level...</option>
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="semesterId" className={labelClass}>
                    Semester
                  </label>
<select
                    id="semesterId"
                    name="semesterId"
                    value={formData.semesterId}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select semester...</option>
                    {semesters.map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        {sem.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                University ID Card (Front Image)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIdCard(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="mt-1 text-xs text-gray-400">Upload a clear image of your university ID card</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registering...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

