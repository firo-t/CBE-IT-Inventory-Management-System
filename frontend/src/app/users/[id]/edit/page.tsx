'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FormShell from '@/components/ui/FormShell';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function EditUser() {
  const p = useParams();
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/roles'),
      api.get('/branches'),
      api.get(`/users/${p.id}`)
    ]).then(([rolesRes, branchesRes, userRes]) => {
      setRoles(rolesRes.data.map((x: any) => ({ value: x.role_id, label: x.role_name })));
      setBranches(branchesRes.data.map((x: any) => ({ value: x.branch_id, label: x.branch_name })));
      setInitialData(userRes.data);
      setLoading(false);
    }).catch(console.error);
  }, [p.id]);

  if (loading) return <DashboardLayout><div style={{ padding: 20 }}>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <FormShell
        title="Edit User"
        description="Update user account information."
        endpoint={`/users/${p.id}`}
        method="patch"
        initial={initialData}
        fields={[
          { name: 'full_name', label: 'Full name' },
          { name: 'employee_id', label: 'Employee ID' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone' },
          { name: 'role_id', label: 'Role', type: 'select', options: roles },
          { name: 'branch_id', label: 'Branch', type: 'select', options: branches },
        ]}
      />
    </DashboardLayout>
  );
}
