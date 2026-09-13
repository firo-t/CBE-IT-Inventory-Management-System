'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FormShell from '@/components/ui/FormShell';
import { api } from '@/lib/api';

const ASSET_STATUSES = [
  'AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'UNDER_MAINTENANCE', 
  'DAMAGED', 'LOST', 'DISPOSED', 'RETIRED'
];

export default function Create() {
  const [assetTypes, setAssetTypes] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    api.get('/asset-types').then(res => {
      setAssetTypes(res.data.map((x:any) => ({ value: x.asset_type_id, label: x.type_name })));
    }).catch(console.error);
    
    api.get('/branches').then(res => {
      setBranches(res.data.map((x:any) => ({ value: x.branch_id, label: x.branch_name })));
    }).catch(console.error);
  }, []);

  return (
    <DashboardLayout>
      <FormShell 
        title="Register Asset" 
        description="Add a new inventory asset." 
        endpoint="/assets" 
        fields={[
          {name:'tag_no',label:'Tag number',required:true},
          {name:'asset_type_id',label:'Asset type',required:true, type: 'select', options: assetTypes},
          {name:'serial_no',label:'Serial number'},
          {name:'model',label:'Model'},
          {name:'ws_no',label:'WS number'},
          {name:'condition',label:'Condition'},
          {name:'status',label:'Status', type: 'select', options: ASSET_STATUSES},
          {name:'current_branch_id',label:'Current branch', type: 'select', options: branches},
          {name:'description',label:'Description',type:'textarea',span2:true}
        ]}
      />
    </DashboardLayout>
  );
}
