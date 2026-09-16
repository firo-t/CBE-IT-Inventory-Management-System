'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FormShell from '@/components/ui/FormShell';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function EditBranch() {
  useRoleGuard(['ADMIN']);
  const p = useParams();
  const [users, setUsers] = useState([]);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get(`/branches/${p.id}`)
    ]).then(([usersRes, branchRes]) => {
      setUsers(usersRes.data.map((x: any) => ({ value: x.user_id, label: `${x.full_name} (${x.employee_id})` })));
      setInitialData(branchRes.data);
      setLoading(false);
    }).catch(console.error);
  }, [p.id]);

  if (loading) return <DashboardLayout><div style={{ padding: 20 }}>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <FormShell
        title="Edit Branch"
        description="Update branch information."
        endpoint={`/branches/${p.id}`}
        method="patch"
        initial={initialData}
        fields={[
          { name: 'branch_code', label: 'Branch code', required: true },
          { name: 'branch_name', label: 'Branch name', required: true },
          { name: 'location', label: 'Location' },
          { name: 'manager_id', label: 'Manager', type: 'select', options: users },
          { name: 'contact_person', label: 'Contact person' },
          { name: 'phone', label: 'Phone' },
        ]}
      />
    </DashboardLayout>
  );
}
