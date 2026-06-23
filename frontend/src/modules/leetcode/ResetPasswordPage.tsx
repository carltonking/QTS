import { useState, type FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { Input } from "../../shared/components/Input";
import { api } from "./api";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = params.get("token");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      navigate("/login");
    } catch {
      setError("Invalid or expired reset token");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="lc-auth-page">
        <Card className="lc-auth-card">
          <div
            style={{
              fontFamily: "var(--font-mono)",
              textAlign: "center",
              padding: "1rem",
            }}
          >
            MISSING RESET TOKEN
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="lc-auth-page">
      <Card className="lc-auth-card">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div className="lc-heading">SET NEW PASSWORD</div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="NEW PASSWORD"
            required
          />
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="CONFIRM PASSWORD"
            required
          />
          {error ? <div className="lc-error-box">{error}</div> : null}
          <Button style={{ width: "100%" }} disabled={loading}>
            {loading ? "RESETTING..." : "RESET PASSWORD"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
