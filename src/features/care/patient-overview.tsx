"use client";

import { AlertTriangle, ArrowLeft, Droplet, Phone, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ErrorState, PageLoader } from "@/components/shared/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdherenceInsightPanel } from "@/features/ai/adherence-insight-panel";
import { InteractionChecker } from "@/features/ai/interaction-checker";
import { CabinetView } from "@/features/cabinet/cabinet-view";
import { DoseHistory } from "@/features/doses/dose-history";
import { TodaySchedule } from "@/features/doses/today-schedule";
import { MedicineList } from "@/features/medicines/medicine-list";
import { PrescriptionList } from "@/features/prescriptions/prescription-list";
import { ageFromDob, fmtDate, initials } from "@/lib/format";
import { usePatientOverview } from "./api";
import { PatientAlertsCard } from "./patient-alerts-card";
import { useT } from "@/hooks/use-t";

/** Caregiver's complete view of one patient – every tab reuses the patient's own feature components. */
export function PatientOverviewView({ patientId }: { patientId: string }) {
  const { data, isLoading, error, refetch } = usePatientOverview(patientId);
  const { t, n } = useT();

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;

  const { patient, today, weekly, expiringItems } = data;
  const age = ageFromDob(patient.dateOfBirth);

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-3" asChild>
        <Link href="/dashboard">
          <ArrowLeft /> {t("All patients", "সব রোগী")}
        </Link>
      </Button>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Avatar className="size-12">
              {patient.avatarUrl && <AvatarImage src={patient.avatarUrl} alt="" />}
              <AvatarFallback className="bg-secondary text-primary">{initials(patient.name)}</AvatarFallback>
            </Avatar>
            {patient.name}
          </span>
        }
        description={[age && t(`${age} years`, `${n(age)} বছর`), patient.email].filter(Boolean).join(" · ")}
        actions={
          patient.phone ? (
            <Button asChild>
              <a href={`tel:${patient.phone}`}>
                <Phone /> {t(`Call ${patient.name.split(" ")[0]}`, `${patient.name.split(" ")[0]} কে কল করুন`)}
              </a>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {patient.bloodGroup && (
          <Badge variant="outline" className="gap-1">
            <Droplet className="size-3" /> {patient.bloodGroup}
          </Badge>
        )}
        {patient.allergies.map((a) => (
          <Badge key={a} variant="destructive" className="gap-1">
            <ShieldAlert className="size-3" /> {t("Allergy", "অ্যালার্জি")}: {a}
          </Badge>
        ))}
        {patient.chronicConditions.map((c) => (
          <Badge key={c} variant="secondary">
            {c}
          </Badge>
        ))}
        {patient.emergencyContact && <Badge variant="outline">{t("Emergency", "জরুরি")}: {patient.emergencyContact}</Badge>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("Taken today", "আজ খেয়েছেন")} value={n(`${today.summary.taken}/${today.summary.total}`)} tone="primary" />
        <StatCard label={t("Missed today", "আজ বাদ পড়েছে")} value={n(today.summary.missed)} tone={today.summary.missed ? "danger" : "muted"} />
        <StatCard label={t("7-day adherence", "৭ দিনের নিয়মিততা")} value={weekly.adherenceRate === null ? "—" : n(`${weekly.adherenceRate}%`)} tone="success" />
        <StatCard label={t("Expiring medicines", "মেয়াদ শেষ হচ্ছে")} value={n(expiringItems.length)} tone={expiringItems.length ? "warning" : "muted"} />
      </div>

      {expiringItems.length > 0 && (
        <Card className="mb-6 border-primary/30 bg-secondary">
          <CardContent className="flex items-start gap-3">
            <AlertTriangle className="size-5 shrink-0 text-primary" />
            <p className="text-sm">
              {t("Expiring / expired at home", "ঘরে মেয়াদ শেষ / শেষ হচ্ছে")}: {expiringItems.map((i) => `${i.name} (${fmtDate(i.expiryDate)})`).join(", ")}
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="today">
        <TabsList className="mb-4 flex h-auto flex-wrap">
          <TabsTrigger value="today">{t("Today", "আজ")}</TabsTrigger>
          <TabsTrigger value="medicines">{t("Medicines", "ওষুধ")}</TabsTrigger>
          <TabsTrigger value="prescriptions">{t("Prescriptions", "প্রেসক্রিপশন")}</TabsTrigger>
          <TabsTrigger value="history">{t("History", "ইতিহাস")}</TabsTrigger>
          <TabsTrigger value="cabinet">{t("Cabinet", "ওষুধের বাক্স")}</TabsTrigger>
          <TabsTrigger value="insights">{t("AI insights", "এআই রিপোর্ট")}</TabsTrigger>
          <TabsTrigger value="alerts">{t("Phone alerts", "ফোন অ্যালার্ট")}</TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <TodaySchedule data={today} isLoading={false} error={null} onRetry={refetch} patientId={patientId} emptyAction={false} />
        </TabsContent>
        <TabsContent value="medicines">
          <MedicineList patientId={patientId} />
        </TabsContent>
        <TabsContent value="prescriptions">
          <PrescriptionList patientId={patientId} />
        </TabsContent>
        <TabsContent value="history">
          <DoseHistory patientId={patientId} />
        </TabsContent>
        <TabsContent value="cabinet">
          <CabinetView patientId={patientId} />
        </TabsContent>
        <TabsContent value="insights">
          <div className="space-y-6">
            <AdherenceInsightPanel patientId={patientId} />
            <InteractionChecker patientId={patientId} />
          </div>
        </TabsContent>
        <TabsContent value="alerts">
          <PatientAlertsCard key={`${patient.phone}-${patient.smsEnabled}-${patient.callEnabled}`} patientId={patientId} patient={patient} />
        </TabsContent>
      </Tabs>
    </>
  );
}
