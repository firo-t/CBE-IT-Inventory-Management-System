'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FormShell from '@/components/ui/FormShell';
import { api } from '@/lib/api';

export default function Create() {
  const [assets, setAssets] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    api.get('/assets').then(res => {
      setAssets(res.data.map((x:any) => ({ value: x.asset_id, label: `${x.tag_no} - ${x.model || 'Unknown Model'}` })));
    }).catch(console.error);

    api.get('/branches').then(res => {
      setBranches(res.data.map((x:any) => ({ value: x.branch_id, label: x.branch_name })));
    }).catch(console.error);
  }, []);

  return (
    <DashboardLayout>
      <FormShell 
        title="Create Dispatch" 
        description="Move an asset to another branch." 
        endpoint="/dispatches" 
        fields={[
          {name:'asset_id',label:'Asset',required:true, type: 'select', options: assets},
          {name:'source_location',label:'Source location',required:true},
          {name:'destination_branch_id',label:'Destination branch',required:true, type: 'select', options: branches},
          {name:'receiver_name',label:'Receiver name',required:true},
          {name:'receiver_id',label:'Receiver ID',required:true},
          {name:'receiver_phone',label:'Receiver phone',required:true},
          {name:'dispatched_date',label:'Dispatch date',type:'date'}
        ]}
      />
    </DashboardLayout>
  );
}
