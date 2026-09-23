'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';
import { Bell } from 'lucide-react';

const formatDate = (iso: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export default function Notifications() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/notifications')
      .then(r => {
        const d = r.data;
        setItems(Array.isArray(d) ? d : (d?.data || d?.items || []));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const read = async (id: any) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const all = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  const unreadCount = items.filter(n => !n.is_read).length;

  return (
    <DashboardLayout>
      <Page
        title="Notifications"
        description="System alerts for assignments, dispatches and maintenance."
        action={
          unreadCount > 0 ? (
            <button className="btn btn-secondary" onClick={all}>
              Mark all as read ({unreadCount})
            </button>
          ) : null
        }
      >
        <div className="card">
          {loading ? (
            <div className="empty">Loading...</div>
          ) : items.length === 0 ? (
            <div className="empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '40px 0' }}>
              <Bell size={32} style={{ opacity: 0.3 }} />
              <span>No notifications yet.</span>
            </div>
          ) : (
            items.map((n, i) => (
              <div
                className="activity"
                key={n.notification_id || n.id || i}
                style={{
                  opacity: n.is_read ? 0.65 : 1,
                  borderLeft: n.is_read ? undefined : '3px solid var(--primary, #2563eb)',
                  paddingLeft: n.is_read ? undefined : 13,
                }}
              >
                <span className="dot" style={{ background: n.is_read ? undefined : 'var(--primary, #2563eb)' }} />
                <div style={{ flex: 1 }}>
                  <b>{n.title || n.type || 'Notification'}</b>
                  <div className="muted" style={{ marginTop: 2 }}>{n.message || n.description || ''}</div>
                  <div className="muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                    {formatDate(n.created_at || n.createdAt)}
                  </div>
                </div>
                {!n.is_read && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => read(n.notification_id || n.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </Page>
    </DashboardLayout>
  );
}
