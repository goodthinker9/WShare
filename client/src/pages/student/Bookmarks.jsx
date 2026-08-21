import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookmarkAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const { data } = await bookmarkAPI.getAll({ page, limit: 12 });
      setBookmarks(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBookmarks(); }, [page]);

  const handleRemoveBookmark = async (resourceId) => {
    try {
      const { data } = await bookmarkAPI.toggle(resourceId);
      toast.success(data.message);
      fetchBookmarks();
    } catch (error) {
      toast.error('Failed to remove bookmark.');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">My Bookmarks</h1>
        <p className="text-gray-500">Resources you've saved for quick access.</p>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading bookmarks..." />
      ) : bookmarks.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No bookmarks yet</h3>
          <p className="mt-1 text-gray-500">Bookmark resources to find them easily later.</p>
          <Link to="/dashboard" className="btn-primary mt-4 inline-block">
            Browse Resources
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="card hover:shadow-lg transition-shadow group">
              <Link to={`/dashboard/resources/${bookmark.resource_id}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="badge-info">{bookmark.file_extension}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveBookmark(bookmark.resource_id);
                    }}
                    className="p-1 text-yellow-500 hover:text-yellow-600"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3-5 3V4z" />
                    </svg>
                  </button>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2">{bookmark.title}</h3>
                {bookmark.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{bookmark.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>{bookmark.department_name}</span>
                  <span>{bookmark.download_count} downloads</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-gray-500 self-center">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary text-sm">Next</button>
        </div>
      )}
    </div>
  );
}

