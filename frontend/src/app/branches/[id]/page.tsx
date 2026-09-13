'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import DetailPage from '@/components/ui/DetailPage';
import { useParams } from 'next/navigation';

export default function BranchDetails() {
  const params = useParams();

  return (
    <DashboardLayout>
      <DetailPage
        title="Branch Details"
        endpoint={`/branches/${params.id}`}
        fields={[
          { key: 'branch_code', label: 'Branch code' },
          { key: 'branch_name', label: 'Branch name' },
          { key: 'manager_id', label: 'Manager ID' },
          { key: 'contact_person', label: 'Contact person' },
          { key: 'phone', label: 'Phone' },
          { key: 'location', label: 'Location' },
        ]}
      />
    </DashboardLayout>
  );
}
