import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest } from '../lib/api';

// Effective permission bitmap per page route, keyed by route (e.g. '/projects')
export type PagePermissions = Record<string, number>;

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  contactNo?: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isSystemAdmin: boolean;
  isAdmin: boolean;
  pagePermissions: PagePermissions;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchMyPermissions(): Promise<PagePermissions> {
  try {
    const data = await apiRequest<{ pageModuleId: number; route: string; permissions: number }[]>('/permissions/my');
    const map: PagePermissions = {};
    for (const p of data) {
      map[p.route.toLowerCase()] = p.permissions;
    }
    return map;
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagePermissions, setPagePermissions] = useState<PagePermissions>({});

  useEffect(() => {
    checkAuthStatus();
  }, []);

  type AuthApiResponse = { token: string; user: Partial<User> & { roleName?: string; RoleName?: string; isAdmin?: boolean; firstName?: string; lastName?: string; userName?: string; fullName?: string } };

  const applyAuthResponse = async (response: AuthApiResponse, fallbackName: string) => {
    const mappedUser: User = {
      ...response.user,
      name: response.user.fullName || (response.user as any).FullName || response.user.name || fallbackName,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      username: response.user.userName,
      role: response.user.role || response.user.roleName || response.user.RoleName || 'Developer',
      isAdmin: response.user.isAdmin ?? false,
    } as User;
    localStorage.setItem('pms_token', response.token);
    localStorage.setItem('pms_user', JSON.stringify(mappedUser));
    setUser(mappedUser);
    const perms = await fetchMyPermissions();
    setPagePermissions(perms);
  };

  const login = async (identifier: string, password: string) => {
    try {
      const response = await apiRequest<AuthApiResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail: identifier, password }),
      });
      await applyAuthResponse(response, identifier);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      throw new Error(message);
    }
  };

  const register = async (data: RegisterPayload) => {
    try {
      const response = await apiRequest<AuthApiResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          userName: data.username,
          email: data.email,
          contactNo: data.contactNo,
          password: data.password,
        }),
      });
      await applyAuthResponse(response, `${data.firstName} ${data.lastName}`.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    setPagePermissions({});
    localStorage.removeItem('pms_user');
    localStorage.removeItem('pms_token');
    window.location.href = '/auth';
  };

  const checkAuthStatus = async () => {
    try {
      const savedUser = localStorage.getItem('pms_user');
      const savedToken = localStorage.getItem('pms_token');

      if (savedUser && savedToken) {
        try {
          const parsed = JSON.parse(savedUser);
          if (!parsed.name && parsed.fullName) {
            parsed.name = parsed.fullName;
          }
          setUser(parsed);

          // Validate token with backend
          await apiRequest<User>('/auth/validate', {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });

          // Load effective permissions for this user
          const perms = await fetchMyPermissions();
          setPagePermissions(perms);
        } catch (e) {
          localStorage.removeItem('pms_user');
          localStorage.removeItem('pms_token');
          setUser(null);
          setPagePermissions({});
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isSystemAdmin = user?.role?.toLowerCase() === 'systemadmin' || user?.role?.toLowerCase() === 'admin';
  const isAdmin = user?.isAdmin ?? false;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, isSystemAdmin, isAdmin, pagePermissions, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
