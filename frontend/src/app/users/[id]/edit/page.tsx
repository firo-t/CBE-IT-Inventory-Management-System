'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function EditUser() {
  const params = useParams();
  const router = useRouter();

  const [f, setF] = useState({
    full_name: '',
    employee_id: '',
    email: '',
    phone: '',
    role_id: '',
    branch_id: '',
    status: 'ACTIVE',
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get(`/users/${params.id}`)
      .then((res) => {
        const u = res.data;

        setF({
          full_name: u.full_name || '',
          employee_id: u.employee_id || '',
          email: u.email || '',
          phone: u.phone || '',
          role_id: u.role_id || '',
          branch_id: u.branch_id || '',
          status: u.status || 'ACTIVE',
        });
      })
      .catch((e) => {
        setErr(e.response?.data?.message || 'Unable to load user.');
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      await api.patch(`/users/${params.id}`, {
        ...f,
        phone: f.phone || undefined,
        branch_id: f.branch_id || undefined,
      });

      router.push('/users');
    } catch (e: any) {
      setErr(
        e.response?.data?.message ||
          'Could not update user. Check the entered values.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Page title="Edit User" description="Update system account information.">
          <div className="card">Loading...</div>
        </Page>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Page title="Edit User" description="Update system account information.">
        <div className="card">
          <form onSubmit={submit} className="form-grid">
            <div className="field">
              <label>Full name *</label>
              <input
                className="input"
                required
                value={f.full_name}
                onChange={(e) => setF({ ...f, full_name: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Employee ID *</label>
              <input
                className="input"
                required
                value={f.employee_id}
                onChange={(e) => setF({ ...f, employee_id: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Email *</label>
              <input
                className="input"
                type="email"
                required
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Phone</label>
              <input
                className="input"
                value={f.phone}
                onChange={(e) => setF({ ...f, phone: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Role ID *</label>
              <input
                className="input"
                required
                value={f.role_id}
                onChange={(e) => setF({ ...f, role_id: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Branch ID</label>
              <input
                className="input"
                value={f.branch_id}
                onChange={(e) => setF({ ...f, branch_id: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Status</label>
              <select
                className="select"
                value={f.status}
                onChange={(e) => setF({ ...f, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            {err && <div className="error span2">{err}</div>}

            <div className="actions span2">
              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary"
              >
                {busy ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.back()}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Page>
    </DashboardLayout>
  );
}
