'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { LogIn } from 'lucide-react';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await api.post('/auth/login', { email, password });
      localStorage.setItem('cbe_access_token', r.data.access_token);
      localStorage.setItem('cbe_user', JSON.stringify(r.data.user));
      location.href = '/dashboard';
    } catch (x: any) {
      setErr(x.response?.data?.message || 'Login failed. Check your credentials and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="login-card">

        {/* CBE LOGO + BRAND */}
        <div className="login-brand">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <Image
              src="/cbe-logo.png"
              alt="Commercial Bank of Ethiopia"
              width={140}
              height={140}
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
              }}
              priority
            />
          </div>
          <h1 style={{ margin: '10px 0 3px', fontSize: '1.3rem', color: '#910096', fontWeight: 700 }}>
            Commercial Bank of Ethiopia
          </h1>
          <div style={{ fontSize: 13, color: '#910096', opacity: 0.75, marginBottom: 2 }}>
            IT Hardware Inventory Management System
          </div>
          <div style={{
            fontSize: 11,
            fontStyle: 'italic',
            color: '#C4960C',
            marginTop: 4,
            letterSpacing: '0.02em',
            fontWeight: 600,
          }}>
            "Your Trusted Partner in Banking"
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{
          borderTop: '1px solid var(--border, #e5e7eb)',
          margin: '16px 0',
        }} />

        {/* FORM */}
        <form onSubmit={submit} style={{ display: 'grid', gap: 15 }}>
          <div className="field">
            <label>Email address</label>
            <input
              required
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@cbe.com.et"
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              required
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {err && <div className="error">{err}</div>}

          <button
            disabled={busy}
            className="btn btn-primary"
            style={{ justifyContent: 'center', padding: 12 }}
          >
            {busy ? 'Signing in…' : <><LogIn size={16} /> &nbsp;Sign in</>}
          </button>
        </form>

        {/* FOOTER */}
        <div className="footer-note" style={{ marginTop: 16 }}>
          Authorized CBE personnel only · {new Date().getFullYear()}
        </div>

      </div>
    </div>
  );
}
