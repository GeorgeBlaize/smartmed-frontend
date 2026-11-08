"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CareLink, CaredPatient, PatientOverview } from "@/types";

export const careKeys = {
  caregivers: ["care", "caregivers"] as const,
  invites: ["care", "invites"] as const,
  patients: ["care", "patients"] as const,
  overview: (id: string) => ["care", "patient", id] as const,
};

export const useCaregivers = (enabled = true) =>
  useQuery({
    queryKey: careKeys.caregivers,
    queryFn: async () => (await api.get<CareLink[]>("/care/caregivers")).data,
    enabled,
  });

export const useCareInvites = (enabled = true) =>
  useQuery({
    queryKey: careKeys.invites,
    queryFn: async () => (await api.get<CareLink[]>("/care/invites")).data,
    enabled,
  });

export const useCaredPatients = (enabled = true) =>
  useQuery({
    queryKey: careKeys.patients,
    queryFn: async () => (await api.get<CaredPatient[]>("/care/patients")).data,
    enabled,
    refetchInterval: 60_000,
  });

export const usePatientOverview = (patientId: string) =>
  useQuery({
    queryKey: careKeys.overview(patientId),
    queryFn: async () => (await api.get<PatientOverview>(`/care/patients/${patientId}`)).data,
    refetchInterval: 60_000,
  });

export function useUpdatePatientAlerts(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { phone?: string | null; smsEnabled?: boolean; callEnabled?: boolean }) =>
      api.patch(`/care/patients/${patientId}/alerts`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: careKeys.overview(patientId) }),
  });
}

export function useInviteCaregiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; relation?: string }) => api.post<CareLink>("/care/caregivers", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: careKeys.caregivers }),
  });
}

export function useRevokeCaregiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/care/caregivers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: careKeys.caregivers }),
  });
}

export function useRespondInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => api.post(`/care/invites/${id}/respond`, { accept }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: careKeys.invites });
      qc.invalidateQueries({ queryKey: careKeys.patients });
    },
  });
}
