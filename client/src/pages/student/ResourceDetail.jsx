import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resourceAPI, downloadAPI, bookmarkAPI, ratingAPI, reportAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export default function ResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [ratings, setRatings] = useState({ ratings: [], averageRating: 0, totalRatings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourceRes, ratingsRes] = await Promise.all([
          resourceAPI.getById(id),
          ratingAPI.getResourceRatings(id),
        ]);
        setResource(resourceRes.data.data);
        setRatings(ratingsRes.data.data);
      } catch (error) {
        toast.error('Failed to load resource.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await downloadAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resource?.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch (error) {
      toast.error('Download failed.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      const { data } = await bookmarkAPI.toggle(id);
      toast.success(data.message);
    } catch (error) {
      toast.error('Failed to toggle bookmark.');
    }
  };

  const handleRate = async () => {
    if (!userRating) {
      toast.error('Please select a rating.');
      return;
    }
    try {
      await ratingAPI.rate(id, { rating: userRating, review: userReview });
      toast.success('Rating submitted!');
      const ratingsRes = await ratingAPI.getResourceRatings(id);
      setRatings(ratingsRes.data.data);
    } catch (error) {
      toast.error('Failed to submit rating.');
    }
  };

  const handleReport = async () => {
    try {
      await reportAPI.create({ resourceId: id, reason: reportReason, description: reportDescription });
      toast.success('Report submitted. Admin will review it.');
      setShowReportModal(false);
      setReportDescription('');
    } catch (error) {
      toast.error('Failed to submit report.');
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading resource..." />;
  if (!resource) return <div className="card text-center py-12"><p className="text-gray-500">Resource not found.</p></div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Resource Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-info">{resource.file_extension}</span>
              <span className="badge-success">{resource.department_name}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{resource.title}</h1>
            {resource.course_name && (
              <p className="text-gray-500 mt-1">{resource.course_name} {resource.course_code && `(${resource.course_code})`}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} disabled={isDownloading} className="btn-primary flex items-center gap-2">
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
            <button onClick={handleBookmark} className="btn-secondary p-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>

        {resource.description && (
          <p className="mt-4 text-gray-600">{resource.description}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-500">
          <div><span className="font-medium">Uploader:</span> {resource.uploader_name}</div>
          <div><span className="font-medium">Level:</span> {resource.academic_level_name}</div>
          <div><span className="font-medium">Semester:</span> {resource.semester_name}</div>
          <div><span className="font-medium">Downloads:</span> {resource.download_count}</div>
          <div><span className="font-medium">Views:</span> {resource.view_count}</div>
          <div><span className="font-medium">Size:</span> {(resource.file_size / (1024*1024)).toFixed(2)} MB</div>
        </div>
      </div>

      {/* Rating Section */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ratings & Reviews</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl font-bold text-gray-900">{parseFloat(ratings.averageRating).toFixed(1)}</div>
          <div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(star => (
                <svg key={star} className={`h-5 w-5 ${star <= Math.round(ratings.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-gray-500">{ratings.totalRatings} reviews</p>
          </div>
        </div>

        {/* Rate Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Rate this resource</h3>
          <div className="flex items-center gap-1 mb-3">
            {[1,2,3,4,5].map(star => (
              <button key={star} onClick={() => setUserRating(star)} className="focus:outline-none">
                <svg className={`h-6 w-6 ${star <= userRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
          <textarea
            value={userReview}
            onChange={(e) => setUserReview(e.target.value)}
            placeholder="Write a review (optional)"
            className="input-field mb-3"
            rows={3}
          />
          <button onClick={handleRate} className="btn-primary text-sm">Submit Rating</button>
        </div>

        {/* Reviews */}
        {ratings.ratings.length > 0 && (
          <div className="space-y-4">
            {ratings.ratings.map((r) => (
              <div key={r.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 font-bold text-sm">{r.full_name?.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{r.full_name}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(star => (
                        <svg key={star} className={`h-4 w-4 ${star <= r.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {r.review && <p className="text-sm text-gray-600 mt-1">{r.review}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report */}
      <div className="text-center">
        <button onClick={() => setShowReportModal(true)} className="text-sm text-gray-400 hover:text-red-500">
          Report this resource
        </button>
      </div>

      {/* Report Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Report Resource">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="input-field">
              <option value="spam">Spam</option>
              <option value="copyright">Copyright violation</option>
              <option value="duplicate">Duplicate</option>
              <option value="low_quality">Low quality</option>
              <option value="wrong_department">Wrong department</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} className="input-field" rows={4} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowReportModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReport} className="btn-danger">Submit Report</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

