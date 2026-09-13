'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FormShell from '@/components/ui/FormShell';
import { api } from '@/lib/api';

export default function Create() {
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    api.get('/assets').then(res => {
      setAssets(res.data.map((x:any) => ({ value: x.asset_id, label: `${x.tag_no} - ${x.model || 'Unknown Model'}` })));
    }).catch(console.error);

    api.get('/users').then(res => {
      setUsers(res.data.map((x:any) => ({ value: x.user_id, label: `${x.full_name} (${x.employee_id})` })));
    }).catch(console.error);
    
    api.get('/branches').then(res => {
      setBranches(res.data.map((x:any) => ({ value: x.branch_id, label: x.branch_name })));
    }).catch(console.error);
  }, []);

  return (
    <DashboardLayout>
      <FormShell 
        title="Assign Asset" 
        description="Assign an AVAILABLE asset to an employee." 
        endpoint="/assignments" 
        fields={[
          {name:'asset_id',label:'Asset',required:true, type: 'select', options: assets},
          {name:'employee_id',label:'Employee',required:true, type: 'select', options: users},
          {name:'employee_name',label:'Employee name',required:true},
          {name:'branch_id',label:'Branch',required:true, type: 'select', options: branches},
          {name:'assigned_date',label:'Assigned date',type:'date'}
        ]}
      />
    </DashboardLayout>
  );
}
