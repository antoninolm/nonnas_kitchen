import { createContext, useState } from "react";

export const AuthContext = createContext(null);

async function postJSON(url, body) {
  const res = await fetch(url, {
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

  function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}
