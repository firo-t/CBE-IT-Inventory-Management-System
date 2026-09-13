'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function AssignTechnician() {
  const params = useParams();
  const router = useRouter();

  const [technicianId, setTechnicianId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      await api.post(`/maintenance/requests/${params.id}/assign`, {
        technician_id: technicianId || undefined,
      });

      router.push('/maintenance/requests');
    } catch (e: any) {
      setErr(
        e.response?.data?.message ||
          'Could not assign technician.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <Page
        title="Assign Technician"
        description="Assign a technician to this maintenance request."
      >
        <div className="card">
          <form onSubmit={submit} className="form-grid">
            <div className="field span2">
              <label>Technician ID</label>

              <input
                className="input"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                placeholder="Enter technician UUID"
              />
            </div>

            <p className="span2">
              Leave the field empty if the backend supports automatic
              technician assignment.
            </p>

            {err && <div className="error span2">{err}</div>}

            <div className="actions span2">
              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary"
              >
                {busy ? 'Assigning...' : 'Assign Technician'}
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
