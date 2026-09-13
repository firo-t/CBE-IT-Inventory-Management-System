'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import { api } from '@/lib/api';

export default function EditAssetType() {
  const params = useParams();
  const router = useRouter();

  const [f, setF] = useState({
    type_name: '',
    description: '',
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get(`/asset-types/${params.id}`)
      .then((res) => {
        const a = res.data;

        setF({
          type_name: a.type_name || '',
          description: a.description || '',
        });
      })
      .catch((e) => {
        setErr(e.response?.data?.message || 'Unable to load asset type.');
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      await api.patch(`/asset-types/${params.id}`, {
        type_name: f.type_name,
        description: f.description || undefined,
      });

      router.push('/asset-types');
    } catch (e: any) {
      setErr(
        e.response?.data?.message ||
          'Could not update asset type. Check the entered values.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Page
          title="Edit Asset Type"
          description="Update asset type information."
        >
          <div className="card">Loading...</div>
        </Page>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Page
        title="Edit Asset Type"
        description="Update asset type information."
      >
        <div className="card">
          <form onSubmit={submit} className="form-grid">
            <div className="field">
              <label>Type name *</label>
              <input
                className="input"
                required
                value={f.type_name}
                onChange={(e) =>
                  setF({ ...f, type_name: e.target.value })
                }
              />
            </div>

            <div className="field span2">
              <label>Description</label>
              <textarea
                className="textarea"
                rows={5}
                value={f.description}
                onChange={(e) =>
                  setF({ ...f, description: e.target.value })
                }
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
