'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CrudPage from '@/components/ui/CrudPage';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function Branches() {
  useRoleGuard(['ADMIN']);
  return (
    <DashboardLayout>
      <CrudPage
        title="Branches"
        description="Manage bank branches and locations."
        endpoint="/branches"
        createHref="/branches/create"
        searchPlaceholder="Search by branch name, code, or location..."
        columns={[
          { key: 'branch_code', label: 'Code' },
          { key: 'branch_name', label: 'Branch' },
          { key: 'location', label: 'Location' },
          { key: 'contact_person', label: 'Contact' },
          { key: 'phone', label: 'Phone' },
        ]}
      />
    </DashboardLayout>
  );
}

