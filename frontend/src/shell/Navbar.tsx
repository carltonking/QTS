import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/chess', label: 'CHESS' },
  { to: '/poker', label: 'POKER' },
  { to: '/math', label: 'MATH' },
  { to: '/quant', label: 'QUANT' },
  { to: '/code', label: 'CODE' },
  { to: '/login', label: 'LOGIN' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 2rem',
        }}
      >
        <NavLink
          to="/"
          style={{
            fontSize: '1.2rem',
            fontWeight: 600,
            letterSpacing: '0.18em',
          }}
        >
          QTS
        </NavLink>
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((value) => !value)}
          style={{
            display: 'none',
            border: '1px solid var(--text-1)',
            background: 'var(--bg)',
            color: 'var(--text-1)',
            padding: '0.45rem 0.7rem',
            borderRadius: 'var(--radius)',
            transition: 'var(--transition)',
          }}
          className="nav-toggle"
        >
          ☰
        </button>
        <div className={`nav-links${open ? ' nav-links-open' : ''}`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                paddingBottom: '0.35rem',
                borderBottom: isActive ? '2px solid var(--text-1)' : '2px solid transparent',
                letterSpacing: '0.08em',
                fontSize: '0.82rem',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
