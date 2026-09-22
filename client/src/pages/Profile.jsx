import React, { useState } from 'react';
import Header from '../components/layout/Header';
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

export default function Profile() {
  useDocumentTitle('Profile');
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [birthday, setBirthday] = useState(user?.birthday ? user.birthday.split('T')[0] : '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await authService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim() || null,
        birthday: birthday || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      await refreshUser();
      setMessage('Profile identity updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
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

  const isVerified = !!user?.emailVerifiedAt;

  return (
    <>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header />

        <PageContainer maxWidth="max-w-4xl">
        <PageHeader
          title="User Profile"
          description="View your organizational credentials, account status, and identity settings."
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
          {/* 1. IDENTITY SECTION */}
          <Section title="Identity" subtitle="Your display name and personal details as shown in attendance rosters">
            <Card>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
                <div>
                  <Input
                    label="Avatar URL (optional)"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading || !firstName.trim() || !lastName.trim()}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </Section>

          {/* 2. ACCOUNT SECTION */}
          <Section title="Account" subtitle="Primary contact email and system identifiers">
            <Card className="divide-y divide-slate-800/80">
              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Email Address</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{user?.email}</p>
                </div>
                <span className="text-xs text-slate-500 font-mono">Immutable</span>
              </div>
              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Member ID</span>
                  <p className="text-sm font-mono text-white mt-0.5">#{user?.id}</p>
                </div>
                <span className="text-xs text-slate-500">Database ID</span>
              </div>
              <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Registered On</span>
                  <p className="text-sm text-slate-200 mt-0.5">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'}
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
                    : 'Standard member account with access to personal card and attendance history.'}
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
        </div>
      </PageContainer>
    </div>

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
