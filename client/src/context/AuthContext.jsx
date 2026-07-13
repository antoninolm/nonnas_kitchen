import { createContext, useCallback, useState } from "react";
import { apiUrl } from "../utils/api";

export const AuthContext = createContext(null);

async function postJSON(url, body) {
  const res = await fetch(apiUrl(url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, message: data.error };
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  async function login(email, password) {
    const data = await postJSON("/api/v1/auth/login", { email, password });
    setUser(data.user);
    setToken(data.token);
  }

  async function register(name, email, password) {
    return postJSON("/api/v1/auth/register", { name, email, password });
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  const authFetch = useCallback(
    (url, options = {}) =>
      fetch(apiUrl(url), {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${token}` },
      }),
    [token],
  );

  const authFetchJSON = useCallback(
    async (url, options = {}) => {
      const res = await authFetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers },
      });
      const data = await res.json();

      if (!res.ok) {
        throw { status: res.status, message: data.error };
      }

      return data;
    },
    [authFetch],
  );

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, authFetch, authFetchJSON }}
    >
      {children}
    </AuthContext.Provider>
  );
}
