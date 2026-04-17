import { createContext, useContext, useState, useEffect } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "elite_veo_user";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const persist = (u: AuthUser | null) => {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
    setUser(u);
  };

  const signup = (name: string, email: string, _password: string): boolean => {
    if (!name.trim() || !email.trim()) return false;
    const newUser: AuthUser = {
      id: Math.random().toString(36).slice(2),
      name: name.trim(),
      email: email.trim().toLowerCase(),
    };
    persist(newUser);
    return true;
  };

  const login = (email: string, _password: string): boolean => {
    if (!email.trim()) return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const u: AuthUser = JSON.parse(stored);
      if (u.email === email.trim().toLowerCase()) {
        persist(u);
        return true;
      }
    }
    const fallback: AuthUser = {
      id: Math.random().toString(36).slice(2),
      name: email.split("@")[0],
      email: email.trim().toLowerCase(),
    };
    persist(fallback);
    return true;
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
