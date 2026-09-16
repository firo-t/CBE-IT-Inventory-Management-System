'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FormShell from '@/components/ui/FormShell';
import { api } from '@/lib/api';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function Create() {
  useRoleGuard(['ADMIN']);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    api.get('/roles').then(res => {
      setRoles(res.data.map((x:any) => ({ value: x.role_id, label: x.role_name })));
    }).catch(console.error);
    
    api.get('/branches').then(res => {
      setBranches(res.data.map((x:any) => ({ value: x.branch_id, label: x.branch_name })));
    }).catch(console.error);
  }, []);

  return (
    <DashboardLayout>
      <FormShell 
        title="Create User" 
        description="Create a system account and assign a role." 
        endpoint="/users" 
        fields={[
          {name:'full_name',label:'Full name',required:true},
          {name:'employee_id',label:'Employee ID',required:true},
          {name:'email',label:'Email',type:'email',required:true},
          {name:'password',label:'Temporary password',type:'password',required:true},
          {name:'role_id',label:'Role',required:true, type: 'select', options: roles},
          {name:'phone',label:'Phone'},
          {name:'branch_id',label:'Branch', type: 'select', options: branches}
        ]}
      />
    </DashboardLayout>
  );
}
