import { useCallback, useMemo, useState } from 'react';

type DecodedUser = {
  id: string;
  email: string;
  username: string;
};

function decodeToken(token: string | null): DecodedUser | null {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split('.');

    if (!payload) {
      return null;
    }

    const normalized = payload.split('-').join('+').split('_').join('/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = JSON.parse(window.atob(padded));

    return {
      id: json.id,
      email: json.email,
      username: json.username,
    };
  } catch {
    return null;
  }
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem('qts_jwt'));

  const user = useMemo(() => decodeToken(token), [token]);

  const login = useCallback((nextToken: string) => {
    window.localStorage.setItem('qts_jwt', nextToken);
    setToken(nextToken);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem('qts_jwt');
    setToken(null);
  }, []);

  return {
    user,
    token,
    login,
    logout,
    isAuthenticated: Boolean(token && user),
  };
}
