import React, { useEffect, useState } from 'react';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Textarea from '../components/ui/Textarea';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import Alert from '../components/ui/Alert';
import NFCCard from '../components/cards/NFCCard';
import { cardService } from '../services/cardService';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function MyCard() {
  useDocumentTitle('My Card');
  const [card, setCard] = useState(undefined);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [requestModal, setRequestModal] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [requestToast, setRequestToast] = useState(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      cardService.getMyCard(),
      cardService.getMyRequests().catch(() => ({ requests: [] })),
    ])
      .then(([cardResult, requestResult]) => {
        if (!active) return;
        setCard(cardResult.card || null);
        setRequests(requestResult.requests || []);
      })
      .catch((e) => {
        if (active) setError(e.message || 'Failed to load card information.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setRequestError(null);
    setRequestLoading(true);
    try {
      const requestType = card ? 'REPLACEMENT' : 'SETUP';
      const result = await cardService.createRequest({
        requestType,
        note: requestNote.trim() || undefined,
      });
      setRequests((prev) => [result.request, ...prev]);
      setRequestModal(false);
      setRequestNote('');
      setRequestToast(`Your NFC ${requestType === 'SETUP' ? 'setup' : 'replacement'} request is now in the admin queue.`);
    } catch (err) {
      setRequestError(err.message || 'Failed to submit your request. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      <PageContainer maxWidth="max-w-3xl">
        <PageHeader
          title="My NFC Card"
          description="Your official digital identity credential. Physical credentials contain opaque random NFC credentials."
        />

        {requestToast && (
          <div className="mb-6">
            <Alert type="success" message={requestToast} onClose={() => setRequestToast(null)} />
          </div>
        )}

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        {loading ? (
          <LoadingState text="Loading card credential..." />
        ) : card ? (
          <div className="space-y-6">
            {/* The Digital NFC Credential Component */}
            <div className="flex justify-center">
              <NFCCard card={card} />
            </div>

            {/* Safe Metadata Breakdown */}
            <Card className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 pb-2 border-b border-slate-800">
                Card Security & Metadata
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Hardware Label:</span>
                  <span className="font-mono text-sm font-bold text-white">
                    {card.cardLabel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Credential Status:</span>
                  <span className="font-semibold text-emerald-400">
                    {card.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Issue Date:</span>
                  <span className="text-slate-200">
                    {card.issuedAt
                      ? new Date(card.issuedAt).toLocaleDateString(undefined, {
                          dateStyle: 'long',
                        })
                      : 'Initial Provision'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Security Standard:</span>
                  <span className="text-slate-200">
                    HMAC-SHA256 Derived Verification (Raw Credential Never Stored)
                  </span>
                </div>
              </div>
            </Card>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-slate-400 leading-relaxed">
              <strong className="text-blue-300 block mb-1">Privacy Guarantee:</strong>
              This card carries no personal information — no name, email, or member ID is written
              to the NFC tag. Each card uses an opaque random NFC credential, and only a derived
              server-side hash is stored. If you lose your physical card, an administrator can
              revoke it and provision a replacement without losing your attendance history.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <EmptyState
              title="No NFC Card Assigned"
              description="You do not currently have a physical NFC card assigned to your account. Please ask an authorized event administrator to provision a card for you."
            />
          </div>
        )}

        {/* Setup / Replacement Request */}
        <div className="mt-8 space-y-4">
          {requests.length > 0 && (
            <Card className="p-5 sm:p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Request History</h3>
              <div className="space-y-2">
                {requests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{request.requestType === 'SETUP' ? 'NFC Setup' : 'NFC Replacement'}</p>
                      <p className="text-xs text-slate-500">{new Date(request.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="self-start sm:self-auto rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card className="p-5 sm:p-6 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Need a new NFC setup link?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              For security, the original NFC credential cannot be recovered. You can request a
              replacement/setup link from an administrator.
            </p>
            <Button
              variant="outline"
              onClick={() => setRequestModal(true)}
              className="w-full sm:w-auto"
              disabled={requests.some((request) => ['PENDING', 'IN_REVIEW'].includes(request.status))}
            >
              {requests.some((request) => ['PENDING', 'IN_REVIEW'].includes(request.status))
                ? 'Request Already In Review'
                : card ? 'Request NFC Replacement' : 'Request NFC Setup'}
            </Button>
          </Card>
        </div>
      </PageContainer>

      {/* Request Modal */}
      <Modal
        isOpen={requestModal}
        onClose={() => setRequestModal(false)}
        title="Request NFC Setup / Replacement"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          {requestError && (
            <Alert type="error" message={requestError} onClose={() => setRequestError(null)} />
          )}
          <p className="text-xs text-slate-400 leading-relaxed">
            This creates a dedicated admin work item. The original credential cannot be recovered or re-shown — a new setup or replacement is issued safely.
          </p>
          <Textarea
            label="Note for the admin (optional)"
            value={requestNote}
            onChange={(e) => setRequestNote(e.target.value)}
            rows={3}
            placeholder="e.g. My physical card was lost and I need a replacement."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setRequestModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={requestLoading} disabled={requestLoading}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}