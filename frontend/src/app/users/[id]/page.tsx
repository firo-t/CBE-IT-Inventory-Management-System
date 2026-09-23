'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DetailPage from '@/components/ui/DetailPage';
import { useParams } from 'next/navigation';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function UserDetail() {
  useRoleGuard(['ADMIN']);
  const p = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const resetPassword = async (e: any) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMsg('Error: Password must be at least 6 characters.');
      return;
    }
    if (!window.confirm('Are you sure you want to FORCEFULLY reset this user\'s password? They will lose access to their current password.')) {
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      await api.patch(`/users/${p.id}/password`, { newPassword });
      setMsg('Success: Password has been reset.');
      setNewPassword('');
    } catch (err: any) {
      setMsg('Error: ' + (err.response?.data?.message || 'Failed to reset password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <DetailPage
        title="User Details"
        endpoint={`/users/${p.id}`}
        fields={[
          { key: 'full_name', label: 'Full Name' },
          { key: 'employee_id', label: 'Employee ID' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'role.role_name', label: 'Role' },
          { key: 'branch.branch_name', label: 'Branch' },
          { key: 'status', label: 'Status', badge: true },
          { key: 'created_at', label: 'Created At' },
        ]}
      >
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title" style={{ color: 'var(--danger, #e53e3e)' }}>Admin Password Reset</h2>
          <p className="muted" style={{ marginBottom: 15 }}>
            Forcefully reset this user's password. They will be able to log in with the new password immediately.
          </p>
          <form onSubmit={resetPassword} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div>
              <input
                type="password"
                className="input"
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                style={{ width: 300 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ background: 'var(--danger, #e53e3e)', borderColor: 'var(--danger, #e53e3e)' }}>
              {busy ? 'Resetting...' : 'Force Reset Password'}
            </button>
          </form>
          {msg && (
            <div style={{ marginTop: 10, color: msg.startsWith('Success') ? 'var(--success, #38a169)' : 'var(--danger, #e53e3e)', fontWeight: 500 }}>
              {msg}
            </div>
          )}
        </div>
      </DetailPage>
    </DashboardLayout>
  );
}
