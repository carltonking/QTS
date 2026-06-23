import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { STORAGE_KEYS } from "../constants";

type DecodedUser = {
  id: string;
  email: string;
  username: string;
  role: string;
};

type AuthContextValue = {
  user: DecodedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (nextToken: string) => void;
  logout: () => void;
};

function decodeToken(token: string | null): DecodedUser | null {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.split("-").join("+").split("_").join("/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = JSON.parse(window.atob(padded));

    return {
      id: json.id,
      email: json.email,
      username: json.username,
      role: json.role || "USER",
    };
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() =>
    window.localStorage.getItem(STORAGE_KEYS.JWT),
  );

  const user = useMemo(() => decodeToken(token), [token]);

  const login = useCallback((nextToken: string) => {
    window.localStorage.setItem(STORAGE_KEYS.JWT, nextToken);
    setToken(nextToken);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEYS.JWT);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login,
      logout,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "ADMIN",
    }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
