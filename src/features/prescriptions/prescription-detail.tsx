"use client";

import { ArrowLeft, Building2, Calendar, Clock, ExternalLink, Gauge, Loader2, RefreshCw, Sparkles, Stethoscope, Trash2, Volume2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState, PageLoader } from "@/components/shared/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicineInfoDialog } from "@/features/ai/medicine-info-view";
import { errorMessage } from "@/lib/api";
import { fmtDate, fmtTime, MEAL_LABELS } from "@/lib/format";
import { speak } from "@/lib/voice";
import { useDeletePrescription, usePrescription, useReprocessPrescription } from "./api";
import { PrescriptionReview } from "./prescription-review";
import { PrescriptionStatusBadge } from "./status-badge";
import { useT } from "@/hooks/use-t";
import { RxThumb } from "@/components/shared/rx-thumb";

export function PrescriptionDetail({ id, patientId }: { id: string; patientId?: string }) {
  const router = useRouter();
  const { data: rx, isLoading, error, refetch } = usePrescription(id, patientId);
  const reprocess = useReprocessPrescription(id, patientId);
  const remove = useDeletePrescription(patientId);
  const back = patientId ? `/dashboard/care/${patientId}` : "/dashboard/prescriptions";
  const { t, n } = useT();

  if (isLoading) return <PageLoader />;
  if (error || !rx) return <ErrorState error={error} onRetry={refetch} />;

  const confidence = rx.aiConfidence != null ? Math.round(rx.aiConfidence * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={back}>
            <ArrowLeft /> {t("Back", "ফিরে যান")}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold sm:text-3xl">{rx.title || rx.diagnosis || t("Prescription", "প্রেসক্রিপশন")}</h1>
        <PrescriptionStatusBadge status={rx.status} />
        <div className="ml-auto flex gap-2">
          {rx.status !== "VERIFIED" && rx.status !== "PROCESSING" && (
            <Button
              variant="outline"
              disabled={reprocess.isPending}
              onClick={() =>
                reprocess.mutate(undefined, { onSuccess: (r) => toast.success(r.message), onError: (e) => toast.error(errorMessage(e)) })
              }
            >
              {reprocess.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />} {t("Re-read with AI", "এআই দিয়ে আবার পড়ুন")}
            </Button>
          )}
          <ConfirmDialog
            title={t("Delete this prescription?", "এই প্রেসক্রিপশন মুছবেন?")}
            description={
              rx.status === "VERIFIED"
                ? t("The photo and record will be deleted. Medicines you already confirmed will stay in your medicine list.", "ছবি ও তথ্য মুছে যাবে। আগে নিশ্চিত করা ওষুধগুলো আপনার তালিকায় থাকবে।")
                : t("The photo and the unconfirmed medicines will be deleted.", "ছবি ও নিশ্চিত না করা ওষুধগুলো মুছে যাবে।")
            }
            confirmLabel={t("Delete", "মুছুন")}
            onConfirm={() =>
              remove.mutate(rx.id, {
                onSuccess: () => {
                  toast.success(t("Prescription deleted", "প্রেসক্রিপশন মুছে ফেলা হয়েছে"));
                  router.push(back);
                },
                onError: (e) => toast.error(errorMessage(e)),
              })
            }
            trigger={
              <Button variant="destructive" aria-label={t("Delete prescription", "প্রেসক্রিপশন মুছুন")}>
                <Trash2 /> <span className="hidden sm:inline">{t("Delete", "মুছুন")}</span>
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden py-0">
            {rx.imageUrl ? (
              <a href={rx.imageUrl} target="_blank" rel="noreferrer" className="group relative block bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary image, opens full size */}
                <img src={rx.imageUrl} alt={t("Uploaded prescription", "আপলোড করা প্রেসক্রিপশন")} className="max-h-[520px] w-full object-contain" />
                <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                  <ExternalLink className="size-3" /> {t("Open full size", "বড় করে দেখুন")}
                </span>
              </a>
            ) : (
              <div className="h-48">
                <RxThumb url={null} source={rx.source} />
              </div>
            )}
          </Card>
          <Card>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <Stethoscope className="size-4 text-muted-foreground" /> {rx.doctorName || "—"}
              </p>
              <p className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" /> {rx.hospital || "—"}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" /> {fmtDate(rx.prescribedDate)} <span className="text-muted-foreground">({t("uploaded", "আপলোড")} {fmtDate(rx.createdAt)})</span>
              </p>
              {confidence !== null && (
                <p className="flex items-center gap-2">
                  <Gauge className="size-4 text-muted-foreground" /> {t("Handwriting legibility", "লেখা কতটা স্পষ্ট")}:{" "}
                  <Badge variant={confidence >= 75 ? "success" : confidence >= 50 ? "warning" : "destructive"}>{n(confidence)}%</Badge>
                </p>
              )}
            </CardContent>
          </Card>
          {rx.aiSummaryBn && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-primary" /> {t("Simple summary (Bangla)", "সহজ ভাষায় সারাংশ")}
                </CardTitle>
                <Button variant="ghost" size="icon-sm" onClick={() => speak(rx.aiSummaryBn!)} aria-label={t("Read summary aloud", "সারাংশ শুনুন")}>
                  <Volume2 />
                </Button>
              </CardHeader>
              <CardContent className="text-base leading-relaxed">{rx.aiSummaryBn}</CardContent>
            </Card>
          )}
          {rx.rawText && (
            <details className="rounded-xl border p-4 text-sm">
              <summary className="cursor-pointer font-medium">{t("AI transcription", "এআই এর পড়া লেখা")}</summary>
              <pre className="mt-3 font-sans whitespace-pre-wrap text-muted-foreground">{rx.rawText}</pre>
            </details>
          )}
        </div>

        <div>
          {rx.status === "PROCESSING" && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border p-12 text-center">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-lg font-medium">{t("AI is reading this prescription…", "এআই প্রেসক্রিপশনটি পড়ছে…")}</p>
            </div>
          )}
          {rx.status === "FAILED" && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>{t("AI could not read this prescription", "এআই প্রেসক্রিপশনটি পড়তে পারেনি")}</AlertTitle>
              <AlertDescription>{rx.failureReason ?? t("Please try again or enter the medicines manually below.", "আবার চেষ্টা করুন অথবা নিচে নিজে ওষুধ লিখুন।")}</AlertDescription>
            </Alert>
          )}
          {rx.status === "PROCESSED" && (
            <Alert className="mb-6 border-primary/30 bg-secondary">
              <Sparkles className="text-primary" />
              <AlertTitle>{t("Please review before reminders start", "রিমাইন্ডার শুরুর আগে মিলিয়ে দেখুন")}</AlertTitle>
              <AlertDescription>{t("AI can make mistakes with handwriting. Compare each medicine with the photo, then confirm.", "হাতের লেখা পড়তে এআই ভুল করতে পারে। প্রতিটি ওষুধ ছবির সাথে মিলিয়ে নিশ্চিত করুন।")}</AlertDescription>
            </Alert>
          )}

          {(rx.status === "PROCESSED" || rx.status === "FAILED") && <PrescriptionReview prescription={rx} patientId={patientId} />}

          {rx.status === "VERIFIED" && (
            <div className="space-y-4">
              {rx.advice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("Doctor's advice", "ডাক্তারের পরামর্শ")}</CardTitle>
                  </CardHeader>
                  <CardContent>{rx.advice}</CardContent>
                </Card>
              )}
              <h2 className="text-xl font-semibold">{t("Medicines", "ওষুধ")}</h2>
              {rx.medicines.map((m) => (
                <Card key={m.id}>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-bold">{m.name}</h3>
                      {m.strength && <span className="text-lg text-muted-foreground">{m.strength}</span>}
                      {!m.isActive && <Badge variant="secondary">{t("Finished", "শেষ")}</Badge>}
                      <div className="ml-auto">
                        <MedicineInfoDialog name={m.name} />
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      {[m.genericName, m.form, m.dosagePattern, t(MEAL_LABELS[m.mealTiming].en, MEAL_LABELS[m.mealTiming].bn), m.durationDays && t(`${m.durationDays} days`, `${n(m.durationDays)} দিন`)].filter(Boolean).join(" · ")}
                    </p>
                    {m.instructionsBn && <p className="text-lg">{m.instructionsBn}</p>}
                    <div className="flex flex-wrap gap-2">
                      {m.reminders
                        .filter((r) => r.isActive)
                        .map((r) => (
                          <span key={r.id} className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-sm">
                            <Clock className="size-3.5" /> {fmtTime(r.time)} × {n(r.quantity)}
                          </span>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" asChild>
                <Link href={patientId ? `/dashboard/care/${patientId}` : "/dashboard/medicines"}>{t("Edit medicines & reminders", "ওষুধ ও রিমাইন্ডার সম্পাদনা")}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
