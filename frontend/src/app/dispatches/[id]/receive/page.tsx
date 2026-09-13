'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function ReceiveDispatch() {
  const params = useParams();
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setBusy(true);
    setErr('');

    try {
      await api.patch(`/dispatches/${params.id}/receive`);
      router.push('/dispatches');
    } catch (e: any) {
      setErr(
        e.response?.data?.message ||
          'Could not receive this dispatch.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <Page
        title="Receive Dispatch"
        description="Confirm that this dispatched asset has been received."
      >
        <div className="card">
          <p>
            Are you sure you want to mark this dispatch as received?
          </p>

          {err && <div className="error">{err}</div>}

          <div className="actions">
            <button
              type="button"
              disabled={busy}
              className="btn btn-primary"
              onClick={submit}
            >
              {busy ? 'Processing...' : 'Confirm Receipt'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.back()}
            >
              Cancel
            </button>
          </div>
        </div>
      </Page>
    </DashboardLayout>
  );
}
