'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function UpdateMaintenanceStatus() {
  const params = useParams();
  const router = useRouter();

  const [status, setStatus] = useState('REPORTED');
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
                {[
                  'REPORTED',
                  'RECEIVED',
                  'ASSIGNED',
                  'UNDER_INSPECTION',
                  'UNDER_REPAIR',
                  'WAITING_FOR_PARTS',
                  'REPAIRED',
                  'COMPLETED',
                  'CLOSED',
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
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
