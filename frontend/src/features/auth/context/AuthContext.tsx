import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_TOKEN_KEY, setAuthToken } from "@/shared/utils/axios";
import { getMe, login as loginApi, logout as logoutApi } from "../services/authApi";
import type { LoginCredentials, User } from "../types";

function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function storeToken(token: string | null): void {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  canManageUsers: boolean;
  canEditProducts: boolean;
  canViewSalePeriodsAndReports: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: getStoredToken(),
    isLoading: true,
    canManageUsers: false,
    canEditProducts: false,
    canViewSalePeriodsAndReports: false,
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    const res = await loginApi(credentials);
    const {
      user,
      token,
      can_manage_users = false,
      can_edit_products = false,
      can_view_sale_periods_and_reports = false,
    } = res;
    storeToken(token);
    setAuthToken(token);
    setState({
      user,
      token,
      isLoading: false,
      canManageUsers: can_manage_users,
      canEditProducts: can_edit_products,
      canViewSalePeriodsAndReports: can_view_sale_periods_and_reports,
    });
    navigate("/", { replace: true });
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      storeToken(null);
      setAuthToken(null);
      setState({
        user: null,
        token: null,
        isLoading: false,
        canManageUsers: false,
        canEditProducts: false,
        canViewSalePeriodsAndReports: false,
      });
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const {
      user,
      can_manage_users = false,
      can_edit_products = false,
      can_view_sale_periods_and_reports = false,
    } = await getMe();
    setState((s) => ({
      ...s,
      user,
      canManageUsers: can_manage_users,
      canEditProducts: can_edit_products,
      canViewSalePeriodsAndReports: can_view_sale_periods_and_reports,
    }));
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthToken(null);
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    setAuthToken(token);
    getMe()
      .then(
        ({
          user,
          can_manage_users = false,
          can_edit_products = false,
          can_view_sale_periods_and_reports = false,
        }) =>
          setState({
            user,
            token,
            isLoading: false,
            canManageUsers: can_manage_users,
            canEditProducts: can_edit_products,
            canViewSalePeriodsAndReports: can_view_sale_periods_and_reports,
          })
      )
      .catch(() => {
        storeToken(null);
        setAuthToken(null);
        setState({
          user: null,
          token: null,
          isLoading: false,
          canManageUsers: false,
          canEditProducts: false,
          canViewSalePeriodsAndReports: false,
        });
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshUser,
      isAuthenticated: !!state.user && !!state.token,
    }),
    [state, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
