import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import useDocumentTitle from '../hooks/useDocumentTitle';

function getInitials(user) {
  const first = (user?.firstName || '').trim();
  const last = (user?.lastName || '').trim();
  if (!first && !last) return '?';
  return ((first.charAt(0) || '') + (last.charAt(0) || first.charAt(1) || '')).toUpperCase();
}

function isValidAvatarUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatBirthday(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Profile() {
  useDocumentTitle('Profile');
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [editingProfile, setEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [editError, setEditError] = useState(null);

  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiveConfirmation, setArchiveConfirmation] = useState('');
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState(null);

  const openEditProfile = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setNickname(user?.nickname || '');
    setBirthday(user?.birthday ? user.birthday.split('T')[0] : '');
    setAvatarUrl(user?.avatarUrl || '');
    setEditError(null);
    setEditingProfile(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEditError(null);

    try {
      await authService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim() || null,
        birthday: birthday || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      await refreshUser();
      setEditingProfile(false);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword, confirmPassword });
      setChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password changed successfully. Other sessions have been invalidated.');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleArchiveAccount = async (e) => {
    e.preventDefault();
    if (archiveConfirmation !== 'ARCHIVE') {
      setArchiveError('Type ARCHIVE exactly to confirm.');
      return;
    }
    setArchiveLoading(true);
    setArchiveError(null);
    try {
      await authService.archiveAccount();
      navigate('/login', {
        replace: true,
        state: { archived: true },
      });
    } catch (err) {
      setArchiveError(err.message || 'Failed to archive account.');
    } finally {
      setArchiveLoading(false);
    }
  };

  const isVerified = !!user?.emailVerifiedAt;
  const avatarSrc = isValidAvatarUrl(user?.avatarUrl) ? user.avatarUrl : null;
  const friendlyBirthday = formatBirthday(user?.birthday);

  return (
    <>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

        <PageContainer maxWidth="max-w-4xl">
          <PageHeader
            title="Profile"
            description="Your account identity, status, and security settings."
          />

          {message && (
            <div className="mb-6">
              <Alert type="success" message={message} onClose={() => setMessage(null)} />
            </div>
          )}

          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={() => setError(null)} />
            </div>
          )}

          <div className="space-y-8">
            {/* 1. AVATAR + IDENTITY HEADER */}
            <Section title="Profile" subtitle="How you appear in attendance rosters and admin views">
              <Card className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="relative flex-shrink-0">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Profile'}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-slate-700"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-600/90 border-2 border-blue-400/30 flex items-center justify-center text-white text-2xl sm:text-3xl font-black ${avatarSrc ? 'hidden' : ''}`}
                      aria-hidden="true"
                    >
                      {getInitials(user)}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-bold text-white">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    {user?.nickname && (
                      <p className="text-sm text-slate-400">"{user.nickname}"</p>
                    )}
                    <p className="text-sm text-slate-400 mt-1 break-all">{user?.email}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <StatusBadge status={user?.role} />
                      <StatusBadge status={user?.status} />
                    </div>
                    <div className="mt-4">
                      <Button onClick={openEditProfile} className="w-full sm:w-auto" disabled={editingProfile}>
                        {editingProfile ? 'Editing Profile' : 'Edit Profile'}
                      </Button>
                    </div>
                  </div>
                </div>
                {editingProfile && (
                  <form onSubmit={handleSubmit} className="mt-6 border-t border-slate-800 pt-5 space-y-4">
                    {editError && (
                      <Alert type="error" message={editError} onClose={() => setEditError(null)} />
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                      <Input
                        label="Last Name"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                    <Input
                      label="Nickname (optional)"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Preferred short name"
                    />
                    <Input
                      label="Birthday (optional)"
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                      label="Avatar image URL (optional)"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      helperText="TapTrack does not currently have profile-image file storage. Use a direct HTTPS image URL, or leave this blank to use initials."
                    />
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" loading={loading} disabled={loading || !firstName.trim() || !lastName.trim()}>
                        Save Profile
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            </Section>

            {/* 2. ACCOUNT DETAILS */}
            <Section title="Account" subtitle="Your registered details and account identity">
              <Card className="divide-y divide-slate-800/80">
                <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Email Address</span>
                    <p className="text-sm font-semibold text-white mt-0.5 break-all">{user?.email}</p>
                  </div>
                  <span className="text-xs text-slate-500">Not editable here</span>
                </div>
                <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Nickname</span>
                    <p className="text-sm text-slate-200 mt-0.5">{user?.nickname || '—'}</p>
                  </div>
                </div>
                <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Birthday</span>
                    <p className="text-sm text-slate-200 mt-0.5">
                      {friendlyBirthday || 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Member ID</span>
                    <p className="text-sm font-mono text-slate-200 mt-0.5">#{user?.id}</p>
                  </div>
                </div>
                <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Registered On</span>
                    <p className="text-sm text-slate-200 mt-0.5">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })
                        : '—'}
                    </p>
                  </div>
                </div>
              </Card>
            </Section>

            {/* 3. ROLE SECTION */}
            <Section title="Role" subtitle="Organizational permissions and access level">
              <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={user?.role} />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    {user?.role === 'ADMIN'
                      ? 'Full administrative control over users, cards, events, and audit logs.'
                      : user?.role === 'OPERATOR'
                      ? 'Authorized to open attendance sessions, scan NFC cards, and record manual check-ins.'
                      : 'Standard account with access to personal card and attendance history.'}
                  </p>
                </div>
                <span className="text-xs text-slate-500 italic whitespace-nowrap">
                  Role managed by Admin
                </span>
              </Card>
            </Section>

            {/* 4. STATUS SECTION */}
            <Section title="Status" subtitle="Account activation and verification state">
              <Card className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 sm:p-6">
                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-1">Account State</span>
                  <StatusBadge status={user?.status} />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-1">Email Verification</span>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Verified ({new Date(user.emailVerifiedAt).toLocaleDateString()})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Pending Email Verification
                    </span>
                  )}
                </div>
              </Card>
            </Section>

            {/* 5. SECURITY SECTION */}
            <Section title="Security" subtitle="Session tokens, credential defense, and password management">
              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-white">HttpOnly Cookie Authentication</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  TapTrack NFC uses secure, server-managed HttpOnly session cookies. HttpOnly prevents client-side
                  JavaScript from directly reading the authentication cookie, reducing credential exposure. Password
                  hashes are computed using industry-standard bcrypt.
                </p>
                <div className="pt-2 border-t border-slate-800">
                  <Button variant="outline" onClick={() => setChangePasswordModal(true)} className="w-full sm:w-auto">
                    Change Password
                  </Button>
                </div>
              </Card>
            </Section>

            {/* 6. ACCOUNT ARCHIVE */}
            <Section title="Account Archive" subtitle="Disable sign-in while preserving historical records">
              <Card className="p-5 sm:p-6 border-rose-500/20">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Archive this account</h4>
                    <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-400">
                      Archiving disables sign-in and invalidates active sessions. Attendance history, event participation,
                      NFC card history, and audit records are preserved. This is not permanent deletion.
                    </p>
                    {user?.role === 'ADMIN' && (
                      <p className="mt-2 text-xs text-amber-300">
                        Administrator accounts cannot archive themselves to avoid administrative lockout.
                      </p>
                    )}
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => { setArchiveConfirmation(''); setArchiveError(null); setArchiveModal(true); }}
                    disabled={user?.role === 'ADMIN'}
                    className="w-full sm:w-auto"
                  >
                    Archive Account
                  </Button>
                </div>
              </Card>
            </Section>
          </div>
        </PageContainer>
      </div>

      <Modal
        isOpen={archiveModal}
        onClose={() => !archiveLoading && setArchiveModal(false)}
        title="Archive Account?"
        description="This disables sign-in but preserves historical records."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleArchiveAccount} className="space-y-4">
          {archiveError && <Alert type="error" message={archiveError} onClose={() => setArchiveError(null)} />}
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            Your sessions will be revoked and you will be signed out. An administrator can reactivate the account later.
          </div>
          <Input
            label="Type ARCHIVE to confirm"
            value={archiveConfirmation}
            onChange={(e) => setArchiveConfirmation(e.target.value)}
            autoComplete="off"
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setArchiveModal(false)} disabled={archiveLoading}>Cancel</Button>
            <Button type="submit" variant="danger" loading={archiveLoading} disabled={archiveLoading || archiveConfirmation !== 'ARCHIVE'}>
              Archive Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        isOpen={changePasswordModal}
        onClose={() => setChangePasswordModal(false)}
        title="Change Password"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <Alert type="error" message={passwordError} onClose={() => setPasswordError(null)} />
          )}
          <Input
            label="Current Password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimum 8 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setChangePasswordModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={passwordLoading} disabled={passwordLoading}>
              Change Password
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
