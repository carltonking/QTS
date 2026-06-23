import { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "../../shared/contexts/AuthContext";
import { useToastContext } from "../../shared/contexts/ToastContext";
import { api } from "../leetcode/api";
import "./admin.css";

type Stats = {
  users: number;
  problems: number;
  submissions: number;
  chessPlayers: number;
  mathSessions: number;
  pokerPlayers: number;
  quantPlayers: number;
};

type UserRow = {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
};

export function AdminDashboard() {
  const { isAdmin } = useAuthContext();
  const { addToast } = useToastContext();
  const [tab, setTab] = useState<"stats" | "users">("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/stats");
      setStats(res.data.stats);
    } catch {
      addToast("Failed to load stats", "error");
    }
  }, [addToast]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/users");
      setUsers(res.data.users);
    } catch {
      addToast("Failed to load users", "error");
    }
  }, [addToast]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
    }
  }, [isAdmin, fetchStats, fetchUsers]);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      await api.put("/api/admin/users/role", { userId, role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      addToast(`Role changed to ${newRole}`, "success");
    } catch {
      addToast("Failed to update role", "error");
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-card">ACCESS DENIED</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <div className="admin-title">ADMIN DASHBOARD</div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === "stats" ? "active" : ""}`}
            onClick={() => setTab("stats")}
          >
            STATS
          </button>
          <button
            className={`admin-tab ${tab === "users" ? "active" : ""}`}
            onClick={() => setTab("users")}
          >
            USERS
          </button>
        </div>

        {tab === "stats" && stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat">
              <span className="admin-stat-value">{stats.users}</span>USERS
            </div>
            <div className="admin-stat">
              <span className="admin-stat-value">{stats.problems}</span>PROBLEMS
            </div>
            <div className="admin-stat">
              <span className="admin-stat-value">{stats.submissions}</span>
              SUBMISSIONS
            </div>
            <div className="admin-stat">
              <span className="admin-stat-value">{stats.chessPlayers}</span>
              CHESS
            </div>
            <div className="admin-stat">
              <span className="admin-stat-value">{stats.mathSessions}</span>MATH
            </div>
            <div className="admin-stat">
              <span className="admin-stat-value">{stats.pokerPlayers}</span>
              POKER
            </div>
            <div className="admin-stat">
              <span className="admin-stat-value">{stats.quantPlayers}</span>
              QUANT
            </div>
          </div>
        )}

        {tab === "users" && (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>USERNAME</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>CREATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className={`admin-role-badge ${u.role.toLowerCase()}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="admin-action-btn"
                      onClick={() => toggleRole(u.id, u.role)}
                    >
                      {u.role === "ADMIN" ? "DEMOTE" : "PROMOTE"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
