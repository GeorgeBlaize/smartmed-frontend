"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Payment, Prescription, Role, User } from "@/types";

export interface AdminStats {
  users: {
    total: number;
    byRole: Partial<Record<Role, number>>;
    byStatus: Partial<Record<"ACTIVE" | "SUSPENDED", number>>;
    premium: number;
    newLast30Days: number;
    signupsDaily: { date: string; count: number }[];
  };
  prescriptions: { total: number; byStatus: Record<string, number>; uploadsDaily: { date: string; count: number }[] };
  medicines: { active: number };
  adherence: { last30Days: Record<string, number>; rate: number | null };
  ai: {
    totalLast30Days: number;
    failuresLast30Days: number;
    successRate: number | null;
    byFeature: { feature: string; count: number; avgLatencyMs: number }[];
  };
  revenue: { totalBdt: number; successfulPayments: number };
  care: { activeLinks: number };
  inventory: { expiredNotDisposed: number };
  generatedAt: string;
}

export type AdminUser = User & {
  _count: { prescriptions: number; medicines: number; patientLinks: number; caregiverLinks: number };
};

export interface AiLog {
  id: string;
  feature: string;
  provider: string;
  success: boolean;
  error: string | null;
  latencyMs: number | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export interface AuditLog {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
}

type ListParams = { page: number; search?: string; status?: string; role?: string; feature?: string };

function useList<T>(key: string, path: string, params: ListParams) {
  return useQuery({
    queryKey: ["admin", key, params],
    queryFn: async () => {
      const res = await api.get<T[]>(path, { ...params, limit: 15 });
      return { items: res.data, meta: res.meta };
    },
    placeholderData: (prev) => prev,
  });
}

export const useAdminStats = () =>
  useQuery({ queryKey: ["admin", "stats"], queryFn: async () => (await api.get<AdminStats>("/admin/stats")).data });

export const useAdminUsers = (p: ListParams) => useList<AdminUser>("users", "/admin/users", p);
export const useAdminPrescriptions = (p: ListParams) => useList<Prescription>("prescriptions", "/admin/prescriptions", p);
export const useAdminPayments = (p: ListParams) => useList<Payment>("payments", "/admin/payments", p);
export const useAdminAiLogs = (p: ListParams) => useList<AiLog>("ai-logs", "/admin/ai-logs", p);
export const useAdminAuditLogs = (p: ListParams) => useList<AuditLog>("audit-logs", "/admin/audit-logs", p);

function useAdminMutation<T>(fn: (input: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }) });
}

export const useUpdateUser = () =>
  useAdminMutation(({ id, ...data }: { id: string; role?: Role; status?: "ACTIVE" | "SUSPENDED"; plan?: "FREE" | "PREMIUM"; isProVerified?: boolean }) =>
    api.patch(`/admin/users/${id}`, data),
  );
export const useDeleteUser = () => useAdminMutation((id: string) => api.delete(`/admin/users/${id}`));
export const useForceLogout = () => useAdminMutation((id: string) => api.post(`/admin/users/${id}/force-logout`));
export const useRemovePrescription = () =>
  useAdminMutation(({ id, reason }: { id: string; reason?: string }) => api.delete(`/admin/prescriptions/${id}`, { reason }));
export const useBroadcast = () =>
  useAdminMutation((input: { title: string; message: string; role?: Role }) =>
    api.post<{ recipients: number }>("/admin/broadcast", input),
  );
