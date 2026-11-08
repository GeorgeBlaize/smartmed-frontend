"use client";

import { BadgeCheck, CheckCircle2, Clock, Loader2, LogIn, Pill, ShieldAlert, Stethoscope, Store, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Logo } from "@/components/shared/logo";
import { ErrorState, PageLoader } from "@/components/shared/states";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMe } from "@/features/auth/api";
import { useT } from "@/hooks/use-t";
import { errorMessage } from "@/lib/api";
import { fmtDate, fmtTime, MEAL_LABELS } from "@/lib/format";
import { useClaim, useClaimPreview } from "./api";

/** Opened by scanning a prescription QR code: preview, then add to the patient's account. */
export function ClaimView({ code }: { code: string }) {
  const router = useRouter();
  const { t, n } = useT();
  const { data: rx, isLoading, error, refetch } = useClaimPreview(code);
  const { data: user, isLoading: userLoading } = useMe();
  const claim = useClaim(code);
  const next = encodeURIComponent(`/claim/${code}`);

  const add = () =>
    claim.mutate(undefined, {
      onSuccess: (res) => {
        toast.success(res.message);
        router.push(`/dashboard/prescriptions/${res.data.prescriptionId}`);
      },
      onError: (e) => toast.error(errorMessage(e)),
    });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
          <Logo />
          <div className="flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        {isLoading ? (
          <PageLoader />
        ) : error || !rx ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold text-primary">{t("Your prescription", "আপনার প্রেসক্রিপশন")}</h1>
              <p className="mt-1 text-lg text-muted-foreground">
                {t("Add it to SmartMed to get medicine reminders in Bangla.", "বাংলায় ওষুধের রিমাইন্ডার পেতে স্মার্টমেডে যোগ করুন।")}
              </p>
            </div>

            <Card>
              <CardContent className="flex flex-wrap items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  {rx.source === "DOCTOR" ? <Stethoscope className="size-6" /> : <Store className="size-6" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold">{rx.source === "DOCTOR" ? `Dr. ${rx.issuer.name}` : (rx.issuer.organization ?? rx.issuer.name)}</p>
                  <p className="text-muted-foreground">{[rx.issuer.specialty, rx.source === "DOCTOR" ? rx.issuer.organization : null].filter(Boolean).join(" · ")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("Issued", "তারিখ")} {fmtDate(rx.createdAt)} · {t("for", "রোগী")} <strong className="text-foreground">{rx.patientName}</strong>
                  </p>
                </div>
                {rx.issuer.isProVerified ? (
                  <Badge className="gap-1">
                    <BadgeCheck className="size-3.5" /> {t("Verified", "যাচাইকৃত")}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <ShieldAlert className="size-3.5" /> {t("Not verified", "অযাচাইকৃত")}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {!rx.issuer.isProVerified && (
              <Alert variant="destructive">
                <ShieldAlert />
                <AlertTitle>{t("This issuer is not verified yet", "এই ইস্যুকারী এখনো যাচাই করা হয়নি")}</AlertTitle>
                <AlertDescription>
                  {t(
                    "Only add this if you received it directly from your doctor or pharmacy. Check the medicines with them if anything looks wrong.",
                    "শুধু নিজের ডাক্তার বা ফার্মেসি থেকে সরাসরি পেলে যোগ করুন। কিছু ভুল মনে হলে তাদের সাথে মিলিয়ে নিন।",
                  )}
                </AlertDescription>
              </Alert>
            )}
            {rx.source === "PHARMACY" && (
              <Alert className="border-primary/30 bg-secondary">
                <AlertDescription>
                  {t(
                    "This prescription was read by AI at the pharmacy. You will be asked to check the medicines before reminders start.",
                    "এই প্রেসক্রিপশন ফার্মেসিতে এআই দিয়ে পড়া হয়েছে। রিমাইন্ডার চালুর আগে আপনাকে ওষুধগুলো মিলিয়ে নিতে বলা হবে।",
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="size-5 text-primary" /> {t("Medicines", "ওষুধ")} ({n(rx.items.length)})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rx.diagnosis && (
                  <p>
                    {t("Diagnosis", "রোগ নির্ণয়")}: <strong>{rx.diagnosis}</strong>
                  </p>
                )}
                <ul className="space-y-3">
                  {rx.items.map((m, i) => (
                    <li key={i} className="rounded-xl border p-4">
                      <p className="text-lg font-semibold">
                        {m.name} {m.strength}
                      </p>
                      <p className="text-muted-foreground">
                        {[m.dosagePattern, t(MEAL_LABELS[m.mealTiming].en, MEAL_LABELS[m.mealTiming].bn), m.durationDays && t(`${m.durationDays} days`, `${n(m.durationDays)} দিন`)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {m.reminders.length > 0 && (
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
                          <Clock className="size-4 text-primary" />
                          {m.reminders.map((r) => fmtTime(r.time)).join(", ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                {rx.advice && (
                  <p className="rounded-xl bg-secondary p-3">
                    <strong>{t("Advice", "পরামর্শ")}:</strong> {rx.advice}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="sticky bottom-4 rounded-2xl border bg-card p-4 shadow-lg">
              {rx.claimed ? (
                <p className="flex items-center gap-2 font-semibold text-primary">
                  <CheckCircle2 className="size-5" /> {t("This prescription has already been added to SmartMed.", "এই প্রেসক্রিপশন আগেই স্মার্টমেডে যোগ করা হয়েছে।")}
                  {user && (
                    <Button variant="link" asChild>
                      <Link href="/dashboard/prescriptions">{t("My prescriptions", "আমার প্রেসক্রিপশন")}</Link>
                    </Button>
                  )}
                </p>
              ) : rx.expired ? (
                <p className="font-semibold text-destructive">{t("This code has expired. Ask your doctor or pharmacy for a new one.", "এই কোডের মেয়াদ শেষ। ডাক্তার বা ফার্মেসির কাছে নতুন কোড চান।")}</p>
              ) : userLoading ? (
                <Loader2 className="animate-spin" />
              ) : !user ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="flex-1" asChild>
                    <Link href={`/register?next=${next}`}>
                      <UserPlus /> {t("Create free account & add", "ফ্রি অ্যাকাউন্ট খুলে যোগ করুন")}
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1" asChild>
                    <Link href={`/login?next=${next}`}>
                      <LogIn /> {t("I have an account", "আমার অ্যাকাউন্ট আছে")}
                    </Link>
                  </Button>
                </div>
              ) : user.role !== "PATIENT" ? (
                <p className="text-muted-foreground">
                  {t("Only patient accounts can add prescriptions. Log in with the patient's account.", "শুধু রোগীর অ্যাকাউন্টে প্রেসক্রিপশন যোগ করা যায়। রোগীর অ্যাকাউন্ট দিয়ে লগইন করুন।")}
                </p>
              ) : (
                <Button size="lg" className="w-full" onClick={add} disabled={claim.isPending}>
                  {claim.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {t("Add to my SmartMed", "আমার স্মার্টমেডে যোগ করুন")}
                </Button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
