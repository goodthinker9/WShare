import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { resourceAPI, bookmarkAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchBar from '../../components/common/SearchBar';
import toast from 'react-hot-toast';

const CATEGORY_TABS = [
  { key: 'all', label: 'All Resources', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { key: 'course_material', label: 'Course Material', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { key: 'assignment', label: 'Assignment', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'past_exam', label: 'Past Exam', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: 12 };
      if (activeCategory !== 'all') params.category = activeCategory;
      const { data } = await resourceAPI.getDashboard(params);
      setResources(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [page, activeCategory]);

  const handleCategoryChange = (key) => {
    setActiveCategory(key);
    setPage(1);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      navigate(`/dashboard/resources?search=${encodeURIComponent(query)}`);
    }
  };

  const handleBookmark = async (resourceId) => {
    try {
      const { data } = await bookmarkAPI.toggle(resourceId);
      toast.success(data.message);
    } catch (error) {
      toast.error('Failed to toggle bookmark.');
    }
  };

return (
    <div>
      {/* Rejected Verification Banner */}
      {user?.verificationStatus === 'rejected' && (
        <div className="mb-6 card border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-red-700">Verification Rejected</h2>
              <p className="mt-1 text-sm text-red-700">
                Your account verification was rejected. You currently cannot access or upload academic resources.
              </p>
              {user?.rejection_reason && (
                <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                  <p className="text-xs font-medium text-red-600">Rejection Reason</p>
                  <p className="text-sm text-red-700">{user.rejection_reason}</p>
                </div>
              )}
              <Link
                to="/dashboard/profile"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-800"
              >
                View profile for details
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Header */}
<div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.fullName || user?.name || 'Student'}!
        </h1>
        <p className="mt-1 text-gray-500">
          Browse resources curated for your department and academic level.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/dashboard/upload" className="card hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Upload Resource</h3>
            <p className="text-sm text-gray-500">Share academic materials</p>
          </div>
        </Link>

        <Link to="/dashboard/bookmarks" className="card hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Bookmarks</h3>
            <p className="text-sm text-gray-500">View saved resources</p>
          </div>
        </Link>

        <Link to="/dashboard/downloads" className="card hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Downloads</h3>
            <p className="text-sm text-gray-500">View download history</p>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar onSearch={handleSearch} placeholder="Search resources by title, course, or description..." />
      </div>

      {/* Category Filter Tabs */}
      <div className="mb-6" role="tablist" aria-label="Resource categories">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeCategory === tab.key}
              onClick={() => handleCategoryChange(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                activeCategory === tab.key
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <LoadingSpinner text="Loading resources..." />
      ) : resources.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {activeCategory === 'all' ? 'No resources yet' : `No ${CATEGORY_TABS.find(t => t.key === activeCategory)?.label} resources yet`}
          </h3>
          <p className="mt-1 text-gray-500">
            {activeCategory === 'all'
              ? 'Resources for your department will appear here once uploaded.'
              : 'No resources available in this category yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Group by Level + Semester within the active category */}
          {(() => {
            const groups = {};
            resources.forEach(r => {
              const key = `${r.academic_level_name} • ${r.semester_name}`;
              if (!groups[key]) groups[key] = [];
              groups[key].push(r);
            });
            const levelOrder = ['Freshman Semester 1', 'Freshman Semester 2', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
            const sorted = Object.entries(groups).sort(([a], [b]) => {
              const aL = a.split(' • ')[0], bL = b.split(' • ')[0];
              return levelOrder.indexOf(aL) - levelOrder.indexOf(bL);
            });

            return (
              <div>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-1 bg-primary-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {activeCategory === 'all'
                      ? 'All Resources'
                      : CATEGORY_TABS.find(t => t.key === activeCategory)?.label}
                  </h2>
                  <span className="text-sm text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {resources.length} {resources.length === 1 ? 'resource' : 'resources'}
                  </span>
                </div>

                {sorted.map(([groupName, groupResources]) => (
                  <div key={groupName} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-6 w-1 bg-primary-300 rounded-full"></div>
                      <h3 className="text-base font-semibold text-gray-700">{groupName}</h3>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {groupResources.length}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {groupResources.map(resource => (
                        <div key={resource.id} className="card hover:shadow-lg transition-shadow group">
                          <Link to={`/dashboard/resources/${resource.id}`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="badge-info">{resource.file_extension}</span>
                              <button
                                onClick={(e) => { e.preventDefault(); handleBookmark(resource.id); }}
                                className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              </button>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
                              {resource.title}
                            </h3>
                            {resource.course_name && (
                              <p className="text-xs text-primary-600 font-medium mb-1">{resource.course_name}</p>
                            )}
                            {resource.chapter && (
                              <p className="text-xs text-gray-500 mb-1">{resource.chapter}</p>
                            )}
                            {resource.description && (
                              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{resource.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>{resource.academic_level_name}</span>
                              <span>•</span>
                              <span>{resource.semester_name}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                              <span>By {resource.uploader_name}</span>
                              <div className="flex items-center gap-3">
                                <span>{resource.download_count} downloads</span>
                                <span className="flex items-center gap-1">
                                  <svg className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  {parseFloat(resource.average_rating).toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext}
                className="btn-secondary text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

