'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function ReturnAssignment() {
  const params = useParams();
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setBusy(true);
    setErr('');

    try {
      await api.patch(`/assignments/${params.id}/return`);
      router.push('/assignments');
    } catch (e: any) {
      setErr(
        e.response?.data?.message ||
          'Could not return this assignment.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <Page
        title="Return Assignment"
        description="Confirm that this assigned asset has been returned."
      >
        <div className="card">
          <p>
            Are you sure you want to mark this assignment as returned?
          </p>

          {err && <div className="error">{err}</div>}

          <div className="actions">
            <button
              type="button"
              disabled={busy}
              className="btn btn-primary"
              onClick={submit}
            >
              {busy ? 'Processing...' : 'Confirm Return'}
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
