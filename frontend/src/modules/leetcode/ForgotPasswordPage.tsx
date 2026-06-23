import { useState, type FormEvent } from "react";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { Input } from "../../shared/components/Input";
import { api } from "./api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
            If that email is registered, a reset link has been sent.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="lc-auth-page">
      <Card className="lc-auth-card">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div className="lc-heading">RESET PASSWORD</div>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="EMAIL"
            required
          />
          {error ? <div className="lc-error-box">{error}</div> : null}
          <Button style={{ width: "100%" }} disabled={loading}>
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
