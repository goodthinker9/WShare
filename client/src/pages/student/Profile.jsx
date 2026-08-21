import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { user } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmNewPassword,
      });
      toast.success('Password changed successfully!');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

return (
    <div className="max-w-2xl mx-auto">
      <h1 className="section-title">My Profile</h1>

      {user?.verificationStatus === 'rejected' && (
        <div className="card mb-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-red-700">Verification Rejected</h2>
              <p className="mt-1 text-sm text-red-700">
                Your account verification was rejected. Your academic information is not active and you cannot access resources until your verification is approved.
              </p>
              {user?.rejection_reason && (
                <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                  <p className="text-xs font-medium text-red-600">Rejection Reason</p>
                  <p className="text-sm text-red-700">{user.rejection_reason}</p>
                </div>
              )}
              <p className="mt-3 text-sm text-red-600">
                Please correct the required information and resubmit for admin review.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <dl className="space-y-4">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Full Name</dt>
            <dd className="text-sm font-medium text-gray-900">{user?.fullName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Email</dt>
            <dd className="text-sm font-medium text-gray-900">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Student ID</dt>
            <dd className="text-sm font-medium text-gray-900">{user?.studentId}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Role</dt>
            <dd className="text-sm capitalize badge-info">{user?.role}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Verification Status</dt>
            <dd className={`text-sm capitalize ${user?.verificationStatus === 'approved' ? 'badge-success' : 'badge-warning'}`}>
              {user?.verificationStatus}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Account Status</dt>
            <dd className={`text-sm capitalize ${user?.accountStatus === 'active' ? 'badge-success' : 'badge-warning'}`}>
              {user?.accountStatus}
            </dd>
          </div>
        </dl>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Assignment</h2>
        <dl className="space-y-4">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">University</dt>
            <dd className="text-sm font-medium text-gray-900">{user?.university_name || 'Wollo University'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Faculty</dt>
            <dd className="text-sm font-medium text-gray-900">{user?.faculty_name || 'Not assigned'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Department</dt>
            <dd className="text-sm font-medium text-gray-900">{user?.department_name || 'Not assigned'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Academic Level</dt>
            <dd className="text-sm font-medium text-gray-900">{user?.academic_level_name || 'Not assigned'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Semester</dt>
            <dd className="text-sm font-medium text-gray-900">{user?.semester_name || 'Not assigned'}</dd>
          </div>
        </dl>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Password</h2>
          <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="text-sm text-primary-600 hover:text-primary-700">
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} className="input-field" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={passwordData.confirmNewPassword} onChange={(e) => setPasswordData({...passwordData, confirmNewPassword: e.target.value})} className="input-field" required />
              </div>
            </div>
            <button type="submit" disabled={isChangingPassword} className="btn-primary">
              {isChangingPassword ? 'Changing...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

