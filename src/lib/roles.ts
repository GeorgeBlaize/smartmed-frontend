import type { Role } from "@/types";

export const ROLE_LABELS: Record<Role, { en: string; bn: string }> = {
  PATIENT: { en: "Patient", bn: "রোগী" },
  CAREGIVER: { en: "Caregiver", bn: "কেয়ারগিভার" },
  ADMIN: { en: "Admin", bn: "অ্যাডমিন" },
  DOCTOR: { en: "Doctor", bn: "ডাক্তার" },
  PHARMACY: { en: "Pharmacy", bn: "ফার্মেসি" },
};

export const isProfessional = (role: Role) => role === "DOCTOR" || role === "PHARMACY";
