'use client';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { BarChart3, Package, Wrench, Truck, ClipboardList } from 'lucide-react';

const REPORTS = [
  {
    href: '/reports/inventory',
    title: 'Inventory Report',
    desc: 'View total assets, filter by branch, type, status or condition. Export to PDF or Excel.',
    icon: Package,
  },
  {
    href: '/reports/maintenance',
    title: 'Maintenance Report',
    desc: 'Review all maintenance requests by status, priority, branch or technician. Export.',
    icon: Wrench,
  },
  {
    href: '/reports/movement',
    title: 'Dispatch Report',
    desc: 'Track all equipment dispatches, their status, source and destination. Export.',
    icon: Truck,
  },
  {
    href: '/reports/assignments',
    title: 'Assignment Report',
    desc: 'Review all asset assignments, active and returned, by branch or status. Export.',
    icon: ClipboardList,
  },
];

export default function Reports() {
  return (
    <DashboardLayout>
      <Page
        title="Reports"
        description="Inventory, assignment, dispatch and maintenance reports with PDF and Excel export."
      >
        <div className="grid grid2">
          {REPORTS.map(x => (
            <Link className="card" href={x.href} key={x.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <x.icon size={20} />
                <h2 className="section-title" style={{ margin: 0 }}>{x.title}</h2>
              </div>
              <div className="muted">{x.desc}</div>
            </Link>
          ))}
        </div>
      </Page>
    </DashboardLayout>
  );
}