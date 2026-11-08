"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
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
import { useMe, useResendOtp, useVerifyEmail } from "./api";
import { authSchemas } from "./schemas";

export function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, lang } = useT();
  const { data: me } = useMe();
  const email = params.get("email") ?? me?.email ?? "";
  const verify = useVerifyEmail();
  const resend = useResendOtp();
  const schema = useMemo(() => authSchemas(lang).otp, [lang]);
  const form = useForm<{ code: string }>({ resolver: zodResolver(schema), defaultValues: { code: "" } });

  const onSubmit = form.handleSubmit(({ code }) =>
    verify.mutate(
      { email, code },
      {
        onSuccess: () => {
          toast.success(t("Email verified!", "ইমেইল যাচাই সম্পন্ন!"));
          const next = params.get("next");
          if (!me) router.push(next?.startsWith("/") ? `/login?next=${encodeURIComponent(next)}` : "/login");
          else router.push(next?.startsWith("/") ? next : me.role === "ADMIN" ? "/admin" : "/dashboard");
        },
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="flex items-start gap-3 rounded-xl bg-accent p-4 text-accent-foreground">
        <MailCheck className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm">
          {t("We sent a 6-digit code to", "আমরা একটি ৬ সংখ্যার কোড পাঠিয়েছি")} <strong className="break-all">{email || t("your email", "আপনার ইমেইলে")}</strong>
          {t(". It expires in 10 minutes.", "। কোডটি ১০ মিনিট পর্যন্ত কাজ করবে।")}
        </p>
      </div>
      {verify.error && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(verify.error)}</AlertDescription>
        </Alert>
      )}
      <FormField id="code" label={t("Verification code", "যাচাই কোড")} error={form.formState.errors.code?.message}>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className="h-14 text-center text-2xl tracking-[0.5em]"
          {...form.register("code")}
        />
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={verify.isPending || !email}>
        {verify.isPending && <Loader2 className="animate-spin" />} {t("Verify email", "ইমেইল যাচাই করুন")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={resend.isPending || !email}
        onClick={() =>
          resend.mutate(
            { email, purpose: "EMAIL_VERIFY" },
            { onSuccess: () => toast.success(t("A new code is on its way", "নতুন কোড পাঠানো হয়েছে")), onError: (e) => toast.error(errorMessage(e)) },
          )
        }
      >
        {t("Didn't get it? Resend code", "কোড পাননি? আবার পাঠান")}
      </Button>
    </form>
  );
}
