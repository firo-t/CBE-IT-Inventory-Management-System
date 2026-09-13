'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FormShell from '@/components/ui/FormShell';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

const ASSET_STATUSES = [
  'AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'UNDER_MAINTENANCE', 
  'DAMAGED', 'LOST', 'DISPOSED', 'RETIRED'
];

export default function Edit() {
  const p = useParams();
  const [assetTypes, setAssetTypes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/asset-types'),
      api.get('/branches'),
      api.get(`/assets/${p.id}`)
    ]).then(([typesRes, branchesRes, assetRes]) => {
      setAssetTypes(typesRes.data.map((x:any) => ({ value: x.asset_type_id, label: x.type_name })));
      setBranches(branchesRes.data.map((x:any) => ({ value: x.branch_id, label: x.branch_name })));
      setInitialData(assetRes.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setError('Failed to load asset data.');
      setLoading(false);
    });
  }, [p.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: 20 }}>Loading asset data...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ padding: 20, color: 'red' }}>{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <FormShell 
        title="Edit Asset" 
        description="Update asset information." 
        endpoint={`/assets/${p.id}`} 
        method="patch" 
        initial={initialData}
        fields={[
          {name:'tag_no',label:'Tag number'},
          {name:'asset_type_id',label:'Asset type', type: 'select', options: assetTypes},
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
