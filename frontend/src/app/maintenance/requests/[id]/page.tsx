'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DetailPage from '@/components/ui/DetailPage';
import AttachmentPanel from '@/components/ui/AttachmentPanel';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { can } from '@/lib/permissions';

const MAINTENANCE_STATUSES = [
  'REPORTED', 'RECEIVED', 'ASSIGNED', 'UNDER_INSPECTION',
  'UNDER_REPAIR', 'WAITING_FOR_PARTS', 'REPAIRED', 'COMPLETED', 'CLOSED'
];

export default function MaintenanceRequestDetail() {
  const p = useParams();
  const r = useRouter();
  const id = p.id as string;
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [status, setStatus] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const u = getUser();

  const load = () =>
    api.get(`/maintenance/requests/${id}`)
      .then(x => {
        setStatus(x.data?.status || '');
        setSelectedTech(x.data?.maintenance_record?.technician_id || '');
      })
      .catch(e => setErr(e.response?.data?.message || 'Unable to load request.'));

  useEffect(() => {
    load();
    api.get('/users').then(res => {
      const techs = res.data
        .filter((x: any) => x.role?.role_name === 'Hardware Technician')
        .map((x: any) => ({ value: x.user_id, label: `${x.full_name} (${x.employee_id})` }));
      setTechnicians(techs);
    }).catch(console.error);
  }, [id]);

  const call = async (fn: any) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
      await load();
      r.refresh();
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <DetailPage
        title="Maintenance Request"
        endpoint={`/maintenance/requests/${id}`}
        fields={[
          { key: 'asset.tag_no', label: 'Asset Tag' },
          { key: 'asset.model', label: 'Asset Model' },
          { key: 'problem_description', label: 'Problem Description' },
          { key: 'priority', label: 'Priority', badge: true },
          { key: 'status', label: 'Status', badge: true },
          { key: 'reporter.full_name', label: 'Reported By' },
          { key: 'branch.branch_name', label: 'Branch' },
          { key: 'maintenance_record.technician.full_name', label: 'Assigned Technician' },
          { key: 'maintenance_record.status', label: 'Record Status', badge: true },
          { key: 'reported_date', label: 'Reported On' },
        ]}
      />

      {err && <div className="alert" style={{ marginTop: 16 }}>{err}</div>}

      <div className="grid grid2" style={{ marginTop: 16 }}>
        {/* Assign Technician */}
        {can('maintenance', 'assign') && (
          <div className="card">
            <h2 className="section-title">Assign Technician</h2>
            {u?.role === 'Hardware Technician' ? (
              <>
                <p className="muted">Click to self-assign this request to yourself.</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 8 }}
                  disabled={busy}
                  onClick={() => call(() => api.post(`/maintenance/requests/${id}/assign`, {}))}
                >
                  Self-assign to me
                </button>
              </>
            ) : (
              <>
                <p className="muted">Select a hardware technician to assign this request.</p>
                <div className="actions" style={{ marginTop: 8 }}>
                  <select className="select" value={selectedTech} onChange={e => setSelectedTech(e.target.value)}>
                    <option value="">Select technician...</option>
                    {technicians.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <button
                    className="btn btn-primary"
                    disabled={busy || !selectedTech}
                    onClick={() => call(() => api.post(`/maintenance/requests/${id}/assign`, { technician_id: selectedTech }))}
                  >
                    Assign
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Update Status */}
        {can('maintenance', 'status') && (
          <div className="card">
            <h2 className="section-title">Update Status</h2>
            <p className="muted">Change the current workflow status of this maintenance request.</p>
            <div className="actions" style={{ marginTop: 8 }}>
              <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
                {MAINTENANCE_STATUSES.map(x => <option key={x}>{x}</option>)}
              </select>
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() => call(() => api.patch(`/maintenance/requests/${id}/status`, { status }))}
              >
                Update
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Maintenance Record */}
      {can('maintenance', 'record') && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 className="section-title">Maintenance Record</h2>
          <p className="muted">Log the diagnosis, repair actions, parts used and completion details.</p>
          <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => r.push(`/maintenance/records/${id}`)}>
            Open Record Form
          </button>
        </div>
      )}

      {/* Attachments — FR-21 */}
      <AttachmentPanel
        maintenanceRequestId={id}
        canUpload={can('attachments', 'create')}
        canDelete={can('attachments', 'create')}
      />
    </DashboardLayout>
  );
}