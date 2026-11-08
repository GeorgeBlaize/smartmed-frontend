"use client";

import { Camera, FileText, Search, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Pagination } from "@/components/shared/pagination";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate } from "@/lib/format";
import type { PrescriptionStatus } from "@/types";
import { usePrescriptions } from "./api";
import { PrescriptionStatusBadge } from "./status-badge";
import { UploadPrescriptionDialog } from "./upload-dialog";
import { useT } from "@/hooks/use-t";
import { RxThumb } from "@/components/shared/rx-thumb";

export function PrescriptionList({ patientId, openUpload = false }: { patientId?: string; openUpload?: boolean }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PrescriptionStatus | "ALL">("ALL");
  const { data, isLoading, error, refetch, isFetching } = usePrescriptions({
    patientId,
    page,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
  });
  const qs = patientId ? `?patientId=${patientId}` : "";
  const { t, n } = useT();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("Search by doctor, hospital, diagnosis or medicine", "ডাক্তার, হাসপাতাল, রোগ বা ওষুধের নাম দিয়ে খুঁজুন")}
            className="pl-9"
            aria-label={t("Search prescriptions", "প্রেসক্রিপশন খুঁজুন")}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as PrescriptionStatus | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-48" aria-label={t("Filter by status", "অবস্থা অনুযায়ী")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("All statuses", "সব অবস্থা")}</SelectItem>
            <SelectItem value="VERIFIED">{t("Verified", "যাচাইকৃত")}</SelectItem>
            <SelectItem value="PROCESSED">{t("Needs review", "যাচাই করুন")}</SelectItem>
            <SelectItem value="FAILED">{t("Manual entry", "নিজে লিখুন")}</SelectItem>
          </SelectContent>
        </Select>
        <UploadPrescriptionDialog
          defaultOpen={openUpload}
          patientId={patientId}
          trigger={
            <Button>
              <Camera /> {t("Upload", "আপলোড")}
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={<FileText />}
          title={search || status !== "ALL" ? t("No prescriptions match", "কোনো প্রেসক্রিপশন মেলেনি") : t("Your prescription history is empty", "এখনো কোনো প্রেসক্রিপশন নেই")}
          description={t("Every prescription you upload is stored safely here, sorted by date.", "আপলোড করা সব প্রেসক্রিপশন এখানে তারিখ অনুযায়ী নিরাপদে থাকবে।")}
          action={
            <UploadPrescriptionDialog
              patientId={patientId}
              trigger={
                <Button>
                  <Camera /> {t("Upload your first prescription", "প্রথম প্রেসক্রিপশন আপলোড করুন")}
                </Button>
              }
            />
          }
        />
      ) : (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? "opacity-70" : ""}`}>
            {data.items.map((p) => (
              <Link key={p.id} href={`/dashboard/prescriptions/${p.id}${qs}`} className="group rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                <Card className="h-full overflow-hidden py-0 transition-shadow group-hover:shadow-md">
                  <div className="relative h-36 bg-muted">
                    <RxThumb url={p.imageUrl} source={p.source} />
                    <div className="absolute top-2 right-2">
                      <PrescriptionStatusBadge status={p.status} />
                    </div>
                  </div>
                  <CardContent className="space-y-2 pb-5">
                    <h3 className="truncate font-semibold">{p.title || p.diagnosis || t("Prescription", "প্রেসক্রিপশন")}</h3>
                    <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                      <Stethoscope className="size-4 shrink-0" /> {p.doctorName || t("Doctor not detected", "ডাক্তারের নাম পাওয়া যায়নি")}
                    </p>
                    <p className="text-sm text-muted-foreground">{fmtDate(p.prescribedDate ?? p.createdAt)}</p>
                    {p.medicines.length > 0 && (
                      <p className="line-clamp-2 text-sm">
                        <strong>{n(p.medicines.length)}</strong> {t(p.medicines.length > 1 ? "medicines" : "medicine", "টি ওষুধ")}: {p.medicines.map((m) => m.name).join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={data.meta?.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </div>
  );
}
