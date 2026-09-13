'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DetailPage from '@/components/ui/DetailPage';
import AttachmentPanel from '@/components/ui/AttachmentPanel';
import { can } from '@/lib/permissions';

export default function AssetDetail() {
  const p = useParams();
  const id = p.id as string;

  return (
    <DashboardLayout>
      <DetailPage
        title="Asset Details"
        endpoint={`/assets/${id}`}
        fields={[
          { key: 'tag_no', label: 'CBE Tag No.' },
          { key: 'serial_no', label: 'Serial No.' },
          { key: 'asset_type.type_name', label: 'Asset Type' },
          { key: 'model', label: 'Model' },
          { key: 'ws_no', label: 'WS Number' },
          { key: 'condition', label: 'Condition' },
          { key: 'status', label: 'Status', badge: true },
          { key: 'current_branch.branch_name', label: 'Current Branch' },
          { key: 'description', label: 'Description' },
          { key: 'created_at', label: 'Registered On' },
        ]}
      />
      <AttachmentPanel
        assetId={id}
        canUpload={can('attachments', 'create')}
        canDelete={can('attachments', 'create')}
      />
    </DashboardLayout>
  );
}
