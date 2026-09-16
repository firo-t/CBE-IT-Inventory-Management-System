
'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import CrudPage from '@/components/ui/CrudPage';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function AssetTypes() {
  useRoleGuard(['ADMIN']);
  return (
    <DashboardLayout>
      <CrudPage
        title="Asset Types"
        description="Manage categories and types of assets."
        endpoint="/asset-types"
        createHref="/asset-types/create"
        searchPlaceholder="Search asset type or description..."
        columns={[
          { key: 'type_name', label: 'Type Name' },
          { key: 'description', label: 'Description' },
        ]}
      />
    </DashboardLayout>
  );
}

