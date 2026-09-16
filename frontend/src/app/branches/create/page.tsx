'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FormShell from '@/components/ui/FormShell';
import { api } from '@/lib/api';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function Create() {
  useRoleGuard(['ADMIN']);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/users').then(res => {
      setUsers(res.data.map((x:any) => ({ value: x.user_id, label: `${x.full_name} (${x.employee_id})` })));
    }).catch(console.error);
  }, []);

  return (
    <DashboardLayout>
      <FormShell 
        title="Create Branch" 
        description="Register a CBE branch." 
        endpoint="/branches" 
        fields={[
          {name:'branch_code',label:'Branch code',required:true},
          {name:'branch_name',label:'Branch name',required:true},
          {name:'location',label:'Location'},
          {name:'manager_id',label:'Manager', type: 'select', options: users},
          {name:'contact_person',label:'Contact person'},
          {name:'phone',label:'Phone'}
        ]}
      />
    </DashboardLayout>
  );
}
