'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import React from 'react';

export default function Page({
  title,
  description,
  action,
  showBack = false,
  children
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  showBack?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        {showBack && (
          <button 
            type="button"
            onClick={() => router.back()} 
            style={{
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border)', 
              cursor: 'pointer', 
              padding: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: '8px',
              marginTop: '4px'
            }}
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, paddingBottom: '4px' }}>{title}</h1>
          {description && <div className="muted">{description}</div>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </>
  );
}
