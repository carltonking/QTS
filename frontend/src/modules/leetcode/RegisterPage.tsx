import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { Input } from "../../shared/components/Input";
import { registerRequest } from "./api";
import { useAuth } from "./hooks/useAuth";
import "./leetcode.css";

export function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="lc-auth-page">
      <Card className="lc-auth-card">
        <div className="lc-heading">REGISTER</div>
        <div className="lc-auth-form">
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="EMAIL"
          />
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="USERNAME"
          />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="PASSWORD"
          />
          <Button
            style={{ width: "100%" }}
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setError("");
              registerRequest({ email, username, password })
                .then((data) => {
                  auth.login(data.token);
                  navigate("/code");
                })
                .catch((err: unknown) =>
                  setError(
                    err instanceof Error ? err.message : "Register failed",
                  ),
                )
                .finally(() => setLoading(false));
            }}
          >
            {loading ? "REGISTERING..." : "Submit"}
          </Button>
          {error ? <div className="lc-error-box">{error}</div> : null}
          <Link to="/login">ALREADY HAVE AN ACCOUNT? LOGIN</Link>
        </div>
      </Card>
    </div>
  );
}
