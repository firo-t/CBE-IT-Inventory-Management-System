'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import DetailPage from '@/components/ui/DetailPage';
import { useParams } from 'next/navigation';

export default function AssetTypeDetails() {
  const params = useParams();

  return (
    <DashboardLayout>
      <DetailPage
        title="Asset Type Details"
        endpoint={`/asset-types/${params.id}`}
        fields={[
          { key: 'type_name', label: 'Type name' },
          { key: 'description', label: 'Description' },
          { key: 'created_at', label: 'Created at' },
          { key: 'updated_at', label: 'Updated at' },
        ]}
      />
    </DashboardLayout>
  );
}
