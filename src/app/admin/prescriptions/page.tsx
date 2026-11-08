"use client";

import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAdminPrescriptions, useRemovePrescription } from "@/features/admin/api";
import { ListToolbar } from "@/features/admin/list-toolbar";
import { PrescriptionStatusBadge } from "@/features/prescriptions/status-badge";
import { errorMessage } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { Prescription } from "@/types";
import { useT } from "@/hooks/use-t";
import { RxThumb } from "@/components/shared/rx-thumb";

function RemoveDialog({ rx }: { rx: Prescription }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const remove = useRemovePrescription();
  const { t } = useT();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 /> {t("Remove", "সরান")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Remove this upload?", "এই আপলোড সরাবেন?")}</DialogTitle>
          <DialogDescription>{t("Use for non-medical or inappropriate images. The action is recorded in the audit log.", "চিকিৎসা-বহির্ভূত বা অনুপযুক্ত ছবির জন্য। এই কাজ অডিট লগে রেকর্ড থাকবে।")}</DialogDescription>
        </DialogHeader>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("Reason (e.g. not a prescription)", "কারণ (যেমন: প্রেসক্রিপশন নয়)")} aria-label={t("Reason", "কারণ")} />
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(
                { id: rx.id, reason: reason || undefined },
                {
                  onSuccess: () => {
                    toast.success(t("Upload removed", "আপলোড সরানো হয়েছে"));
                    setOpen(false);
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                },
              )
            }
          >
            {remove.isPending && <Loader2 className="animate-spin" />} {t("Remove", "সরান")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPrescriptionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const { t } = useT();
  const { data, isLoading, error, refetch } = useAdminPrescriptions({ page, search: search || undefined, status: status === "ALL" ? undefined : status });

  return (
    <>
      <PageHeader title={t("Prescription moderation", "প্রেসক্রিপশন মডারেশন")} description={t("Review uploads and remove non-medical content.", "আপলোড দেখুন ও চিকিৎসা-বহির্ভূত কন্টেন্ট সরান।")} />
      <ListToolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder={t("Search by patient or doctor", "রোগী বা ডাক্তার দিয়ে খুঁজুন")}
        filters={[
          {
            label: t("Status", "অবস্থা"),
            value: status,
            onChange: (v) => {
              setStatus(v);
              setPage(1);
            },
            options: [
              { value: "ALL", label: t("All statuses", "সব অবস্থা") },
              { value: "VERIFIED", label: t("Verified", "যাচাইকৃত") },
              { value: "PROCESSED", label: t("Needs review", "যাচাই বাকি") },
              { value: "FAILED", label: t("Failed", "ব্যর্থ") },
            ],
          },
        ]}
      />
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <EmptyState title={t("No prescriptions found", "কোনো প্রেসক্রিপশন পাওয়া যায়নি")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((rx) => (
            <Card key={rx.id} className="overflow-hidden py-0">
              {rx.imageUrl ? (
                <a href={rx.imageUrl} target="_blank" rel="noreferrer" className="relative block h-40 bg-muted">
                  <RxThumb url={rx.imageUrl} source={rx.source} height={320} />
                  <ExternalLink className="absolute top-2 right-2 size-5 rounded bg-background/80 p-0.5" />
                </a>
              ) : (
                <div className="h-40">
                  <RxThumb url={null} source={rx.source} />
                </div>
              )}
              <CardContent className="space-y-2 pb-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{rx.patient?.name}</p>
                  <PrescriptionStatusBadge status={rx.status} />
                </div>
                <p className="truncate text-xs text-muted-foreground">{rx.patient?.email}</p>
                <p className="text-sm">
                  {rx.doctorName || t("Unknown doctor", "অজানা ডাক্তার")} · {fmtDate(rx.createdAt)}
                </p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{rx.medicines.map((m) => m.name).join(", ") || t("No medicines", "কোনো ওষুধ নেই")}</p>
                {rx.failureReason && <p className="text-xs text-destructive">{rx.failureReason}</p>}
                <RemoveDialog rx={rx} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={data?.meta?.totalPages ?? 1} onChange={setPage} />
    </>
  );
}
