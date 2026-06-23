import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../../shared/contexts/AuthContext";

export function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuthContext();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      login(token);
      navigate("/code");
    } else {
      navigate("/login");
    }
  }, [params, login, navigate]);

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        fontFamily: "var(--font-mono)",
      }}
    >
      AUTHENTICATING...
    </div>
  );
}
