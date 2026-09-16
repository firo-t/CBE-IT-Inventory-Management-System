'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { getUser } from '@/lib/auth';
import { api } from '@/lib/api';

export default function Settings() {
  const u = getUser();
  const r = useRouter();

  return (
    <DashboardLayout>
      <Page title="Settings" description="View your account information and system details.">
        <div className="grid grid2">

          {/* Account Info */}
          <div className="card">
            <h2 className="section-title">My Account</h2>
            <div className="detail-grid">
              {[
                ['Full Name', u?.fullName],
                ['Email', u?.email],
                ['Role', u?.role],
                ['Employee ID', u?.employeeId],
              ].map(([label, value]) => (
                <div className="kv" key={label as string}>
                  <small>{label as string}</small>
                  <b>{(value as string) || '—'}</b>
                </div>
              ))}
            </div>
          </div>


          {/* System Info */}
          <div className="card">
            <h2 className="section-title">System Information</h2>
            <div className="detail-grid">
              {[
                ['System', 'CBE IT Hardware Inventory Management System'],
                ['Organization', 'Commercial Bank of Ethiopia (CBE)'],
                ['Backend URL', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'],
                ['Version', '1.0.0 (Internship Release)'],
              ].map(([label, value]) => (
                <div className="kv" key={label as string}>
                  <small>{label as string}</small>
                  <b style={{ wordBreak: 'break-all' }}>{(value as string) || '—'}</b>
                </div>
              ))}
            </div>
          </div>

        </div>
      </Page>
    </DashboardLayout>
  );
}
