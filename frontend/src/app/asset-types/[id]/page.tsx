'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DetailPage from '@/components/ui/DetailPage';
import { useParams } from 'next/navigation';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function AssetTypeDetail() {
  useRoleGuard(['ADMIN']);
  const p = useParams();
  return (
    <DashboardLayout>
      <DetailPage
        title="Asset Type Details"
        endpoint={`/asset-types/${p.id}`}
        fields={[
          { key: 'type_name', label: 'Type Name' },
          { key: 'description', label: 'Description' },
        ]}
      />
    </DashboardLayout>
  );
}
