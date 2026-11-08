"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { SessionInfo, User } from "@/types";

export const authKeys = {
  me: ["auth", "me"] as const,
  sessions: ["auth", "sessions"] as const,
};

/** Current user, or null when logged out. */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        return (await api.get<User>("/auth/me")).data;
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
        throw err;
      }
    },
    staleTime: 60_000,
  });
}

export interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: "PATIENT" | "CAREGIVER" | "DOCTOR" | "PHARMACY";
  organization?: string;
  licenseNumber?: string;
  specialty?: string;
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => api.post<{ user: User }>("/auth/register", input),
    onSuccess: (res) => qc.setQueryData(authKeys.me, res.data.user),
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => api.post<{ user: User }>("/auth/login", input),
    onSuccess: (res) => {
      qc.clear();
      qc.setQueryData(authKeys.me, res.data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(authKeys.me, null);
    },
  });
}

export function useVerifyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; code: string }) => api.post<User>("/auth/verify-email", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me }),
  });
}

export const useResendOtp = () =>
  useMutation({
    mutationFn: (input: { email: string; purpose: "EMAIL_VERIFY" | "PASSWORD_RESET" }) => api.post("/auth/resend-otp", input),
  });

export const useForgotPassword = () =>
  useMutation({ mutationFn: (input: { email: string }) => api.post("/auth/forgot-password", input) });

export const useResetPassword = () =>
  useMutation({
    mutationFn: (input: { email: string; code: string; password: string }) => api.post("/auth/reset-password", input),
  });

export const useChangePassword = () =>
  useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) => api.patch("/auth/change-password", input),
  });

export const useSessions = () =>
  useQuery({ queryKey: authKeys.sessions, queryFn: async () => (await api.get<SessionInfo[]>("/auth/sessions")).data });

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) => (id ? api.delete(`/auth/sessions/${id}`) : api.delete("/auth/sessions")),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.sessions }),
  });
}
