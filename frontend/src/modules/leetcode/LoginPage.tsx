import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { Input } from "../../shared/components/Input";
import { loginRequest } from "./api";
import { useAuth } from "./hooks/useAuth";
import "./leetcode.css";

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="lc-auth-page">
      <Card className="lc-auth-card">
        <div className="lc-heading">LOGIN</div>
        <div className="lc-auth-form">
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="EMAIL"
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
              loginRequest({ email, password })
                .then((data) => {
                  auth.login(data.token);
                  navigate("/code");
                })
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : "Login failed"),
                )
                .finally(() => setLoading(false));
            }}
          >
            {loading ? "LOGGING IN..." : "Submit"}
          </Button>
          {error ? <div className="lc-error-box">{error}</div> : null}
          <Link to="/register">DON&apos;T HAVE AN ACCOUNT? REGISTER</Link>
        </div>
      </Card>
    </div>
  );
}
