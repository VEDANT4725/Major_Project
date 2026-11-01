"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jsx as _jsx } from "react/jsx-runtime";
const API_URL = import.meta.env.VITE_WORKER_URL || "http://localhost:8080";
const AuthContext = /*#__PURE__*/createContext(undefined);
export function AuthProvider({
  children
}) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      const stored = localStorage.getItem("blueprint_ai_token");
      const storedUser = localStorage.getItem("blueprint_ai_user");
      if (!stored || !storedUser) {
        if (!cancelled) setIsLoaded(true);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${stored}`
          }
        });
        if (!res.ok) throw new Error("Session expired");
        const data = await res.json();
        if (cancelled) return;
        const nextUser = {
          userId: data.userId,
          username: data.username,
          email: data.email,
          displayName: data.displayName
        };
        setToken(stored);
        setUser(nextUser);
        localStorage.setItem("blueprint_ai_user", JSON.stringify(nextUser));
      } catch {
        localStorage.removeItem("blueprint_ai_token");
        localStorage.removeItem("blueprint_ai_user");
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    };
    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);
  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({
        error: "Login failed"
      }));
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    setToken(data.token);
    setUser({
      userId: data.userId,
      username: data.username,
      email: data.email,
      displayName: data.displayName
    });
    localStorage.setItem("blueprint_ai_token", data.token);
    localStorage.setItem("blueprint_ai_user", JSON.stringify({
      userId: data.userId,
      username: data.username,
      email: data.email,
      displayName: data.displayName
    }));
  }, []);
  const register = useCallback(async (username, email, password) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        email,
        password
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({
        error: "Registration failed"
      }));
      throw new Error(err.error || "Registration failed");
    }
    const data = await res.json();
    setToken(data.token);
    setUser({
      userId: data.userId,
      username: data.username,
      email: data.email,
      displayName: data.displayName
    });
    localStorage.setItem("blueprint_ai_token", data.token);
    localStorage.setItem("blueprint_ai_user", JSON.stringify({
      userId: data.userId,
      username: data.username,
      email: data.email,
      displayName: data.displayName
    }));
  }, []);
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("blueprint_ai_token");
    localStorage.removeItem("blueprint_ai_user");
  }, []);
  const getToken = useCallback(async () => {
    return token;
  }, [token]);
  return /*#__PURE__*/_jsx(AuthContext.Provider, {
    value: {
      user,
      token,
      isLoaded,
      isSignedIn: !!token && !!user,
      login,
      register,
      logout,
      getToken
    },
    children: children
  });
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
