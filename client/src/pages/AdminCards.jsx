import React, { useState, useEffect, useCallback } from 'react';
import { cardService } from '../services/cardService';
import { authService } from '../services/authService';
import Header from '../components/layout/Header';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import CardStatusBadge from '../components/cards/CardStatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function AdminCards() {
  useDocumentTitle('NFC Cards');
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [replacement, setReplacement] = useState(null);

  // Provisioning Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisioningLoading, setProvisioningLoading] = useState(false);
  const [provisionStep, setProvisionStep] = useState(1); // 1: Input, 2: Generated & NFC Tools guide, 3: Completed
  const [labelInput, setLabelInput] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [provisionResult, setProvisionResult] = useState(null); // Contains { card, rawToken, writeUrl }
  const [copied, setCopied] = useState(false);
  const [confirmWrittenChecked, setConfirmWrittenChecked] = useState(false);
  // Confirm Dialog States
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [promptDialog, setPromptDialog] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cardsRes, usersRes] = await Promise.all([
        cardService.getAll(),
        authService.getUsers().catch(() => ({ users: [] })),
      ]);
      setCards(cardsRes.cards || []);
      // Only active users eligible for card assignment
      setUsers((usersRes.users || []).filter((u) => u.status === 'ACTIVE'));
    } catch (err) {
      setError(err.message || 'Failed to load NFC cards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute next suggested card label (e.g. NFC-001, NFC-002...)
  const suggestNextLabel = () => {
    if (!cards.length) return 'NFC-001';
    const numbers = cards
      .map((c) => {
        const match = c.cardLabel.match(/NFC-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n) && n > 0);
    const maxNum = numbers.length ? Math.max(...numbers) : 0;
    const nextNum = maxNum + 1;
    return `NFC-${String(nextNum).padStart(3, '0')}`;
  };

  const handleOpenProvisionModal = () => {
    setLabelInput(suggestNextLabel());
    setSelectedUserId(users[0]?.id ? String(users[0].id) : '');
    setProvisionStep(1);
    setProvisionResult(null);
    setCopied(false);
    setConfirmWrittenChecked(false);
    setError(null);
    setSuccessMsg(null);
    setIsProvisionModalOpen(true);
  };

  const handleCloseProvisionModal = () => {
    // Crucial security hygiene: wipe raw token from state when modal closes
    setProvisionResult(null);
    setIsProvisionModalOpen(false);
    setProvisionStep(1);
    setCopied(false);
    setConfirmWrittenChecked(false);
  };

  const handleStartProvisioning = async (e) => {
    e.preventDefault();
    if (!labelInput.trim()) {
      setError('Please provide a physical card label (e.g. NFC-001).');
      return;
    }

    try {
      setProvisioningLoading(true);
      setError(null);
      const payload = {
        cardLabel: labelInput.trim(),
        userId: selectedUserId ? parseInt(selectedUserId, 10) : undefined,
      };
      const result = await cardService.provision(payload);
      setProvisionResult(result);
      setProvisionStep(2);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to provision card.');
    } finally {
      setProvisioningLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!provisionResult?.writeUrl) return;
    try {
      await navigator.clipboard.writeText(provisionResult.writeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
    }
  };

  const handleConfirmAndActivate = async () => {
    if (!confirmWrittenChecked) {
      setError('Please confirm that you have written and verified the card in NFC Tools.');
      return;
    }
    const cardId = provisionResult?.card?.id;
    if (!cardId) return;

    try {
      setActivatingLoading(true);
      setError(null);
      await cardService.activate(cardId, { confirmWritten: true });
      setSuccessMsg(`Card ${provisionResult.card.cardLabel} successfully activated and ready for use!`);
      setProvisionStep(3);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to activate card.');
    } finally {
      setActivatingLoading(false);
    }
  };

  // Direct activation for an existing UNASSIGNED card in the table
  const handleDirectActivate = (card) => {
    setConfirmDialog({
      title: 'Confirm Physical Write',
      message: `Confirm physical write for ${card.cardLabel}:\nHave you already written the URL to this physical NTAG215 card and verified it in NFC Tools?`,
      variant: 'primary',
      confirmText: 'Confirm & Activate',
      onConfirm: async () => {
        try {
          setLoading(true);
          setError(null);
          await cardService.activate(card.id, { confirmWritten: true });
          setSuccessMsg(`Card ${card.cardLabel} is now ACTIVE!`);
          await fetchData();
        } catch (err) {
          setError(err.message || 'Failed to activate card.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleLifecycle = (card, status) => {
    setPromptDialog({
      title: `Mark ${card.cardLabel} as ${status}`,
      message: `Please provide a reason for this status change:`,
      variant: 'warning',
      confirmText: 'Next',
      cancelText: 'Cancel',
      input: {
        label: 'Reason',
        placeholder: `Reason for ${status}...`,
        value: '',
        onChange: (e) => setPromptDialog(prev => prev ? { ...prev, input: { ...prev.input, value: e.target.value } } : null),
        helperText: 'Required for LOST, REVOKED, DISABLED transitions',
      },
      onConfirm: (reason) => {
        if (!reason?.trim()) return;
        setPromptDialog(prev => prev ? { ...prev, message: `Confirm ${card.cardLabel}: ${card.status} → ${status}?`, input: null, confirmText: 'Confirm', variant: 'danger', onConfirm: async () => {
          try {
            await cardService.transition(card.id, { status, reason: reason.trim() });
            setSuccessMsg(`${card.cardLabel} is now ${status}.`);
            await fetchData();
          } catch (err) {
            setError(err.message);
          }
        } } : null);
      },
    });
  };

  const handleReplace = (card) => {
    const suggestedLabel = suggestNextLabel();
    setPromptDialog({
      title: `Replace ${card.cardLabel}`,
      message: `Enter the new physical card label:`,
      variant: 'primary',
      confirmText: 'Next',
      input: {
        label: 'New Card Label',
        placeholder: suggestedLabel,
        value: suggestedLabel,
        onChange: (e) => setPromptDialog(prev => prev ? { ...prev, input: { ...prev.input, value: e.target.value } } : null),
      },
      onConfirm: (newCardLabel) => {
        if (!newCardLabel?.trim()) return;
        setPromptDialog(prev => prev ? { ...prev, message: 'Replacement reason:', input: { label: 'Reason', placeholder: 'Replacement issued', value: 'Replacement issued', onChange: (e) => setPromptDialog(prev => prev ? { ...prev, input: { ...prev.input, value: e.target.value } } : null) }, confirmText: 'Replace', variant: 'warning', onConfirm: async (reason) => {
          if (!reason?.trim()) return;
          try {
            const result = await cardService.replace(card.id, { newCardLabel: newCardLabel.trim().toUpperCase(), reason: reason.trim() || 'Card replaced' });
            setReplacement(result);
            setSuccessMsg(`${card.cardLabel} replaced by ${result.newCard.cardLabel}.`);
            await fetchData();
          } catch (err) {
            setError(err.message);
          }
        } } : null);
      },
    });
  };

  const filteredCards = cards.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      c.cardLabel.toLowerCase().includes(term) ||
      (c.assignedUser?.email && c.assignedUser.email.toLowerCase().includes(term)) ||
      (c.assignedUser?.firstName && c.assignedUser.firstName.toLowerCase().includes(term)) ||
      (c.assignedUser?.lastName && c.assignedUser.lastName.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });
  const inventorySlots = Array.from({ length: 20 }, (_, index) => {
    const label = `NFC-${String(index + 1).padStart(3, '0')}`;
    return { label, card: cards.find((item) => item.cardLabel.toUpperCase() === label) || null };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Provision Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-full">
                CARD ADMINISTRATION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>NFC Card Provisioning</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Register physical NTAG215 cards, assign members, generate secure write URLs, and activate cards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenProvisionModal}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Provision Physical Card</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1">{successMsg}</div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}
        {replacement?.writeUrl && <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><strong>One-time replacement write URL</strong><p className="mt-2 break-all font-mono text-xs">{replacement.writeUrl}</p><button onClick={() => navigator.clipboard?.writeText(replacement.writeUrl)} className="mt-3 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold">Copy URL</button><button onClick={() => setReplacement(null)} className="ml-2 px-3 py-2 text-xs">Dismiss permanently</button></div>}

        {/* Security & Hardware Specifications Banner */}
        <div className="mb-8 p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Hardware Spec</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  NTAG215 (NFC Forum Type 2, ISO 14443-3A, ~492 bytes writable NDEF).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Zero PII On Card</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cards contain only an opaque random URL fragment. No names, emails, or DB IDs are stored on tags.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fragment Privacy</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Format <code className="text-blue-300 bg-slate-950 px-1 py-0.5 rounded text-[11px]">/t#token</code> keeps credentials out of web server access logs.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section aria-labelledby="inventory-title" className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 id="inventory-title" className="font-semibold">Physical test inventory: NFC-001–NFC-020</h2>
          <p className="mt-1 text-xs text-slate-400">Visibility only. Missing slots are not provisioned and no credentials are generated here.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">{inventorySlots.map(({ label, card }) => <div key={label} className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="font-mono text-xs text-white">{label}</p><p className={`mt-1 text-xs ${card ? 'text-emerald-400' : 'text-slate-500'}`}>{card ? `${card.status}${card.assignedUser ? ' · assigned' : ' · unassigned'}` : 'Not provisioned'}</p></div>)}</div>
        </section>

        {/* Filter / Search Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400">Status:</span>
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              {['ALL', 'UNASSIGNED', 'ACTIVE', 'LOST', 'REVOKED', 'REPLACED', 'DISABLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    statusFilter === st ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by label or member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cards Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-slate-400 mt-4">Loading registered NFC cards...</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white">No physical cards found</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                {cards.length === 0
                  ? 'No cards have been provisioned yet. Click "Provision Physical Card" to register your first test tag (e.g. NFC-001).'
                  : 'No cards match your current search or filter criteria.'}
              </p>
              {cards.length === 0 && (
                <button
                  onClick={handleOpenProvisionModal}
                  className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Provision NFC-001 Now
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Physical Tag Label</th>
                    <th className="px-6 py-3.5">Assigned Member</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Provisioned Date</th>
                    <th className="px-6 py-3.5">Activated Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCards.map((card) => (
                    <tr key={card.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-white flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xs">
                          🏷️
                        </span>
                        <span>{card.cardLabel}</span>
                      </td>
                      <td className="px-6 py-4">
                        {card.assignedUser ? (
                          <div>
                            <div className="font-medium text-white">
                              {card.assignedUser.firstName} {card.assignedUser.lastName}
                            </div>
                            <div className="text-xs text-slate-400">{card.assignedUser.email}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <CardStatusBadge status={card.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {card.issuedAt ? new Date(card.issuedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {card.activatedAt ? (
                          <span className="text-emerald-400 font-medium">
                            {new Date(card.activatedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-amber-400/80">Pending Write</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {card.status === 'UNASSIGNED' && (
                          <button
                            onClick={() => handleDirectActivate(card)}
                            className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Confirm & Activate
                          </button>
                        )}
                        {card.status === 'ACTIVE' && <div className="flex justify-end gap-1"><button onClick={() => handleLifecycle(card, 'LOST')} className="rounded bg-amber-900/50 px-2 py-1 text-xs">Lost</button><button onClick={() => handleLifecycle(card, 'REVOKED')} className="rounded bg-rose-900/50 px-2 py-1 text-xs">Revoke</button><button onClick={() => handleLifecycle(card, 'DISABLED')} className="rounded bg-slate-700 px-2 py-1 text-xs">Disable</button></div>}
                        {['LOST', 'REVOKED'].includes(card.status) && <button onClick={() => handleReplace(card)} className="rounded bg-blue-600 px-2 py-1 text-xs">Replace</button>}
                        {card.status === 'DISABLED' && <button onClick={() => handleLifecycle(card, 'ACTIVE')} className="rounded bg-emerald-700 px-2 py-1 text-xs">Reactivate</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* PROVISIONING MODAL */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-sm font-bold">
                  NFC
                </span>
                <h3 className="text-lg font-bold text-white">
                  {provisionStep === 1 && 'Provision Physical Card'}
                  {provisionStep === 2 && 'Write URL With NFC Tools'}
                  {provisionStep === 3 && 'Card Provisioned & Activated'}
                </h3>
              </div>
              <button
                onClick={handleCloseProvisionModal}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* STEP 1: FORM */}
              {provisionStep === 1 && (
                <form onSubmit={handleStartProvisioning} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Physical Card Label <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      placeholder="e.g. NFC-001"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Label matching physical sticker on your NTAG215 card (e.g. NFC-001 to NFC-020).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Assign to Member (User) <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {users.length === 0 ? (
                        <option value="">No active users found</option>
                      ) : (
                        users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.email}) — {u.role}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">
                      The card will be bound to this account for authentication and check-in.
                    </p>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseProvisionModal}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={provisioningLoading || !labelInput.trim()}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-blue-600/20"
                    >
                      {provisioningLoading ? 'Generating Credential...' : 'Generate Write URL'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: WRITE URL & NFC TOOLS INSTRUCTIONS */}
              {provisionStep === 2 && provisionResult && (
                <div className="space-y-5">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
                    <span className="text-base">⚠️</span>
                    <div>
                      <strong>Temporary Display:</strong> This raw write URL is displayed only once. It will never be shown again or stored in plaintext.
                    </div>
                  </div>

                  {/* URL Box */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Exact URL to write to physical card:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={provisionResult.writeUrl}
                        className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-blue-400 font-mono text-xs select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {copied ? (
                          <>
                            <span>✓</span>
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <span>📋</span>
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Step by Step Guide */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                      NFC Tools Write Procedure:
                    </h4>
                    <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Open <span className="text-blue-400 font-semibold">NFC Tools</span> on your phone.</li>
                      <li>Select <span className="font-semibold text-white">Write</span> ➔ <span className="font-semibold text-white">Add a record</span>.</li>
                      <li>Select <span className="font-semibold text-white">URL / URI</span>.</li>
                      <li>Paste the complete URL above (including the <code className="text-amber-400 font-mono">#fragment</code>).</li>
                      <li>Tap <span className="font-semibold text-white">Write</span> and hold your phone to <span className="text-blue-400 font-semibold">{provisionResult.card.cardLabel}</span>.</li>
                      <li>Select <span className="font-semibold text-white">Read</span> in NFC Tools to verify stored URL matches.</li>
                    </ol>
                  </div>

                  {/* Confirmation Checkbox */}
                  <label className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={confirmWrittenChecked}
                      onChange={(e) => setConfirmWrittenChecked(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span className="text-xs text-slate-300 leading-normal">
                      I have physically written this URL to card <strong className="text-white">{provisionResult.card.cardLabel}</strong> and verified it in NFC Tools.
                    </span>
                  </label>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleCloseProvisionModal}
                      className="px-3.5 py-2 text-slate-400 hover:text-white text-xs"
                    >
                      Finish Later (Keep UNASSIGNED)
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAndActivate}
                      disabled={!confirmWrittenChecked || activatingLoading}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-emerald-600/20"
                    >
                      {activatingLoading ? 'Activating Card...' : 'Confirm Write & Activate Card'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS */}
              {provisionStep === 3 && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Physical Card Active!</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      The card has been registered, verified, and activated in the database.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleCloseProvisionModal}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

{/* Confirm Dialog */}
    {confirmDialog && (
      <ConfirmDialog
        isOpen={true}
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        loading={loading}
      />
    )}

    {/* Prompt Dialog */}
    {promptDialog && (
      <ConfirmDialog
        isOpen={true}
        onClose={() => setPromptDialog(null)}
        title={promptDialog.title}
        message={promptDialog.message}
        variant={promptDialog.variant}
        confirmText={promptDialog.confirmText}
        cancelText={promptDialog.cancelText}
        onConfirm={promptDialog.onConfirm}
        loading={loading}
        input={promptDialog.input}
      />
    )}
</div>
  );
}
