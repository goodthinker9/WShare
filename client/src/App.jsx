import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Public Pages
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/public/NotFound';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import Bookmarks from './pages/student/Bookmarks';
import DownloadHistory from './pages/student/DownloadHistory';
import ResourceDetail from './pages/student/ResourceDetail';
import UploadResource from './pages/student/UploadResource';
import StudentProfile from './pages/student/Profile';
import Notifications from './pages/student/Notifications';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminResources from './pages/admin/Resources';
import AdminCourses from './pages/admin/Courses';
import AdminReports from './pages/admin/Reports';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/Settings';
import AdminInvitationCodes from './pages/admin/InvitationCodes';

function PrivateRoute({ children, role }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;

  return children;
}

function PublicRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Student Routes */}
      <Route path="/dashboard" element={
        <PrivateRoute role="student">
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<StudentDashboard />} />
        <Route path="bookmarks" element={<Bookmarks />} />
        <Route path="downloads" element={<DownloadHistory />} />
        <Route path="upload" element={<UploadResource />} />
        <Route path="resources/:id" element={<ResourceDetail />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <PrivateRoute role="admin">
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="resources" element={<AdminResources />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="invitation-codes" element={<AdminInvitationCodes />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

