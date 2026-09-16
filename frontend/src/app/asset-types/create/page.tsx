'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import FormShell from '@/components/ui/FormShell';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function Create() {
  useRoleGuard(['ADMIN']);
  return (
    <DashboardLayout>
      <FormShell
        title="Create Asset Type"
        description="Add a new category for inventory assets."
        endpoint="/asset-types"
        fields={[
          {
            name: 'type_name',
            label: 'Type name',
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            span2: true,
          },
        ]}
      />
    </DashboardLayout>
  );
}