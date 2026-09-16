'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function AssignTechnician() {
  const params = useParams();
  const router = useRouter();

  const [technicianId, setTechnicianId] = useState('');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/users', { params: { role: 'Hardware Technician' } }).then(res => {
      console.log('TECHNICIANS RESPONSE:', res.data);
      setTechnicians(res.data);
    }).catch(console.error);
  }, []);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      await api.post(`/maintenance/requests/${params.id}/assign`, {
        technician_id: technicianId || undefined,
      });

      setSuccess('Technician assigned successfully!');
      router.refresh();
      
      setTimeout(() => {
        router.push('/maintenance');
      }, 1500);
      
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

              <select
                className="input"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
              >
                <option value="">-- Automatic / Leave Empty --</option>
                {technicians.map(t => (
                  <option key={t.user_id} value={t.user_id}>
                    {t.full_name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <p className="span2">
              Leave the field empty if the backend supports automatic
              technician assignment.
            </p>

            {err && <div className="error span2">{err}</div>}
            {success && <div className="alert alert-success span2" style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px' }}>{success}</div>}

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
