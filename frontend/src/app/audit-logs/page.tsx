'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CrudPage from '@/components/ui/CrudPage';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function Audit() {
  useRoleGuard(['ADMIN']);
  return (
    <DashboardLayout>
      <CrudPage
        title="Audit Logs"
        description="View system activity and history."
        endpoint="/audit-logs"
        searchPlaceholder="Search by action or entity ID..."
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'user_id', label: 'User' },
          { key: 'action', label: 'Action' },
          { key: 'entity_type', label: 'Entity' },
          { key: 'entity_id', label: 'Entity ID' },
          { key: 'created_at', label: 'Date' },
        ]}
      />
    </DashboardLayout>
  );
}

