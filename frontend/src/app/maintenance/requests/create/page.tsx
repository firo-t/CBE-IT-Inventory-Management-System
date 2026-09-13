'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function Create() {
  const r = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [f, setF] = useState({ asset_id: '', problem_description: '', priority: 'MEDIUM' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/assets').then(res => {
      setAssets(res.data.map((x: any) => ({ value: x.asset_id, label: `${x.tag_no}${x.model ? ' — ' + x.model : ''}` })));
    }).catch(console.error);
  }, []);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/maintenance/requests', f);
      r.push('/maintenance/requests');
    } catch (x: any) {
      setErr(x.response?.data?.message || 'Could not create request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <Page title="Create Maintenance Request" description="Report an issue and start the maintenance workflow." showBack={true}>
        <div className="card">
          <form onSubmit={submit} className="form-grid">
            <div className="field">
              <label>Asset *</label>
              <select className="select" required value={f.asset_id} onChange={e => setF({ ...f, asset_id: e.target.value })}>
                <option value="">Select asset...</option>
                {assets.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select className="select" value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}>
                {PRIORITIES.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="field span2">
              <label>Problem description *</label>
              <textarea className="textarea" required rows={5} value={f.problem_description} onChange={e => setF({ ...f, problem_description: e.target.value })} />
            </div>
            {err && <div className="error span2">{err}</div>}
            <div className="actions span2">
              <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Submitting...' : 'Submit Request'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => r.back()}>Cancel</button>
            </div>
          </form>
        </div>
      </Page>
    </DashboardLayout>
  );
}
