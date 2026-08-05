import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { login as loginApi, getMe, type LoginRequest, type UserInfo } from '../api/auth';
import {
  setAccessToken,
  setRefreshToken,
  setStoredUser,
  getStoredUser,
  getAccessToken,
  clearAuth as clearStorage,
  type StoredUser,
} from '../utils/storage';

export interface AuthState {
  user: StoredUser | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isOperatorOrAdmin: boolean;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  isAdmin: false,
  isOperatorOrAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user from storage on mount
  useEffect(() => {
    const stored = getStoredUser();
    const token = getAccessToken();
    if (stored && token) {
      setUser(stored);
      // Optionally refresh user info from server
      getMe()
        .then((info: UserInfo) => {
          const u: StoredUser = {
            id: info.id,
            username: info.username,
            displayName: info.display_name,
            role: info.role,
          };
          setUser(u);
          setStoredUser(u);
        })
        .catch(() => {
          // Token expired or invalid
          clearStorage();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await loginApi(data);
    setAccessToken(res.access_token);
    setRefreshToken(res.refresh_token);
    const u: StoredUser = {
      id: res.user.id,
      username: res.user.username,
      displayName: res.user.display_name,
      role: res.user.role,
    };
    setStoredUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearStorage();
    setUser(null);
  }, []);

  const value: AuthState = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isOperatorOrAdmin: user?.role === 'admin' || user?.role === 'operator',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
