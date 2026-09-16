'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FormShell from '@/components/ui/FormShell';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

const ASSET_STATUSES = [
  'DAMAGED', 'LOST', 'DISPOSED', 'RETIRED'
];

export default function UpdateStatus() {
  const p = useParams();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/assets/${p.id}`)
      .then(res => {
        setInitialData({
          status: res.data.status,
          description: '' // Optional notes for the status change
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load asset status.');
        setLoading(false);
      });
  }, [p.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: 20 }}>Loading asset status...</div>
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
        title="Update Asset Status" 
        description="Quickly update the operational status of this asset."
        endpoint={`/assets/${p.id}/status`} 
        method="patch" 
        initial={initialData}
        fields={[
          {name:'status',label:'Status',required:true, type: 'select', options: ASSET_STATUSES},
          {name:'description',label:'Status notes (optional)',type:'textarea',span2:true}
        ]}
      />
    </DashboardLayout>
  );
}
