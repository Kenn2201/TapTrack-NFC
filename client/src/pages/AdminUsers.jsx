import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import Header from '../components/layout/Header';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

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

  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'OPERATOR' ? 'USER' : 'OPERATOR';
    const confirmMessage = `Are you sure you want to change ${targetUser.firstName}'s role from ${targetUser.role} to ${newRole}?`;
    if (!window.confirm(confirmMessage)) return;

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
  };

  const handleStatusToggle = async (targetUser) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const confirmMessage = `Are you sure you want to set ${targetUser.firstName}'s account to ${newStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    setActionLoadingId(targetUser.id);
    setActionSuccess(null);
    try {
      await authService.updateStatus(targetUser.id, newStatus);
      setActionSuccess(`Account for ${targetUser.email} is now ${newStatus}.`);
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update account status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    return fullName.includes(term) || u.email.toLowerCase().includes(term) || u.role.toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-semibold rounded-full">
                ADMINISTRATION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              User Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              View accounts, manage OPERATOR promotions, and adjust account access.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {actionSuccess && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3.5 rounded-lg flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200 text-xs font-bold">
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3.5 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 text-xs font-bold">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <LoadingSpinner />
            <p className="text-sm text-slate-400 mt-3">Loading users...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Email Verification</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No users match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      const isActing = actionLoadingId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">
                              {u.firstName} {u.lastName} {isSelf && <span className="text-xs text-purple-400">(You)</span>}
                            </div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                : u.role === 'OPERATOR'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {u.emailVerifiedAt ? (
                              <span className="text-emerald-400 font-medium">Verified</span>
                            ) : (
                              <span className="text-amber-400 font-medium">Unverified</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {isSelf ? (
                              <span className="text-xs text-slate-500 italic">Self-account locked</span>
                            ) : (
                              <>
                                {u.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => handleRoleToggle(u)}
                                    disabled={isActing}
                                    className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors disabled:opacity-50"
                                  >
                                    {u.role === 'OPERATOR' ? 'Demote to USER' : 'Promote to OPERATOR'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStatusToggle(u)}
                                  disabled={isActing}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors disabled:opacity-50 ${
                                    u.status === 'ACTIVE'
                                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  }`}
                                >
                                  {u.status === 'ACTIVE' ? 'Disable' : 'Activate'}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm">
                  No users found.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isActing = actionLoadingId === u.id;

                  return (
                    <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-white text-base">
                            {u.firstName} {u.lastName} {isSelf && <span className="text-xs text-purple-400">(You)</span>}
                          </div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : u.role === 'OPERATOR'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                        <span className="text-slate-400">
                          Status: <strong className={u.status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}>{u.status}</strong>
                        </span>
                        <span className="text-slate-400">
                          Email: <strong className={u.emailVerifiedAt ? 'text-emerald-400' : 'text-amber-400'}>
                            {u.emailVerifiedAt ? 'Verified' : 'Unverified'}
                          </strong>
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex gap-2 justify-end">
                        {isSelf ? (
                          <span className="text-xs text-slate-500 italic">Self-account locked</span>
                        ) : (
                          <>
                            {u.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleRoleToggle(u)}
                                disabled={isActing}
                                className="flex-1 py-1.5 px-2 text-xs font-semibold bg-slate-800 text-slate-200 rounded border border-slate-700"
                              >
                                {u.role === 'OPERATOR' ? 'Demote USER' : 'Promote OP'}
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusToggle(u)}
                              disabled={isActing}
                              className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded border ${
                                u.status === 'ACTIVE'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Disable' : 'Activate'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
