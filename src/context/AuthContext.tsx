import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosPublic, { TOKEN_KEY } from "../hooks/axiosPublic";
import type { AxiosError } from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: "student" | "teacher" | "principal" | "admin" | "owner";
  slug: string;
  isHardcoded: boolean;
  onboardingComplete: boolean;
  avatar: {
    url: string | null;
    publicId: string | null;
  };
}

interface AuthApiError {
  message?: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  login: (phoneOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const shouldLogout = (error: unknown): boolean =>
  (error as AxiosError)?.response?.status === 401;

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (shouldLogout(error)) return false;
  return failureCount < 3;
};

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user = null, isLoading: loading } = useQuery<
    AuthUser | null,
    AxiosError<AuthApiError>
  >({
    queryKey: ["auth", "me"],
    queryFn: async (): Promise<AuthUser | null> => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      try {
        const res = await axiosPublic.get<{ user: AuthUser }>("/api/auth/me");
        return res.data.user ?? null;
      } catch (error: unknown) {
        if (shouldLogout(error)) {
          localStorage.removeItem(TOKEN_KEY);
          return null;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: shouldRetry,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });

  const setUser = useCallback(
    (u: AuthUser | null) => {
      queryClient.setQueryData(["auth", "me"], u);
    },
    [queryClient],
  );

  const login = useCallback(
    async (phoneOrEmail: string, password: string): Promise<void> => {
      const isEmail = phoneOrEmail.includes("@");
      const payload = isEmail
        ? { email: phoneOrEmail, password }
        : { phone: phoneOrEmail, password };

      const { data } = await axiosPublic.post<LoginResponse>(
        "/api/auth/login",
        payload,
      );

      localStorage.setItem(TOKEN_KEY, data.token);
      queryClient.setQueryData(["auth", "me"], data.user);

      if (!data.user.onboardingComplete) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    },
    [navigate, queryClient],
  );

  const logout = useCallback(async (): Promise<void> => {
    await axiosPublic.post("/api/auth/logout").catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.removeQueries({ queryKey: ["auth"] });
    navigate("/", { replace: true });
  }, [navigate, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: user !== null,
        setUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
