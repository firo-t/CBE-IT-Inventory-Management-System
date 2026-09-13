'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function CreateMaintenanceRecord() {
  const params = useParams();
  const router = useRouter();

  const [f, setF] = useState({
    diagnosis: '',
    repair_action: '',
    parts_used: '',
    remarks: '',
    condition: '',
    start_date: '',
    completion_date: '',
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    const data: any = { ...f };

    Object.keys(data).forEach((key) => {
      if (data[key] === '') {
        delete data[key];
      }
    });

    try {
      await api.post(
        `/maintenance/requests/${params.id}/records`,
        data
      );

      router.push('/maintenance/requests');
    } catch (e: any) {
      setErr(
        e.response?.data?.message ||
          'Could not create maintenance record.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <Page
        title="Create Maintenance Record"
        description="Record the diagnosis, repair work, and completion details."
      >
        <div className="card">
          <form onSubmit={submit} className="form-grid">
            <div className="field">
              <label>Diagnosis</label>
              <textarea
                className="textarea"
                rows={4}
                value={f.diagnosis}
                onChange={(e) =>
                  setF({ ...f, diagnosis: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Repair action</label>
              <textarea
                className="textarea"
                rows={4}
                value={f.repair_action}
                onChange={(e) =>
                  setF({ ...f, repair_action: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Parts used</label>
              <textarea
                className="textarea"
                rows={4}
                value={f.parts_used}
                onChange={(e) =>
                  setF({ ...f, parts_used: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Condition</label>
              <input
                className="input"
                value={f.condition}
                onChange={(e) =>
                  setF({ ...f, condition: e.target.value })
                }
              />
            </div>

            <div className="field span2">
              <label>Remarks</label>
              <textarea
                className="textarea"
                rows={4}
                value={f.remarks}
                onChange={(e) =>
                  setF({ ...f, remarks: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Start date</label>
              <input
                className="input"
                type="datetime-local"
                value={f.start_date}
                onChange={(e) =>
                  setF({ ...f, start_date: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Completion date</label>
              <input
                className="input"
                type="datetime-local"
                value={f.completion_date}
                onChange={(e) =>
                  setF({ ...f, completion_date: e.target.value })
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
                {busy ? 'Saving...' : 'Save Record'}
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
