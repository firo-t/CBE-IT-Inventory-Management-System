
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
        description="Manage the categories and types used to classify inventory assets."
        endpoint="/asset-types"
        createHref="/asset-types/create"
        searchPlaceholder="Search asset types..."
        columns={[
          { key: 'type_name', label: 'Type Name' },
          { key: 'description', label: 'Description' },
        ]}
      />
    </DashboardLayout>
  );
}

