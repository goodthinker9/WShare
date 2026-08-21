import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UsersIcon, DocumentTextIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getRecentActivities(),
        ]);
        setStats(statsRes.data.data);
        setActivities(activitiesRes.data.data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <LoadingSpinner text="Loading dashboard..." />;

  const statCards = [
    { title: 'Total Students', value: stats?.totalStudents || 0, icon: UsersIcon, color: 'blue' },
    { title: 'Verified Students', value: stats?.verifiedStudents || 0, icon: UsersIcon, color: 'green' },
    { title: 'Pending Verification', value: stats?.pendingVerifications || 0, icon: ClockIcon, color: 'yellow' },
    { title: 'Pending Resources', value: stats?.pendingResources || 0, icon: DocumentTextIcon, color: 'red' },
    { title: 'Approved Resources', value: stats?.approvedResources || 0, icon: DocumentTextIcon, color: 'green' },
    { title: 'Total Downloads', value: stats?.totalDownloads || 0, icon: DocumentTextIcon, color: 'purple' },
    { title: 'Active Reports', value: stats?.pendingReports || 0, icon: ExclamationTriangleIcon, color: 'red' },
    { title: 'Unread Notifications', value: stats?.unreadNotifications || 0, icon: ClockIcon, color: 'indigo' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Recent Activities */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activities.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm pb-3 border-b border-gray-100 last:border-0">
                <div className={`p-1.5 rounded-full ${
                  activity.type === 'registration' ? 'bg-green-100 text-green-600' :
                  activity.type === 'resource_upload' ? 'bg-blue-100 text-blue-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                      activity.type === 'registration' ? 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' :
                      activity.type === 'resource_upload' ? 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' :
                      'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    } />
                  </svg>
                </div>
                <span className="text-gray-600">
                  {activity.type === 'registration' && `${activity.full_name} registered`}
                  {activity.type === 'resource_upload' && `${activity.full_name} uploaded "${activity.resource_title}"`}
                  {activity.type === 'download' && `${activity.full_name} downloaded "${activity.resource_title}"`}
                </span>
                <span className="text-gray-400 ml-auto">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

