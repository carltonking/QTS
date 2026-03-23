import type { PropsWithChildren } from 'react';
import { Navbar } from './Navbar';

export function Layout({ children }: PropsWithChildren) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main
        style={{
          minHeight: '100vh',
          padding: '6rem 2rem 2rem',
          background: 'var(--bg)',
        }}
      >
        {children}
      </main>
    </div>
  );
}
