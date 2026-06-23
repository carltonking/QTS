import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuthContext } from "../shared/contexts/AuthContext";

const links = [
  { to: "/chess", label: "CHESS" },
  { to: "/poker", label: "POKER" },
  { to: "/math", label: "MATH" },
  { to: "/quant", label: "QUANT" },
  { to: "/options", label: "OPTIONS" },
  { to: "/backtest", label: "BACKTEST" },
  { to: "/market-making", label: "MARKET" },
  { to: "/learn", label: "LEARN" },
  { to: "/code", label: "CODE" },
  { to: "/leaderboard", label: "RANK" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuthContext();

  return (
    <header
      role="banner"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <nav
        aria-label="Main navigation"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1rem 2rem",
        }}
      >
        <NavLink
          to="/"
          aria-label="Home"
          style={{
            fontSize: "1.2rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
          }}
        >
          QTS
        </NavLink>
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          style={{
            display: "none",
            border: "1px solid var(--text-1)",
            background: "var(--bg)",
            color: "var(--text-1)",
            padding: "0.45rem 0.7rem",
            borderRadius: "var(--radius)",
            transition: "var(--transition)",
          }}
          className="nav-toggle"
        >
          ☰
        </button>
        <div
          className={`nav-links${open ? " nav-links-open" : ""}`}
          role="menubar"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                paddingBottom: "0.35rem",
                borderBottom: isActive
                  ? "2px solid var(--text-1)"
                  : "2px solid transparent",
                letterSpacing: "0.08em",
                fontSize: "0.82rem",
              })}
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                paddingBottom: "0.35rem",
                borderBottom: isActive
                  ? "2px solid #00ff00"
                  : "2px solid transparent",
                letterSpacing: "0.08em",
                fontSize: "0.82rem",
                color: "#00ff00",
              })}
            >
              ADMIN
            </NavLink>
          )}
          {isAuthenticated ? (
            <span
              style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
            >
              <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
                {user?.username}
              </span>
              <button
                onClick={logout}
                aria-label="Sign out"
                style={{
                  background: "none",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  padding: "0.25rem 0.5rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
              >
                LOGOUT
              </button>
            </span>
          ) : (
            <NavLink
              to="/login"
              role="menuitem"
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                paddingBottom: "0.35rem",
                borderBottom: isActive
                  ? "2px solid var(--text-1)"
                  : "2px solid transparent",
                letterSpacing: "0.08em",
                fontSize: "0.82rem",
              })}
            >
              LOGIN
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}
