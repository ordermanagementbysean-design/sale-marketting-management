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
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: getStoredToken(),
    isLoading: true,
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { user, token } = await loginApi(credentials);
    storeToken(token);
    setAuthToken(token);
    setState({ user, token, isLoading: false });
    navigate("/", { replace: true });
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      storeToken(null);
      setAuthToken(null);
      setState({ user: null, token: null, isLoading: false });
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthToken(null);
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    setAuthToken(token);
    getMe()
      .then(({ user }) => setState({ user, token, isLoading: false }))
      .catch(() => {
        storeToken(null);
        setAuthToken(null);
        setState({ user: null, token: null, isLoading: false });
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      isAuthenticated: !!state.user && !!state.token,
    }),
    [state, login, logout]
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
