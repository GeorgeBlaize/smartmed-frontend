"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ClaimPreview, IssuedItem, IssuedPrescription } from "@/types";

export const issuedKeys = {
  all: ["issued"] as const,
  list: (page: number, search?: string) => ["issued", "list", page, search] as const,
  detail: (id: string) => ["issued", "detail", id] as const,
  claim: (code: string) => ["claim", code] as const,
};

export interface IssuedInput {
  patientName: string;
  patientAge?: number | null;
  patientGender?: "male" | "female" | "other" | null;
  patientPhone?: string | null;
  diagnosis?: string | null;
  advice?: string | null;
  followUpDate?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  items: IssuedItem[];
}

export interface ScanResult {
  imageUrl: string;
  imagePublicId: string;
  doctorName: string | null;
  diagnosis: string | null;
  advice: string | null;
  summaryBn: string | null;
  confidence: number;
  items: IssuedItem[];
}

export const useIssuedList = (page: number, search?: string) =>
  useQuery({
    queryKey: issuedKeys.list(page, search),
    queryFn: async () => {
      const res = await api.get<{ items: IssuedPrescription[]; stats: { total: number; claimed: number; pending: number } }>("/issued", {
        page,
        limit: 12,
        search,
      });
      return { ...res.data, meta: res.meta };
    },
    placeholderData: (prev) => prev,
  });

export const useIssued = (id: string) =>
  useQuery({ queryKey: issuedKeys.detail(id), queryFn: async () => (await api.get<IssuedPrescription>(`/issued/${id}`)).data });

export function useCreateIssued() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IssuedInput) => api.post<IssuedPrescription>("/issued", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: issuedKeys.all }),
  });
}

export const useScanForIssue = () =>
  useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("image", file);
      return (await api.post<ScanResult>("/issued/scan", form)).data;
    },
  });

export function useDeleteIssued() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/issued/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: issuedKeys.all }),
  });
}

export function useSendIssued(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => api.post<{ delivered: "account" | "email" }>(`/issued/${id}/send`, { email }),
    onSuccess: () => qc.invalidateQueries({ queryKey: issuedKeys.all }),
  });
}

export const useClaimPreview = (code: string) =>
  useQuery({
    queryKey: issuedKeys.claim(code),
    queryFn: async () => (await api.get<ClaimPreview>(`/claim/${code}`)).data,
    retry: false,
  });

export function useClaim(code: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ prescriptionId: string; alreadyClaimed: boolean }>(`/claim/${code}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issuedKeys.claim(code) });
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
      qc.invalidateQueries({ queryKey: ["doses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Accepts a bare code or a full claim URL pasted by the user. */
export function extractClaimCode(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(/claim\/([A-Za-z0-9_-]{8,40})/);
  if (match) return match[1]!;
  return /^[A-Za-z0-9_-]{8,40}$/.test(trimmed) ? trimmed : null;
}
