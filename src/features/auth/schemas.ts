import { z } from "zod";
import type { Lang } from "@/lib/i18n";

/** Validation schemas with messages in the active UI language. */
export function authSchemas(lang: Lang) {
  const t = (en: string, bn: string) => (lang === "en" ? en : bn);

  const email = z.string().trim().email(t("Enter a valid email", "সঠিক ইমেইল দিন"));
  const password = z
    .string()
    .min(8, t("At least 8 characters", "কমপক্ষে ৮ অক্ষর দিন"))
    .regex(/[A-Za-z]/, t("Include at least one letter", "অন্তত একটি অক্ষর দিন"))
    .regex(/\d/, t("Include at least one number", "অন্তত একটি সংখ্যা দিন"));
  const code = z.string().regex(/^\d{6}$/, t("Enter the 6-digit code", "৬ সংখ্যার কোডটি দিন"));
  const mismatch = { message: t("Passwords do not match", "পাসওয়ার্ড মিলছে না"), path: ["confirmPassword"] };

  return {
    password,
    email,
    login: z.object({ email, password: z.string().min(1, t("Password is required", "পাসওয়ার্ড দিন")) }),
    register: z
      .object({
        name: z.string().trim().min(2, t("Enter your full name", "আপনার পুরো নাম লিখুন")),
        email,
        phone: z
          .string()
          .trim()
          .regex(/^(\+?[0-9\s-]{8,16})?$/, t("Enter a valid phone number", "সঠিক ফোন নম্বর দিন"))
          .optional(),
        password,
        confirmPassword: z.string(),
        role: z.enum(["PATIENT", "CAREGIVER", "DOCTOR", "PHARMACY"]),
        organization: z.string().trim().optional(),
        licenseNumber: z.string().trim().optional(),
        specialty: z.string().trim().optional(),
      })
      .refine((v) => v.password === v.confirmPassword, mismatch)
      .superRefine((v, ctx) => {
        if (v.role !== "DOCTOR" && v.role !== "PHARMACY") return;
        const doctor = v.role === "DOCTOR";
        if (!v.organization || v.organization.length < 2) {
          ctx.addIssue({ code: "custom", path: ["organization"], message: doctor ? t("Enter your hospital or chamber", "হাসপাতাল বা চেম্বারের নাম দিন") : t("Enter the pharmacy name", "ফার্মেসির নাম দিন") });
        }
        if (!v.licenseNumber || v.licenseNumber.length < 3) {
          ctx.addIssue({ code: "custom", path: ["licenseNumber"], message: doctor ? t("Enter your BMDC registration number", "BMDC রেজিস্ট্রেশন নম্বর দিন") : t("Enter the drug licence number", "ড্রাগ লাইসেন্স নম্বর দিন") });
        }
      }),
    otp: z.object({ code }),
    reset: z
      .object({ email, code, password, confirmPassword: z.string() })
      .refine((v) => v.password === v.confirmPassword, mismatch),
    change: z
      .object({ currentPassword: z.string().min(1, t("Required", "আবশ্যক")), newPassword: password, confirm: z.string() })
      .refine((v) => v.newPassword === v.confirm, { message: mismatch.message, path: ["confirm"] }),
  };
}

type Schemas = ReturnType<typeof authSchemas>;
export type LoginValues = z.infer<Schemas["login"]>;
export type RegisterValues = z.infer<Schemas["register"]>;
export type ResetValues = z.infer<Schemas["reset"]>;
export type ChangePasswordValues = z.infer<Schemas["change"]>;
