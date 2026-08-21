import { useState, useEffect } from 'react';
import { reportAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { data } = await reportAPI.getAll({ page, limit: 20 });
      setReports(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [page]);

  const handleResolve = async (status) => {
    try {
      await reportAPI.resolve(selectedReport.id, { status, adminNotes });
      toast.success(`Report ${status}!`);
      setShowResolveModal(false);
      setAdminNotes('');
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    }
  };

  const columns = [
    { header: 'Resource', accessor: 'resource_title' },
    { header: 'Reported By', accessor: 'reporter_name' },
    { header: 'Reason', accessor: 'reason', render: (row) => <span className="capitalize">{row.reason.replace('_', ' ')}</span> },
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`capitalize ${row.status === 'pending' ? 'badge-warning' : row.status === 'resolved' ? 'badge-success' : 'badge-error'}`}>
        {row.status}
      </span>
    )},
    { header: 'Date', accessor: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
        <p className="text-gray-500 mt-1">Review and resolve resource reports from students.</p>
      </div>

      <DataTable
        columns={columns}
        data={reports}
        isLoading={isLoading}
        onRowClick={(report) => {
          setSelectedReport(report);
          setAdminNotes('');
          if (report.status === 'pending') {
            setShowResolveModal(true);
          }
        }}
        emptyMessage="No reports found."
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-gray-500 self-center">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary text-sm">Next</button>
        </div>
      )}

      <Modal isOpen={showResolveModal} onClose={() => setShowResolveModal(false)} title="Resolve Report">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p><span className="font-medium">Resource:</span> {selectedReport?.resource_title}</p>
            <p><span className="font-medium">Reason:</span> {selectedReport?.reason?.replace('_', ' ')}</p>
            {selectedReport?.description && <p className="mt-2"><span className="font-medium">Description:</span> {selectedReport.description}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="input-field" rows={3} placeholder="Add notes about this resolution..." />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowResolveModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleResolve('dismissed')} className="btn-secondary">Dismiss</button>
            <button onClick={() => handleResolve('resolved')} className="btn-primary">Resolve</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

