'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DetailPage from '@/components/ui/DetailPage';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function DispatchDetail() {
  const p = useParams();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const receive = async () => {
    setBusy(true);
    setErr('');
    try {
      await api.patch(`/dispatches/${p.id}/receive`, {});
      location.reload();
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Unable to confirm receipt.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <DetailPage
        title="Dispatch Details"
        endpoint={`/dispatches/${p.id}`}
        fields={[
          { key: 'asset.tag_no', label: 'Asset Tag' },
          { key: 'asset.model', label: 'Asset Model' },
          { key: 'source_location', label: 'Source' },
          { key: 'destination_branch.branch_name', label: 'Destination Branch' },
          { key: 'receiver_name', label: 'Receiver' },
          { key: 'receiver_id', label: 'Receiver Employee ID' },
          { key: 'receiver_phone', label: 'Phone' },
          { key: 'status', label: 'Status', badge: true },
          { key: 'dispatched_date', label: 'Dispatched' },
        ]}
      />
      {err && <div className="alert" style={{ marginTop: 16 }}>{err}</div>}
      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary" disabled={busy} onClick={receive}>
          {busy ? 'Confirming...' : 'Confirm Receipt'}
        </button>
      </div>
    </DashboardLayout>
  );
}
