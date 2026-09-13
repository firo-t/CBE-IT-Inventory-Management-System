'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function EditMaintenanceRequest() {
  const params = useParams();
  const router = useRouter();

  const [f, setF] = useState({
    problem_description: '',
    priority: 'MEDIUM',
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get(`/maintenance/requests/${params.id}`)
      .then((res) => {
        const request = res.data;

        setF({
          problem_description: request.problem_description || '',
          priority: request.priority || 'MEDIUM',
        });
      })
      .catch((e) => {
        setErr(
          e.response?.data?.message ||
            'Unable to load maintenance request.'
        );
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      await api.patch(`/maintenance/requests/${params.id}`, f);
      router.push('/maintenance/requests');
    } catch (e: any) {
      setErr(
        e.response?.data?.message ||
          'Could not update maintenance request.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Page
          title="Edit Maintenance Request"
          description="Update maintenance request information."
        >
          <div className="card">Loading...</div>
        </Page>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Page
        title="Edit Maintenance Request"
        description="Update maintenance request information."
      >
        <div className="card">
          <form onSubmit={submit} className="form-grid">
            <div className="field">
              <label>Priority *</label>

              <select
                className="select"
                required
                value={f.priority}
                onChange={(e) =>
                  setF({ ...f, priority: e.target.value })
                }
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div className="field span2">
              <label>Problem description *</label>

              <textarea
                className="textarea"
                required
                rows={6}
                value={f.problem_description}
                onChange={(e) =>
                  setF({
                    ...f,
                    problem_description: e.target.value,
                  })
                }
              />
            </div>

            {err && <div className="error span2">{err}</div>}

            <div className="actions span2">
              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary"
              >
                {busy ? 'Saving...' : 'Save Changes'}
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
