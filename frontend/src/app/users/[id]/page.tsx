'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DetailPage from '@/components/ui/DetailPage';
import { useParams } from 'next/navigation';

export default function UserDetail() {
  const p = useParams();
  return (
    <DashboardLayout>
      <DetailPage
        title="User Details"
        endpoint={`/users/${p.id}`}
        fields={[
          { key: 'user_id', label: 'User ID' },
          { key: 'full_name', label: 'Full Name' },
          { key: 'employee_id', label: 'Employee ID' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'role.role_name', label: 'Role' },
          { key: 'branch.branch_name', label: 'Branch' },
          { key: 'status', label: 'Status', badge: true },
          { key: 'created_at', label: 'Created At' },
        ]}
      />
    </DashboardLayout>
  );
}
