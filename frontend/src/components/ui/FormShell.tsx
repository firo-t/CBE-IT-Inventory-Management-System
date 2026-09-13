'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Page from './Page';

export default function FormShell({
  title,
  description,
  endpoint,
  fields,
  initial = {},
  method = 'post',
}: any) {
  const r = useRouter();
  const [f, setF] = useState<any>(initial);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      if (method.toLowerCase() === 'patch') {
        await api.patch(endpoint, f);
      } else if (method.toLowerCase() === 'put') {
        await api.put(endpoint, f);
      } else {
        await api.post(endpoint, f);
      }

      r.back();
    } catch (x: any) {
      setErr(
        x.response?.data?.message ||
          'Request failed. Check the entered values and backend API.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title={title} description={description}>
      <div className="card">
        <form onSubmit={submit} className="form-grid">
          {fields.map((x: any) => (
            <div
              className={'field ' + (x.span2 ? 'span2' : '')}
              key={x.name}
            >
              <label>
                {x.label}
                {x.required ? ' *' : ''}
              </label>

              {x.type === 'textarea' ? (
                <textarea
                  rows={5}
                  className="textarea"
                  required={x.required}
                  value={f[x.name] || ''}
                  onChange={(e) =>
                    setF({ ...f, [x.name]: e.target.value })
                  }
                />
              ) : x.type === 'select' ? (
                <select
                  className="select"
                  required={x.required}
                  value={f[x.name] || ''}
                  onChange={(e) =>
                    setF({ ...f, [x.name]: e.target.value })
                  }
                >
                  <option value="">Select...</option>
                  {x.options.map((o: string) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  type={x.type || 'text'}
                  required={x.required}
                  value={f[x.name] || ''}
                  onChange={(e) =>
                    setF({ ...f, [x.name]: e.target.value })
                  }
                />
              )}
            </div>
          ))}

          {err && <div className="error span2">{err}</div>}

          <div className="actions span2">
            <button
              className="btn btn-primary"
              disabled={busy}
            >
              {busy ? 'Saving...' : 'Save'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => r.back()}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Page>
  );
}
