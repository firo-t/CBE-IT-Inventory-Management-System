'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Page from './Page';
import Badge from './Badge';

const getValue = (obj: any, path: string) =>
  path.split('.').reduce((acc, key) => acc?.[key], obj);

export default function DetailPage({ title, endpoint, fields }: any) {
  const [d, setD] = useState<any>();
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get(endpoint)
      .then((r) => setD(r.data))
      .catch((e) =>
        setErr(
          e.response?.data?.message ||
            'Unable to load record.'
        )
      );
  }, [endpoint]);

  return (
    <Page title={title} description="Record details">
      <div className="card">
        {err && <div className="alert">{err}</div>}

        {!d && !err && <div>Loading...</div>}

        {d && (
          <div className="detail-grid">
            {fields.map((f: any) => {
              const value = getValue(d, f.key);

              return (
                <div className="kv" key={f.key}>
                  <small>{f.label}</small>

                  {f.badge ? (
                    <Badge value={value} />
                  ) : (
                    <b>{value ?? '—'}</b>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}
