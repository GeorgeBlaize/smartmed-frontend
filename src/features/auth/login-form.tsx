"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/hooks/use-t";
import { errorMessage } from "@/lib/api";
import { useLogin } from "./api";
import { PasswordInput } from "./password-input";
import { authSchemas, type LoginValues } from "./schemas";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, lang } = useT();
  const login = useLogin();
  const schema = useMemo(() => authSchemas(lang).login, [lang]);
  const form = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: (res) => {
        const user = res.data.user;
        toast.success(t(`Welcome back, ${user.name.split(" ")[0]}!`, `আবার স্বাগতম, ${user.name.split(" ")[0]}!`));
        const next = params.get("next");
        if (!user.isEmailVerified) router.push(`/verify-email?email=${encodeURIComponent(user.email)}${next?.startsWith("/") ? `&next=${encodeURIComponent(next)}` : ""}`);
        else router.push(next?.startsWith("/") ? next : user.role === "ADMIN" ? "/admin" : "/dashboard");
      },
    }),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {login.error && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(login.error)}</AlertDescription>
        </Alert>
      )}
      <FormField id="email" label={t("Email", "ইমেইল")} error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </FormField>
      <FormField id="password" label={t("Password", "পাসওয়ার্ড")} error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </FormField>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          {t("Forgot password?", "পাসওয়ার্ড ভুলে গেছেন?")}
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
        {login.isPending ? <Loader2 className="animate-spin" /> : <LogIn />} {t("Log in", "লগইন")}
      </Button>
    </form>
  );
}
