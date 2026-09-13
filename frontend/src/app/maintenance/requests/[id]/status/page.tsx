'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function UpdateMaintenanceStatus() {
  const params = useParams();
  const router = useRouter();

  const [status, setStatus] = useState('IN_PROGRESS');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      await api.patch(`/maintenance/requests/${params.id}/status`, {
        status,
      });

      router.push('/maintenance/requests');
    } catch (e: any) {
      setErr(
        e.response?.data?.message ||
          'Could not update maintenance status.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <Page
        title="Update Maintenance Status"
        description="Change the current status of this maintenance request."
      >
        <div className="card">
          <form onSubmit={submit} className="form-grid">
            <div className="field">
              <label>Status *</label>

              <select
                className="select"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {err && <div className="error span2">{err}</div>}

            <div className="actions span2">
              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary"
              >
                {busy ? 'Updating...' : 'Update Status'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.back()}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Page>
    </DashboardLayout>
  );
}
