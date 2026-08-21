import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { downloadAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';

export default function DownloadHistory() {
  const [downloads, setDownloads] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const { data } = await downloadAPI.getHistory({ page, limit: 20 });
      setDownloads(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch download history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [page]);

  const columns = [
    { header: 'Resource', accessor: 'title', render: (row) => (
      <Link to={`/dashboard/resources/${row.resource_id}`} className="text-primary-600 hover:text-primary-700 font-medium">
        {row.title}
      </Link>
    )},
    { header: 'Type', accessor: 'file_extension' },
    { header: 'Uploader', accessor: 'uploader_name' },
    { header: 'Downloads', accessor: 'download_count' },
    { header: 'Downloaded At', accessor: 'downloaded_at', render: (row) => new Date(row.downloaded_at).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">Download History</h1>
        <p className="text-gray-500">Track all resources you've downloaded.</p>
      </div>

      <DataTable
        columns={columns}
        data={downloads}
        isLoading={isLoading}
        emptyMessage="No downloads yet. Start exploring resources!"
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-gray-500 self-center">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary text-sm">Next</button>
        </div>
      )}
    </div>
  );
}

