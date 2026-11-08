"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types";
import { authKeys } from "@/features/auth/api";

function useUserMutation<TInput>(fn: (input: TInput) => Promise<{ data: User }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (res) => qc.setQueryData(authKeys.me, res.data),
  });
}

export type ProfileInput = Partial<
  Pick<User, "name" | "phone" | "dateOfBirth" | "gender" | "bloodGroup" | "allergies" | "chronicConditions" | "emergencyContact" | "organization" | "licenseNumber" | "specialty" | "address">
>;
export type PreferencesInput = Partial<
  Pick<User, "language" | "largeFont" | "voiceEnabled" | "timezone" | "honorific" | "smsEnabled" | "callEnabled">
>;

export const useUpdateProfile = () => useUserMutation((input: ProfileInput) => api.patch<User>("/users/me", input));

export const useUpdatePreferences = () =>
  useUserMutation((input: PreferencesInput) => api.patch<User>("/users/me/preferences", input));

export const useUploadAvatar = () =>
  useUserMutation((file: File) => {
    const form = new FormData();
    form.append("image", file);
    return api.post<User>("/users/me/avatar", form);
  });

export const useTestAlert = () =>
  useMutation({
    mutationFn: () =>
      api.post<{ sms: boolean; call: boolean; smsConfigured: boolean; voiceConfigured: boolean }>("/users/me/test-alert"),
  });

export function useShareLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expiresInDays: 1 | 7 | 30 | null) =>
      api.post<{ token: string; expiresAt: string | null; url: string }>("/users/me/share-link", { expiresInDays }),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me }),
  });
}

export function useRevokeShareLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/users/me/share-link"),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => api.delete("/users/me", { password }),
    onSuccess: () => {
      qc.clear();
      qc.setQueryData(authKeys.me, null);
    },
  });
}
