import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import useDocumentTitle from '../hooks/useDocumentTitle';

function getInitials(u) {
  const first = (u?.firstName || '').trim();
  const last = (u?.lastName || '').trim();
  if (!first && !last) return '?';
  return ((first.charAt(0) || '') + (last.charAt(0) || first.charAt(1) || '')).toUpperCase();
}

function UserDetailRow({ label, value, mono = false }) {
  return (
    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className={`text-sm text-slate-200 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function AdminUserDetail({ user: u, currentUserId }) {
  const isSelf = u.id === currentUserId;
  const verified = !!u.emailVerifiedAt;
  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-600/90 border-2 border-blue-400/30 flex items-center justify-center text-white text-xl font-black flex-shrink-0">
          {getInitials(u)}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white truncate">
            {u.firstName} {u.lastName}
            {isSelf && <span className="ml-2 text-xs font-normal text-purple-400">(You)</span>}
          </h3>
          <p className="text-sm text-slate-400 truncate break-all">{u.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={u.role} />
            <StatusBadge status={u.status} />
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-800/80">
        <UserDetailRow label="Email Verification" value={verified ? `Verified (${formatDate(u.emailVerifiedAt)})` : 'Pending Verification'} />
        <UserDetailRow label="Registered On" value={formatDate(u.createdAt)} />
        <UserDetailRow label="Last Login" value={u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Not available'} />
      </div>

      <div className="pt-2 border-t border-slate-800 text-xs text-slate-500 leading-relaxed">
        NFC card label, attendance history, and event invitations are shown in their own
        management views. This directory view displays identity, access, and verification
        details only.
      </div>
    </div>
  );
}

export default function AdminUsers() {
  useDocumentTitle('Manage Users');
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [detailUser, setDetailUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.getUsers();
      setUsers(res.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load user list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleToggle = (targetUser) => {
    const newRole = targetUser.role === 'OPERATOR' ? 'USER' : 'OPERATOR';
    setConfirmDialog({
      title: 'Confirm Role Change',
      message: `Are you sure you want to change ${targetUser.firstName}'s role from ${targetUser.role} to ${newRole}?`,
      variant: 'warning',
      confirmText: 'Confirm Change',
      onConfirm: async () => {
        setActionLoadingId(targetUser.id);
        setActionSuccess(null);
        try {
          await authService.updateRole(targetUser.id, newRole);
          setActionSuccess(`Role for ${targetUser.email} updated to ${newRole}.`);
          await fetchUsers();
        } catch (err) {
          setError(err.message || 'Failed to update role.');
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleStatusToggle = (targetUser) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setConfirmDialog({
      title: 'Confirm Status Change',
      message: `Are you sure you want to set ${targetUser.firstName}'s account to ${newStatus}?`,
      variant: newStatus === 'DISABLED' ? 'danger' : 'success',
      confirmText: newStatus === 'DISABLED' ? 'Disable' : 'Activate',
      onConfirm: async () => {
        setActionLoadingId(targetUser.id);
        setActionSuccess(null);
        try {
          await authService.updateStatus(targetUser.id, newStatus);
          setActionSuccess(`Account for ${targetUser.email} is now ${newStatus}.`);
          await fetchUsers();
        } catch (err) {
          setError(err.message || 'Failed to update status.');
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase();
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-7xl">
        <PageHeader
          title="User Account Management"
          description="View registered accounts, toggle operator privileges, and manage account active/disabled states."
        />

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        {actionSuccess && (
          <div className="mb-6">
            <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess(null)} />
          </div>
        )}

        <Section
          title="User Directory"
          subtitle={`${filteredUsers.length} user${filteredUsers.length === 1 ? '' : 's'} matching search`}
          actions={
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
        >
          {loading ? (
            <LoadingState text="Loading registered users..." />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title="No Users Found"
              description={search ? `No user accounts match "${search}".` : 'No users have registered yet.'}
            />
          ) : (
            <>
              {/* Desktop Searchable Table View */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Name</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Verified</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      const isActing = actionLoadingId === u.id;

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                          onClick={() => setDetailUser(u)}
                        >
                          <td className="px-5 py-3.5 font-semibold text-white">
                            {u.firstName} {u.lastName}
                            {isSelf && (
                              <span className="ml-2 text-xs font-normal text-purple-400 font-mono">
                                (You)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-slate-300">{u.email}</td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={u.role} />
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={u.status} />
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            {u.emailVerifiedAt ? (
                              <span className="text-emerald-400 font-medium">Verified</span>
                            ) : (
                              <span className="text-amber-400 font-medium">Unverified</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailUser(u);
                              }}
                            >
                              View
                            </Button>
                            {isSelf ? (
                              <span className="text-xs text-slate-500 italic">Self-account locked</span>
                            ) : (
                              <>
                                {u.role !== 'ADMIN' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={isActing}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRoleToggle(u);
                                    }}
                                  >
                                    {u.role === 'OPERATOR' ? 'Demote to USER' : 'Promote to OPERATOR'}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant={u.status === 'ACTIVE' ? 'danger' : 'success'}
                                  disabled={isActing}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusToggle(u);
                                  }}
                                >
                                  {u.status === 'ACTIVE' ? 'Disable' : 'Activate'}
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Card View */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isActing = actionLoadingId === u.id;

                  return (
                    <Card key={u.id} padding="p-4" className="space-y-3 cursor-pointer" onClick={() => setDetailUser(u)}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-white text-base">
                            {u.firstName} {u.lastName}
                            {isSelf && <span className="ml-1 text-xs text-purple-400">(You)</span>}
                          </div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                        <StatusBadge status={u.role} />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                        <StatusBadge status={u.status} />
                        <span className={u.emailVerifiedAt ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                          {u.emailVerifiedAt ? 'Verified' : 'Unverified'}
                        </span>
                      </div>

                      <div>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => setDetailUser(u)}>
                          View User Details
                        </Button>
                      </div>

                      {!isSelf && (
                        <div className="pt-1 flex flex-col gap-2">
                          {u.role !== 'ADMIN' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full"
                              disabled={isActing}
                              onClick={() => handleRoleToggle(u)}
                            >
                              {u.role === 'OPERATOR' ? 'Demote to USER' : 'Promote to OPERATOR'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={u.status === 'ACTIVE' ? 'danger' : 'success'}
                            className="w-full"
                            disabled={isActing}
                            onClick={() => handleStatusToggle(u)}
                          >
                            {u.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </Section>
      </PageContainer>

      {/* User Detail Modal */}
      <Modal
        isOpen={!!detailUser}
        onClose={() => setDetailUser(null)}
        title="User Details"
        maxWidth="max-w-lg"
      >
        {detailUser && <AdminUserDetail user={detailUser} currentUserId={currentUser?.id} />}
      </Modal>

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
          loading={actionLoadingId !== null}
        />
      )}
    </div>
  );
}
