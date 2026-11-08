"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { HeartHandshake, Loader2, Stethoscope, Store, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/hooks/use-t";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRegister } from "./api";
import { PasswordInput } from "./password-input";
import { authSchemas, type RegisterValues } from "./schemas";

const ROLES = [
  { value: "PATIENT", en: "I take medicines", bn: "আমি ওষুধ খাই", hintEn: "Patient", hintBn: "রোগী", icon: User },
  { value: "CAREGIVER", en: "I care for someone", bn: "আমি দেখাশোনা করি", hintEn: "Caregiver", hintBn: "কেয়ারগিভার", icon: HeartHandshake },
  { value: "DOCTOR", en: "I am a doctor", bn: "আমি ডাক্তার", hintEn: "Write QR prescriptions", hintBn: "QR প্রেসক্রিপশন লিখুন", icon: Stethoscope },
  { value: "PHARMACY", en: "I run a pharmacy", bn: "আমার ফার্মেসি আছে", hintEn: "Scan for customers", hintBn: "গ্রাহকদের জন্য স্ক্যান", icon: Store },
] as const;

const ROLE_PARAM = ["PATIENT", "CAREGIVER", "DOCTOR", "PHARMACY"] as const;

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, lang } = useT();
  const register = useRegister();
  const schema = useMemo(() => authSchemas(lang).register, [lang]);
  const requestedRole = ROLE_PARAM.find((r) => r === params.get("role")) ?? "PATIENT";
  const next = params.get("next");
  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "", role: requestedRole, organization: "", licenseNumber: "", specialty: "" },
  });
  const { errors } = form.formState;
  const role = useWatch({ control: form.control, name: "role" });
  const isPro = role === "DOCTOR" || role === "PHARMACY";

  const onSubmit = form.handleSubmit(({ confirmPassword: _c, phone, organization, licenseNumber, specialty, ...values }) =>
    register.mutate(
      {
        ...values,
        phone: phone || undefined,
        ...(isPro ? { organization, licenseNumber, specialty: specialty || undefined } : {}),
      },
      {
        onSuccess: () => {
          toast.success(t("Account created! Check your email for the code.", "অ্যাকাউন্ট তৈরি হয়েছে! ইমেইলে পাঠানো কোডটি দেখুন।"));
          const nextParam = next?.startsWith("/") ? `&next=${encodeURIComponent(next)}` : "";
          router.push(`/verify-email?email=${encodeURIComponent(values.email)}${nextParam}`);
        },
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {register.error && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(register.error)}</AlertDescription>
        </Alert>
      )}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t("Who are you?", "আপনি কে?")}</legend>
        <div className="grid grid-cols-2 gap-3" role="radiogroup">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={role === r.value}
              onClick={() => form.setValue("role", r.value)}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-center transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                role === r.value ? "border-primary bg-secondary" : "border-border hover:bg-muted",
              )}
            >
              <r.icon className="size-6 text-primary" aria-hidden />
              <span className="font-semibold">{t(r.en, r.bn)}</span>
              <span className="text-xs text-muted-foreground">{t(r.hintEn, r.hintBn)}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <FormField id="name" label={role === "PHARMACY" ? t("Your name (owner / pharmacist)", "আপনার নাম (মালিক / ফার্মাসিস্ট)") : t("Full name", "পুরো নাম")} error={errors.name?.message}>
        <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register("name")} />
      </FormField>

      {isPro && (
        <div className="grid gap-4 rounded-xl border bg-secondary/50 p-4 sm:grid-cols-2">
          <FormField
            id="organization"
            className="sm:col-span-2"
            label={role === "DOCTOR" ? t("Hospital / chamber", "হাসপাতাল / চেম্বার") : t("Pharmacy name", "ফার্মেসির নাম")}
            error={errors.organization?.message}
          >
            <Input id="organization" aria-invalid={!!errors.organization} {...form.register("organization")} />
          </FormField>
          <FormField
            id="licenseNumber"
            label={role === "DOCTOR" ? t("BMDC registration no.", "BMDC রেজিস্ট্রেশন নং") : t("Drug licence no.", "ড্রাগ লাইসেন্স নং")}
            error={errors.licenseNumber?.message}
            hint={t("Checked by SmartMed before your account is marked verified.", "অ্যাকাউন্ট যাচাইকৃত করার আগে স্মার্টমেড এটি পরীক্ষা করবে।")}
          >
            <Input id="licenseNumber" aria-invalid={!!errors.licenseNumber} {...form.register("licenseNumber")} />
          </FormField>
          {role === "DOCTOR" && (
            <FormField id="specialty" label={t("Specialty (optional)", "বিশেষজ্ঞতা (ঐচ্ছিক)")}>
              <Input id="specialty" placeholder={t("e.g. Medicine", "যেমন: মেডিসিন")} {...form.register("specialty")} />
            </FormField>
          )}
        </div>
      )}

      <FormField id="email" label={t("Email", "ইমেইল")} error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </FormField>
      <FormField id="phone" label={t("Phone (optional)", "ফোন (ঐচ্ছিক)")} error={errors.phone?.message}>
        <Input id="phone" type="tel" autoComplete="tel" placeholder="01XXXXXXXXX" {...form.register("phone")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="password" label={t("Password", "পাসওয়ার্ড")} error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
        </FormField>
        <FormField id="confirmPassword" label={t("Confirm password", "পাসওয়ার্ড আবার দিন")} error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" {...form.register("confirmPassword")} />
        </FormField>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={register.isPending}>
        {register.isPending && <Loader2 className="animate-spin" />} {t("Create account", "অ্যাকাউন্ট খুলুন")}
      </Button>
    </form>
  );
}
