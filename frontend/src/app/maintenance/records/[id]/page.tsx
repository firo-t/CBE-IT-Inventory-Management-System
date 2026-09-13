'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function MaintenanceRecord() {
  const p = useParams();
  const r = useRouter();
  const [existing, setExisting] = useState<any>(null);
  const [f, setF] = useState({
    diagnosis: '',
    repair_action: '',
    parts_used: '',
    start_date: '',
    completion_date: '',
    remarks: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/maintenance/requests/${p.id}`)
      .then(res => {
        const rec = res.data?.maintenance_record;
        if (rec) {
          setExisting(rec);
          setF({
            diagnosis: rec.diagnosis || '',
            repair_action: rec.repair_action || '',
            parts_used: rec.parts_used || '',
            start_date: rec.start_date ? rec.start_date.slice(0, 10) : '',
            completion_date: rec.completion_date ? rec.completion_date.slice(0, 10) : '',
            remarks: rec.remarks || '',
          });
        }
      })
      .catch(e => setErr(e.response?.data?.message || 'Unable to load record.'));
  }, [p.id]);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api.post(`/maintenance/requests/${p.id}/records`, f);
      r.push(`/maintenance/requests/${p.id}`);
    } catch (x: any) {
      setErr(x.response?.data?.message || 'Could not save maintenance record.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <Page
        title={existing ? 'Update Maintenance Record' : 'Create Maintenance Record'}
        description="Log the diagnosis, repair actions, and completion details for this maintenance request."
        showBack={true}
      >
        <div className="card">
          <form onSubmit={submit} className="form-grid">
            <div className="field span2">
              <label>Diagnosis</label>
              <textarea className="textarea" rows={3} value={f.diagnosis} onChange={e => setF({ ...f, diagnosis: e.target.value })} placeholder="Describe what was found..." />
            </div>
            <div className="field span2">
              <label>Repair Action</label>
              <textarea className="textarea" rows={3} value={f.repair_action} onChange={e => setF({ ...f, repair_action: e.target.value })} placeholder="Describe what was done..." />
            </div>
            <div className="field span2">
              <label>Parts Used</label>
              <textarea className="textarea" rows={2} value={f.parts_used} onChange={e => setF({ ...f, parts_used: e.target.value })} placeholder="List any parts that were replaced or used..." />
            </div>
            <div className="field">
              <label>Start Date</label>
              <input className="input" type="date" value={f.start_date} onChange={e => setF({ ...f, start_date: e.target.value })} />
            </div>
            <div className="field">
              <label>Completion Date</label>
              <input className="input" type="date" value={f.completion_date} onChange={e => setF({ ...f, completion_date: e.target.value })} />
            </div>
            <div className="field span2">
              <label>Remarks</label>
              <textarea className="textarea" rows={2} value={f.remarks} onChange={e => setF({ ...f, remarks: e.target.value })} placeholder="Any additional notes or observations..." />
            </div>
            {err && <div className="error span2">{err}</div>}
            <div className="actions span2">
              <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving...' : (existing ? 'Update Record' : 'Create Record')}</button>
              <button type="button" className="btn btn-secondary" onClick={() => r.back()}>Cancel</button>
            </div>
          </form>
        </div>
      </Page>
    </DashboardLayout>
  );
}