'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import Stat from '@/components/ui/Stat';
import {
  Package, Building2, Users, CheckCircle, Truck, Wrench,
  AlertTriangle, Activity, ClipboardCheck, Clock,
  ArrowRight,
} from 'lucide-react';
import { getUser } from '@/lib/auth';
import Link from 'next/link';

const roleName = (u: any) => u?.role || '';

/* Maps each role to a set of quick-action links shown in the left card */
const quickLinks: Record<string, { label: string; href: string }[]> = {
  'System Administrator / Admin': [
    { label: 'Manage Users', href: '/users' },
    { label: 'Manage Branches', href: '/branches' },
    { label: 'Asset Types', href: '/asset-types' },
    { label: 'View Audit Logs', href: '/audit-logs' },
    { label: 'Generate Reports', href: '/reports' },
  ],
  'IT Inventory Officer': [
    { label: 'Register New Asset', href: '/assets/create' },
    { label: 'Create Dispatch', href: '/dispatches/create' },
    { label: 'Assign Asset', href: '/assignments/create' },
    { label: 'Browse Inventory', href: '/assets' },
    { label: 'View Dispatches', href: '/dispatches' },
  ],
  'Hardware Technician': [
    { label: 'My Maintenance Tasks', href: '/maintenance/requests' },
    { label: 'Add Maintenance Record', href: '/maintenance/requests' },
    { label: 'View All Assets', href: '/assets' },
    { label: 'My Notifications', href: '/notifications' },
  ],
  'Branch Manager': [
    { label: 'Report Hardware Problem', href: '/maintenance/requests/create' },
    { label: 'Receive Dispatches', href: '/dispatches' },
    { label: 'View Branch Assets', href: '/assets' },
    { label: 'My Notifications', href: '/notifications' },
  ],
};

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const u = getUser();

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setD(r.data))
      .catch(e => setErr(e.response?.data?.message || 'Unable to load dashboard.'));
  }, []);

  const s = d?.summary || {};
  const recent = d?.recent || {};
  const role = roleName(u);

  let stats: any[] = [];
  let activity: any[] = [];

  if (role === 'System Administrator / Admin') {
    stats = [
      ['Total Assets', s.totalAssets, Package],
      ['Total Branches', s.totalBranches, Building2],
      ['Total Users', s.totalUsers, Users],
      ['Available Assets', s.availableAssets, CheckCircle],
      ['Assigned Assets', s.assignedAssets, Package],
      ['Damaged Assets', s.damagedAssets, AlertTriangle],
      ['Active Maintenance', Object.entries(s.maintenanceStats || {})
        .filter(([k]) => !['COMPLETED', 'CLOSED'].includes(k))
        .reduce((a, [_k, v]) => a + Number(v), 0), Wrench],
    ];
    activity = recent.recentActivities || [];
  } else if (role === 'IT Inventory Officer') {
    stats = [
      ['Available Assets', s.availableAssets, CheckCircle],
      ['Assigned Assets', s.assignedAssets, Package],
      ['Pending Dispatches', s.pendingDispatches, Truck],
      ['Active Maintenance', s.activeMaintenance, Wrench],
    ];
    activity = [...(recent.recentDispatchedAssets || []), ...(recent.recentReceivedAssets || [])].slice(0, 8);
  } else if (role === 'Hardware Technician') {
    stats = [
      ['Assigned Requests', s.assignedRequests, ClipboardCheck],
      ['Pending Inspection', s.pendingInspections, Clock],
      ['Under Repair', s.underRepair, Wrench],
      ['Waiting for Parts', s.waitingForParts, Package],
      ['Completed', s.completedMaintenance, CheckCircle],
    ];
    activity = recent.recentAssignedRequests || [];
  } else {
    stats = [
      ['Branch Assets', s.branchTotalAssets, Package],
      ['Assigned Equipment', s.branchAssignedAssets, ClipboardCheck],
      ['In Transit', s.pendingInTransit, Truck],
      ['Maintenance Requests', s.branchMaintenanceRequests, Wrench],
    ];
    activity = recent.recentBranchMaintenance || [];
  }

  const links = quickLinks[role] || [];

  return (
    <DashboardLayout>
      <Page title="Dashboard" description={`${role || 'User'} — operational overview`}>
        {err && <div className="alert" style={{ marginBottom: 16 }}>{err}</div>}

        {/* STAT CARDS */}
        <div className="grid grid4">
          {stats.map(([l, v, I]) => (
            <Stat key={l} label={l} value={v ?? '—'} icon={I} />
          ))}
        </div>

        <div className="grid grid2" style={{ marginTop: 18 }}>

          {/* QUICK ACTIONS */}
          <div className="card">
            <h2 className="section-title">Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {links.map(link => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--surface, #f9fafb)',
                    border: '1px solid var(--border, #e5e7eb)',
                    color: 'inherit',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover, #f3f4f6)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface, #f9fafb)')}
                >
                  {link.label}
                  <ArrowRight size={14} style={{ opacity: 0.5 }} />
                </Link>
              ))}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="card">
            <h2 className="section-title">
              <Activity size={17} style={{ verticalAlign: 'middle' }} /> Recent Activity
            </h2>
            {activity.slice(0, 7).map((x: any, i: number) => (
              <div className="activity" key={i}>
                <span className="dot" />
                <div>
                  <b>{x.action || x.title || x.status || x.asset?.tag_no || 'Activity'}</b>
                  <div className="muted">
                    {x.message || x.problem_description || x.created_at || x.reported_date || x.dispatched_date || ''}
                  </div>
                </div>
              </div>
            ))}
            {!activity.length && <div className="empty">No recent activity.</div>}
          </div>

        </div>
      </Page>
    </DashboardLayout>
  );
}
