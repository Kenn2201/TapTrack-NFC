import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { adminFeedbackService } from '../services/adminFeedbackService';
import useDocumentTitle from '../hooks/useDocumentTitle';

const STATUS_OPTIONS = ['NEW', 'REVIEWING', 'RESOLVED', 'ARCHIVED'];
const CATEGORY_LABELS = {
  BUG: '🐛 Bug Report',
  UX: '🎨 UX',
  FEATURE_REQUEST: '💡 Feature Request',
  NFC_ATTENDANCE: '📱 NFC / Attendance',
  OTHER: '📝 Other',
};

export default function AdminFeedback() {
  useDocumentTitle('Admin - Feedback');
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter]);

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFeedbackService.list({ status: statusFilter === 'ALL' ? null : statusFilter });
      setFeedbackList(data);
    } catch (err) {
      setError(err.message || 'Failed to load feedback.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(true);
    try {
      await adminFeedbackService.updateStatus(id, newStatus);
      setFeedbackList(feedbackList.map((f) => (f.id === id ? { ...f, status: newStatus } : f)));
      setSelectedFeedback(null);
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      NEW: 'bg-blue-400/20 text-blue-400',
      IN_REVIEW: 'bg-amber-400/20 text-amber-400',
      ACCEPTED: 'bg-emerald-400/20 text-emerald-400',
      REJECTED: 'bg-slate-400/20 text-slate-400',
      IMPLEMENTED: 'bg-purple-400/20 text-purple-400',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-slate-700 text-slate-300'}`}>{status}</span>;
  };

  const getCategoryBadge = (category) => {
    const colors = {
      BUG: 'bg-red-400/20 text-red-400',
      FEATURE: 'bg-blue-400/20 text-blue-400',
      IMPROVEMENT: 'bg-emerald-400/20 text-emerald-400',
      OTHER: 'bg-slate-400/20 text-slate-400',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[category] || 'bg-slate-700 text-slate-300'}`}>{CATEGORY_LABELS[category] || category}</span>;
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-slate-400">Administrator access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <PageContainer>
        <PageHeader
          title="Feedback Triage"
          description="Review, categorize, and manage user feedback submissions."
        />

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} className="mb-6" />
        )}

        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4">
            <h3 className="text-lg font-semibold text-white">Filters</h3>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-w-[160px]"
              >
                <option value="ALL">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <Button variant="outline" onClick={fetchFeedback} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-slate-400">Loading feedback...</span>
            </div>
          </Card>
        ) : feedbackList.length === 0 ? (
          <Card className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-1">No Feedback Found</h3>
            <p className="text-slate-400">No feedback submissions match the current filter.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-slate-800/50">
            {feedbackList.map((f) => (
              <div key={f.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(f.category)}
                    {getStatusBadge(f.status)}
                    {f.rating && (
                      <span className="flex items-center gap-1 text-amber-400 text-sm">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        {f.rating}/5
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(f.createdAt)}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-slate-300 text-sm sm:text-base flex-1 min-w-0 truncate">{f.message}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {f.page && <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-mono truncate max-w-[200px]">{f.page}</span>}
                    {f.reproduction && <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Has reproduction steps</span>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFeedback(f)}
                      disabled={updating}
                    >
                      Update Status
                    </Button>
                  </div>
                </div>

                {f.metadata && (
                  <details className="mt-2">
                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300">Metadata</summary>
                    <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-slate-400 overflow-auto">{JSON.stringify(f.metadata, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </Card>
        )}

        <Modal
          isOpen={!!selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          title="Update Feedback Status"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-300">Current status: <span className="font-medium">{selectedFeedback?.status}</span></p>
            <p className="text-sm text-slate-300">Category: <span className="font-medium">{selectedFeedback?.category}</span></p>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Status</label>
              <select
                value={selectedFeedback?.status || ''}
                onChange={(e) => setSelectedFeedback({ ...selectedFeedback, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedFeedback(null)} disabled={updating}>
                Cancel
              </Button>
              <Button onClick={() => handleStatusChange(selectedFeedback.id, selectedFeedback.status)} loading={updating} disabled={updating}>
                Update
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </div>
  );
}