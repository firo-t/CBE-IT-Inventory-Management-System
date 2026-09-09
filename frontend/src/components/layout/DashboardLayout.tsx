'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  ClipboardList,
  Truck,
  Wrench,
  BarChart3,
  Bell,
  FileClock,
  Settings,
  Menu,
  X,
  LogOut,
  Boxes,
  ShieldCheck,
} from 'lucide-react';

import { getUser, logout } from '@/lib/auth';

const items = [
  ['/dashboard', 'Dashboard', LayoutDashboard, 'all'],
  ['/assets', 'Assets', Package, 'all'],
  ['/asset-types', 'Asset Types', Boxes, 'admin'],
  ['/users', 'Users', Users, 'admin'],
  ['/branches', 'Branches', Building2, 'admin'],
  ['/assignments', 'Assignments', ClipboardList, 'all'],
  ['/dispatches', 'Dispatch', Truck, 'all'],
  ['/maintenance', 'Maintenance', Wrench, 'all'],
  ['/reports', 'Reports', BarChart3, 'all'],
  ['/notifications', 'Notifications', Bell, 'all'],
  ['/audit-logs', 'Audit Logs', FileClock, 'admin'],
  ['/settings', 'Settings', Settings, 'all'],
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!getUser() && !localStorage.getItem('cbe_access_token')) {
      location.href = '/login';
    }

    // On desktop, sidebar starts open.
    if (window.innerWidth > 760) {
      setOpen(true);
    }
  }, []);

  const path = usePathname();
  const u = getUser();

  const role = (u?.role || '').toLowerCase();

  const allowed = (permission: string) =>
    permission === 'all' ||
    permission
      .split(',')
      .some((x) => role.includes(x));

  return (
    <div className={`shell ${open ? 'sidebar-open' : 'sidebar-collapsed'}`}>

      {/* SIDEBAR */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>

        <div className="brand">
          <div className="logo">C</div>

          <div>
            <div>CBE INVENTORY</div>
            <div className="muted">Management System</div>
          </div>
        </div>

        <nav className="nav">

          <div className="nav-title">
            Workspace
          </div>

          {items
            .filter((item) => allowed(item[3] as string))
            .map(([href, label, Icon]) => (
              <Link
                key={href as string}
                href={href as string}
                className={
                  path === href ||
                  path.startsWith(`${href}/`)
                    ? 'active'
                    : ''
                }
                onClick={() => {
                  // Close sidebar automatically on mobile
                  if (window.innerWidth <= 760) {
                    setOpen(false);
                  }
                }}
              >
                <Icon size={17} />
                {label as string}
              </Link>
            ))}
        </nav>

        <div
          style={{
            padding: 12,
            marginTop: 'auto',
          }}
        >
          <button
            className="btn btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
            }}
            onClick={logout}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">

        {/* TOP BAR */}
        <header className="topbar">

          <button
            className="btn btn-secondary mobile-menu"
            onClick={() => setOpen((current) => !current)}
            aria-label="Toggle sidebar"
          >
            {open ? (
              <X size={18} />
            ) : (
              <Menu size={18} />
            )}
          </button>

          <div>
            <strong>
              {u?.fullName || 'CBE User'}
            </strong>

            <span className="muted">
              {' · '}
              {u?.role || 'User'}
            </span>
          </div>

          <div className="actions">
            <Link
              className="btn btn-secondary"
              href="/notifications"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </Link>
          </div>

        </header>

        {/* PAGE CONTENT */}
        <section className="content">
          {children}
        </section>

      </main>
    </div>
  );
}

