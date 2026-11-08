"use client";

import { ArrowLeft, BadgeCheck, CheckCircle2, Copy, Loader2, Mail, Printer, ShieldAlert, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState, PageLoader } from "@/components/shared/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useT } from "@/hooks/use-t";
import { errorMessage } from "@/lib/api";
import { fmtDate, fmtDateTime, fmtTime, MEAL_LABELS } from "@/lib/format";
import { useDeleteIssued, useIssued, useSendIssued } from "./api";

function SendDialog({ id }: { id: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const send = useSendIssued(id);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail /> {t("Send to patient", "রোগীকে পাঠান")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Send to the patient's email", "রোগীর ইমেইলে পাঠান")}</DialogTitle>
          <DialogDescription>
            {t(
              "If the patient already uses SmartMed, it is added to their account right away. Otherwise they get a link by email.",
              "রোগী আগে থেকে স্মার্টমেড ব্যবহার করলে সরাসরি তার অ্যাকাউন্টে যোগ হবে। না হলে ইমেইলে একটি লিংক যাবে।",
            )}
          </DialogDescription>
        </DialogHeader>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@example.com" aria-label={t("Patient email", "রোগীর ইমেইল")} />
        <DialogFooter>
          <Button
            disabled={!email.includes("@") || send.isPending}
            onClick={() =>
              send.mutate(email.trim(), {
                onSuccess: (r) => {
                  toast.success(r.message);
                  setOpen(false);
                },
                onError: (e) => toast.error(errorMessage(e)),
              })
            }
          >
            {send.isPending && <Loader2 className="animate-spin" />} {t("Send", "পাঠান")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Printable prescription with a QR code the patient scans to get reminders. */
export function IssuedSheet({ id }: { id: string }) {
  const router = useRouter();
  const { t, n } = useT();
  const { data: rx, isLoading, error, refetch } = useIssued(id);
  const remove = useDeleteIssued();

  if (isLoading) return <PageLoader />;
  if (error || !rx) return <ErrorState error={error} onRetry={refetch} />;

  const issuer = rx.issuer;
  const genderLabel = rx.patientGender === "male" ? t("Male", "পুরুষ") : rx.patientGender === "female" ? t("Female", "নারী") : rx.patientGender ? t("Other", "অন্যান্য") : null;

  return (
    <div className="space-y-5">
      {/* Actions – hidden when printing */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/issue">
            <ArrowLeft /> {t("All prescriptions", "সব প্রেসক্রিপশন")}
          </Link>
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button onClick={() => window.print()}>
            <Printer /> {t("Print", "প্রিন্ট করুন")}
          </Button>
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(rx.claimUrl).then(() => toast.success(t("Link copied", "লিংক কপি হয়েছে")))}>
            <Copy /> {t("Copy link", "লিংক কপি")}
          </Button>
          {!rx.claimedAt && <SendDialog id={rx.id} />}
          {!rx.claimedAt && (
            <ConfirmDialog
              title={t("Delete this prescription?", "এই প্রেসক্রিপশন মুছবেন?")}
              description={t("The QR code will stop working.", "QR কোডটি আর কাজ করবে না।")}
              confirmLabel={t("Delete", "মুছুন")}
              onConfirm={() =>
                remove.mutate(rx.id, {
                  onSuccess: () => {
                    toast.success(t("Prescription deleted", "প্রেসক্রিপশন মুছে ফেলা হয়েছে"));
                    router.push("/dashboard/issue");
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
              trigger={
                <Button variant="destructive" aria-label={t("Delete", "মুছুন")}>
                  <Trash2 />
                </Button>
              }
            />
          )}
        </div>
      </div>

      {rx.claimedAt ? (
        <Alert className="border-primary/30 bg-secondary print:hidden">
          <CheckCircle2 className="text-primary" />
          <AlertDescription>
            {t(
              `Added to ${rx.claimedBy?.name ?? "the patient"}'s SmartMed account on ${fmtDateTime(rx.claimedAt)}.`,
              `${rx.claimedBy?.name ?? "রোগী"} ${fmtDateTime(rx.claimedAt)} এ স্মার্টমেডে যোগ করেছেন।`,
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-primary/30 bg-secondary print:hidden">
          <AlertDescription>
            {t(
              "Ask the patient to scan the QR code with their phone camera — their medicines and reminders are added automatically.",
              "রোগীকে ফোনের ক্যামেরা দিয়ে QR কোডটি স্ক্যান করতে বলুন — ওষুধ ও রিমাইন্ডার নিজে থেকেই যোগ হয়ে যাবে।",
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* The printable sheet */}
      <article className="mx-auto max-w-3xl rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-primary pb-5">
          <div>
            <p className="text-2xl font-bold text-primary">{rx.source === "DOCTOR" ? `Dr. ${issuer?.name}` : issuer?.organization}</p>
            {issuer?.specialty && <p className="text-muted-foreground">{issuer.specialty}</p>}
            <p className="text-muted-foreground">{rx.source === "DOCTOR" ? issuer?.organization : issuer?.name}</p>
            {issuer?.licenseNumber && (
              <p className="text-sm text-muted-foreground">
                {rx.source === "DOCTOR" ? "BMDC" : t("Licence", "লাইসেন্স")}: {issuer.licenseNumber}
              </p>
            )}
          </div>
          <div className="text-right text-sm">
            <p>
              {t("Date", "তারিখ")}: <strong>{fmtDate(rx.createdAt)}</strong>
            </p>
            {issuer?.isProVerified ? (
              <Badge className="mt-2 gap-1">
                <BadgeCheck className="size-3.5" /> {t("Verified on SmartMed", "স্মার্টমেডে যাচাইকৃত")}
              </Badge>
            ) : (
              <Badge variant="outline" className="mt-2 gap-1 print:hidden">
                <ShieldAlert className="size-3.5" /> {t("Verification pending", "যাচাই বাকি")}
              </Badge>
            )}
          </div>
        </header>

        <section className="mt-5 grid gap-2 text-base sm:grid-cols-3">
          <p className="sm:col-span-2">
            {t("Patient", "রোগী")}: <strong>{rx.patientName}</strong>
          </p>
          <p>{[rx.patientAge != null && t(`${rx.patientAge} yrs`, `${n(rx.patientAge)} বছর`), genderLabel].filter(Boolean).join(" · ")}</p>
          {rx.diagnosis && (
            <p className="sm:col-span-3">
              {t("Diagnosis", "রোগ নির্ণয়")}: <strong>{rx.diagnosis}</strong>
            </p>
          )}
        </section>

        <section className="mt-6">
          <p className="font-serif text-3xl font-bold text-primary italic">℞</p>
          <ol className="mt-3 space-y-4">
            {rx.items.map((m, i) => (
              <li key={i} className="border-b pb-3 last:border-b-0">
                <p className="text-lg font-semibold">
                  {n(i + 1)}. {m.name} {m.strength}
                  {m.form && <span className="text-base font-normal text-muted-foreground"> · {m.form}</span>}
                </p>
                <p className="text-base">
                  {[m.dosagePattern, t(MEAL_LABELS[m.mealTiming].en, MEAL_LABELS[m.mealTiming].bn), m.durationDays && t(`${m.durationDays} days`, `${n(m.durationDays)} দিন`)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {m.reminders.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("Times", "সময়")}: {m.reminders.map((r) => `${fmtTime(r.time)} × ${n(r.quantity)}`).join(", ")}
                  </p>
                )}
                {(m.instructionsBn || m.instructions) && <p className="text-sm">{m.instructionsBn || m.instructions}</p>}
              </li>
            ))}
          </ol>
        </section>

        {(rx.advice || rx.followUpDate) && (
          <section className="mt-5 rounded-xl bg-secondary p-4 text-base print:border print:bg-transparent">
            {rx.advice && (
              <p>
                <strong>{t("Advice", "পরামর্শ")}:</strong> {rx.advice}
              </p>
            )}
            {rx.followUpDate && (
              <p className="mt-1">
                <strong>{t("Follow-up", "পরবর্তী সাক্ষাৎ")}:</strong> {fmtDate(rx.followUpDate)}
              </p>
            )}
          </section>
        )}

        <footer className="mt-8 flex flex-col items-center gap-5 border-t pt-6 sm:flex-row">
          <div className="rounded-xl border-2 border-primary bg-white p-3">
            <QRCodeSVG value={rx.claimUrl} size={132} level="M" fgColor="#1b3886" aria-label={t("QR code for SmartMed", "স্মার্টমেডের QR কোড")} />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-lg font-bold text-primary">{t("Scan for Bangla medicine reminders", "বাংলায় ওষুধের রিমাইন্ডার পেতে স্ক্যান করুন")}</p>
            <p className="text-sm text-muted-foreground">
              {t("Open your phone camera and point it at the code, or visit", "ফোনের ক্যামেরা QR কোডের দিকে ধরুন, অথবা এই ঠিকানায় যান")}:
            </p>
            <p className="mt-1 font-mono text-sm break-all">{rx.claimUrl}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Code valid until", "কোডের মেয়াদ")} {fmtDate(rx.expiresAt)}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}
