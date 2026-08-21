import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UsersIcon, DocumentTextIcon, StarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AdminAnalytics() {
  const [chartData, setChartData] = useState(null);
  const [topResources, setTopResources] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [verificationStats, setVerificationStats] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chartsRes, topRes, studentsRes, verifRes, deptRes] = await Promise.all([
          analyticsAPI.getCharts(),
          analyticsAPI.getTopResources(),
          analyticsAPI.getActiveStudents(),
          analyticsAPI.getVerificationStats(),
          analyticsAPI.getDepartmentStats(),
        ]);
        setChartData(chartsRes.data.data);
        setTopResources(topRes.data.data || []);
        setActiveStudents(studentsRes.data.data || []);
        setVerificationStats(verifRes.data.data || []);
        setDepartmentStats(deptRes.data.data || []);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <LoadingSpinner text="Loading analytics..." />;

  const totalUploads = chartData?.uploadTrends?.reduce((sum, d) => sum + d.count, 0) || 0;
  const totalDownloads = chartData?.downloadTrends?.reduce((sum, d) => sum + d.count, 0) || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Analytics</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="30-Day Uploads" value={totalUploads} icon={DocumentTextIcon} color="blue" />
        <StatCard title="30-Day Downloads" value={totalDownloads} icon={DocumentTextIcon} color="green" />
        <StatCard title="Departments" value={departmentStats.length} icon={UsersIcon} color="purple" />
        <StatCard title="Pending Reports" value={0} icon={ExclamationTriangleIcon} color="red" />
      </div>

      {/* Top Resources */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Downloaded Resources</h2>
        {topResources.length === 0 ? (
          <p className="text-gray-500 text-sm">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {topResources.map((r, idx) => (
              <div key={r.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                <span className="text-sm font-bold text-gray-400 w-6">#{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-500">{r.department_name} • {r.uploader_name}</p>
                </div>
                <span className="text-sm font-medium text-primary-600">{r.download_count} downloads</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Most Active Students */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Active Students</h2>
        {activeStudents.length === 0 ? (
          <p className="text-gray-500 text-sm">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {activeStudents.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                <span className="text-sm font-bold text-gray-400 w-6">#{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{s.full_name}</p>
                  <p className="text-xs text-gray-500">{s.student_id}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{s.uploads} uploads</span>
                  <span>{s.downloads} downloads</span>
                  <span>{s.bookmarks} bookmarks</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Department Statistics */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Statistics</h2>
        {departmentStats.length === 0 ? (
          <p className="text-gray-500 text-sm">No data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Students</th>
                  <th className="pb-3">Resources</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departmentStats.map((d) => (
                  <tr key={d.name}>
                    <td className="py-3 text-sm font-medium text-gray-900">{d.name}</td>
                    <td className="py-3 text-sm text-gray-600">{d.student_count}</td>
                    <td className="py-3 text-sm text-gray-600">{d.resource_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Statistics */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Statistics</h2>
        {verificationStats.length === 0 ? (
          <p className="text-gray-500 text-sm">No data yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {verificationStats.map((v) => (
              <div key={v.verification_status} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{v.count}</p>
                <p className="text-sm text-gray-500 capitalize">{v.verification_status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

