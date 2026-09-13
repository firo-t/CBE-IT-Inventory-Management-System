'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DetailPage from '@/components/ui/DetailPage';
import { useParams } from 'next/navigation';

export default function BranchDetail() {
  const p = useParams();
  return (
    <DashboardLayout>
      <DetailPage
        title="Branch Details"
        endpoint={`/branches/${p.id}`}
        fields={[
          { key: 'branch_id', label: 'Branch ID' },
          { key: 'branch_code', label: 'Branch Code' },
          { key: 'branch_name', label: 'Branch Name' },
          { key: 'location', label: 'Location' },
          { key: 'contact_person', label: 'Contact Person' },
          { key: 'phone', label: 'Phone' },
          { key: 'manager.full_name', label: 'Manager' },
        ]}
      />
    </DashboardLayout>
  );
}
