'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FormShell from '@/components/ui/FormShell';
import { useParams } from 'next/navigation';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function EditAssetType() {
  useRoleGuard(['ADMIN']);
  const p = useParams();
  return (
    <DashboardLayout>
      <FormShell
        title="Edit Asset Type"
        description="Update the name and description of this asset category."
        endpoint={`/asset-types/${p.id}`}
        method="patch"
        fields={[
          { name: 'type_name', label: 'Type name', required: true },
          { name: 'description', label: 'Description', type: 'textarea', span2: true },
        ]}
      />
    </DashboardLayout>
  );
}
