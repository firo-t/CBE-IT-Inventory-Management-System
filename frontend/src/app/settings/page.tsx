'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { getUser } from '@/lib/auth';
import { api } from '@/lib/api';

export default function Settings() {
  const u = getUser();
  const r = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const changePassword = async (e: any) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwErr('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPwErr('Password must be at least 6 characters.');
      return;
    }
    setPwBusy(true);
    setPwErr('');
    setPwSuccess('');
    try {
      await api.patch(`/users/${u?.id}/password`, { newPassword });
      setPwSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (x: any) {
      setPwErr(x.response?.data?.message || 'Password change failed.');
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <Page title="Settings" description="View your account information and change your password.">
        <div className="grid grid2">

          {/* Account Info */}
          <div className="card">
            <h2 className="section-title">My Account</h2>
            <div className="detail-grid">
              {[
                ['Full Name', u?.fullName],
                ['Email', u?.email],
                ['Role', u?.role],
                ['Employee ID', u?.employeeId],
              ].map(([label, value]) => (
                <div className="kv" key={label as string}>
                  <small>{label as string}</small>
                  <b>{(value as string) || '—'}</b>
                </div>
              ))}
            </div>
          </div>

          {/* Change Password */}
          <div className="card">
            <h2 className="section-title">Change Password</h2>
            <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <div className="field">
                <label>New Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Confirm New Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {pwErr && <div className="error">{pwErr}</div>}
              {pwSuccess && <div style={{ color: 'var(--success, #38a169)', fontSize: 14 }}>✓ {pwSuccess}</div>}
              <button type="submit" className="btn btn-primary" disabled={pwBusy} style={{ alignSelf: 'flex-start' }}>
                {pwBusy ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* System Info */}
          <div className="card">
            <h2 className="section-title">System Information</h2>
            <div className="detail-grid">
              {[
                ['System', 'CBE IT Hardware Inventory Management System'],
                ['Organization', 'Commercial Bank of Ethiopia (CBE)'],
                ['Backend URL', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'],
                ['Version', '1.0.0 (Internship Release)'],
              ].map(([label, value]) => (
                <div className="kv" key={label as string}>
                  <small>{label as string}</small>
                  <b style={{ wordBreak: 'break-all' }}>{(value as string) || '—'}</b>
                </div>
              ))}
            </div>
          </div>

        </div>
      </Page>
    </DashboardLayout>
  );
}
