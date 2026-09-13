'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function EditBranch() {
  const params = useParams();
  const router = useRouter();

  const [f, setF] = useState({
    branch_code: '',
    branch_name: '',
    manager_id: '',
    contact_person: '',
    phone: '',
    location: '',
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get(`/branches/${params.id}`)
      .then((res) => {
        const b = res.data;

        setF({
          branch_code: b.branch_code || '',
          branch_name: b.branch_name || '',
          manager_id: b.manager_id || '',
          contact_person: b.contact_person || '',
          phone: b.phone || '',
          location: b.location || '',
        });
      })
      .catch((e) => {
        setErr(e.response?.data?.message || 'Unable to load branch.');
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      await api.patch(`/branches/${params.id}`, {
        branch_code: f.branch_code,
        branch_name: f.branch_name,
        manager_id: f.manager_id || undefined,
        contact_person: f.contact_person || undefined,
        phone: f.phone || undefined,
        location: f.location || undefined,
      });

      router.push('/branches');
    } catch (e: any) {
      setErr(
        e.response?.data?.message ||
          'Could not update branch. Check the entered values.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Page title="Edit Branch" description="Update branch information.">
          <div className="card">Loading...</div>
        </Page>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Page title="Edit Branch" description="Update branch information.">
        <div className="card">
          <form onSubmit={submit} className="form-grid">
            <div className="field">
              <label>Branch code *</label>
              <input
                className="input"
                required
                value={f.branch_code}
                onChange={(e) =>
                  setF({ ...f, branch_code: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Branch name *</label>
              <input
                className="input"
                required
                value={f.branch_name}
                onChange={(e) =>
                  setF({ ...f, branch_name: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Manager ID</label>
              <input
                className="input"
                value={f.manager_id}
                onChange={(e) =>
                  setF({ ...f, manager_id: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Contact person</label>
              <input
                className="input"
                value={f.contact_person}
                onChange={(e) =>
                  setF({ ...f, contact_person: e.target.value })
                }
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
              <label>Location</label>
              <input
                className="input"
                value={f.location}
                onChange={(e) => setF({ ...f, location: e.target.value })}
              />
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
