/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore an existing login when the application starts.
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("shopora_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest("/api/auth/me");
        setUser(response.data);
      } catch {
        localStorage.removeItem("shopora_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Login customer.
  async function login(email, password) {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem("shopora_token", response.token);
    setUser(response.user);

    return response;
  }

  // Register customer.
  async function register(name, email, password) {
    return await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }

  // Logout customer.
  function logout() {
    localStorage.removeItem("shopora_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
