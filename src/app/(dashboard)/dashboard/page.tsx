'use client';

import React from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Projects</h1>
        <Link
          href="/projects/new"
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-fg)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          New Project
        </Link>
      </div>
      <p style={{ color: 'var(--text-secondary)' }}>Welcome to your TaskFlow dashboard.</p>
    </div>
  );
}
