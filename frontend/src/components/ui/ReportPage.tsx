'use client';
import { useState, useEffect } from 'react';
import Page from './Page';
import { api, blobDownload } from '@/lib/api';

const ASSET_STATUSES = ['AVAILABLE','ASSIGNED','IN_TRANSIT','UNDER_MAINTENANCE','DAMAGED','LOST','DISPOSED','RETIRED'];
const MAINTENANCE_STATUSES = ['REPORTED','RECEIVED','ASSIGNED','UNDER_INSPECTION','UNDER_REPAIR','WAITING_FOR_PARTS','REPAIRED','COMPLETED','CLOSED'];
const ASSIGNMENT_STATUSES = ['ACTIVE','RETURNED'];
const DISPATCH_STATUSES = ['DISPATCHED','RECEIVED','CANCELLED'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','CRITICAL'];

export default function ReportPage({ title, endpoint }: { title: string; endpoint: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<any>({});
  const [branches, setBranches] = useState<any[]>([]);
  const [assetTypes, setAssetTypes] = useState<any[]>([]);

  useEffect(() => {
    api.get('/branches').then(r => setBranches(r.data || [])).catch(() => {});
    api.get('/asset-types').then(r => setAssetTypes(r.data || [])).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setParams((p: any) => ({ ...p, [k]: v || undefined }));

  const run = async () => {
    setLoading(true);
    try {
      const r = await api.get(endpoint, { params });
      const d = r.data;
      setRows(Array.isArray(d) ? d : (d?.data || d?.items || []));
    } finally {
      setLoading(false);
    }
  };

  const isInventory = endpoint.includes('inventory');
  const isMaintenance = endpoint.includes('maintenance');
  const isMovement = endpoint.includes('dispatches');
  const isAssignment = endpoint.includes('assignments');

  const flattenRow = (row: any, prefix = ''): Record<string, any> => {
    const out: Record<string, any> = {};
    for (const k of Object.keys(row)) {
      const val = row[k];
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        Object.assign(out, flattenRow(val, prefix ? `${prefix}.${k}` : k));
      } else {
        out[prefix ? `${prefix}.${k}` : k] = val;
      }
    }
    return out;
  };

  const flatRows = rows.map(r => flattenRow(r));
  const keys = flatRows.length > 0 ? Object.keys(flatRows[0]).slice(0, 12) : [];

  return (
    <Page title={title} description="Apply filters and generate the report. Export to PDF or Excel." showBack={true}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid">

          {/* Branch filter — all report types */}
          <div className="field">
            <label>Branch</label>
            <select className="select" onChange={e => set(isMovement ? 'destination_branch_id' : 'branch_id', e.target.value)}>
              <option value="">All branches</option>
              {branches.map((b: any) => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <div className="field">
            <label>Status</label>
            <select className="select" onChange={e => set('status', e.target.value)}>
              <option value="">All statuses</option>
              {(isInventory ? ASSET_STATUSES : isMaintenance ? MAINTENANCE_STATUSES : isMovement ? DISPATCH_STATUSES : ASSIGNMENT_STATUSES)
                .map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Asset Type filter — inventory only */}
          {isInventory && (
            <div className="field">
              <label>Asset Type</label>
              <select className="select" onChange={e => set('asset_type_id', e.target.value)}>
                <option value="">All types</option>
                {assetTypes.map((t: any) => <option key={t.asset_type_id} value={t.asset_type_id}>{t.type_name}</option>)}
              </select>
            </div>
          )}

          {/* Priority filter — maintenance only */}
          {isMaintenance && (
            <div className="field">
              <label>Priority</label>
              <select className="select" onChange={e => set('priority', e.target.value)}>
                <option value="">All priorities</option>
                {PRIORITIES.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          )}

          <div className="field">
            <label>Start date</label>
            <input className="input" type="date" onChange={e => set('start_date', e.target.value)} />
          </div>

          <div className="field">
            <label>End date</label>
            <input className="input" type="date" onChange={e => set('end_date', e.target.value)} />
          </div>
        </div>

        <div className="actions" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={run} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          <button className="btn btn-secondary" onClick={() => blobDownload(endpoint + '/pdf', params)}>
            Export PDF
          </button>
          <button className="btn btn-secondary" onClick={() => blobDownload(endpoint + '/excel', params)}>
            Export Excel
          </button>
        </div>
      </div>

      <div className="card table-wrap">
        {rows.length === 0 ? (
          <div className="empty">No data. Click "Generate Report" to load results.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>{keys.map(k => <th key={k}>{k.replace(/_/g, ' ').replace(/\./g, ' › ')}</th>)}</tr>
            </thead>
            <tbody>
              {flatRows.map((row, i) => (
                <tr key={i}>
                  {keys.map(k => <td key={k}>{String(row[k] ?? '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
        {rows.length > 0 && `${rows.length} record(s) — showing first 12 columns`}
      </div>
    </Page>
  );
}
