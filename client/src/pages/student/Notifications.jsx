import { useState, useEffect } from 'react';
import { notificationAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { data } = await notificationAPI.getAll({ page, limit: 20 });
      setNotifications(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [page]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (error) {
      toast.error('Failed to mark as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
      toast.success('All marked as read.');
    } catch (error) {
      toast.error('Failed to mark all as read.');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'verification_approved': return 'bg-green-100 text-green-600';
      case 'verification_rejected': return 'bg-red-100 text-red-600';
      case 'resource_approved': return 'bg-blue-100 text-blue-600';
      case 'resource_rejected': return 'bg-red-100 text-red-600';
      case 'report_resolved': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title mb-0">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with your account and resources.</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button onClick={handleMarkAllAsRead} className="text-sm text-primary-600 hover:text-primary-700">
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-gray-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card flex items-start gap-4 ${!notification.is_read ? 'border-primary-200 bg-primary-50/50' : ''}`}
            >
              <div className={`p-2 rounded-lg ${getTypeIcon(notification.type)}`}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900">{notification.title}</h4>
                {notification.message && <p className="text-sm text-gray-500 mt-1">{notification.message}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
              </div>
              {!notification.is_read && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="text-xs text-primary-600 hover:text-primary-700 whitespace-nowrap"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-gray-500 self-center">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary text-sm">Next</button>
        </div>
      )}
    </div>
  );
}

