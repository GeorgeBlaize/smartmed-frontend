"use client";

import { CheckCircle2, ClipboardList, Clock, FilePlus2, ScanLine, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Pagination } from "@/components/shared/pagination";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/hooks/use-t";
import { fmtDate } from "@/lib/format";
import type { Role } from "@/types";
import { useIssuedList } from "./api";

/** Prescriptions a doctor wrote / a pharmacy scanned, with hand-off status. */
export function IssuedList({ role, compact = false }: { role: Role; compact?: boolean }) {
  const { t, n } = useT();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useIssuedList(page, search || undefined);
  const isPharmacy = role === "PHARMACY";

  return (
    <div className="space-y-5">
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label={t("Total", "মোট")} value={n(data.stats.total)} icon={<ClipboardList />} />
          <StatCard label={t("Added by patients", "রোগী যোগ করেছেন")} value={n(data.stats.claimed)} icon={<CheckCircle2 />} tone="success" />
          <StatCard label={t("Waiting", "অপেক্ষমাণ")} value={n(data.stats.pending)} icon={<Clock />} tone="muted" />
        </div>
      )}

      {!compact && (
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("Search by patient or diagnosis", "রোগী বা রোগ নির্ণয় দিয়ে খুঁজুন")}
            aria-label={t("Search", "খুঁজুন")}
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={isPharmacy ? <ScanLine /> : <FilePlus2 />}
          title={search ? t("Nothing matches your search", "কিছু পাওয়া যায়নি") : t("No prescriptions yet", "এখনো কোনো প্রেসক্রিপশন নেই")}
          description={
            isPharmacy
              ? t("Scan a customer's prescription to give them a QR code for reminders.", "গ্রাহকের প্রেসক্রিপশন স্ক্যান করে রিমাইন্ডারের QR কোড দিন।")
              : t("Write a digital prescription — the patient scans its QR code to get reminders.", "ডিজিটাল প্রেসক্রিপশন লিখুন — রোগী QR কোড স্ক্যান করলেই রিমাইন্ডার পাবেন।")
          }
          action={
            <Button asChild>
              <Link href="/dashboard/issue/new">{isPharmacy ? t("Scan prescription", "প্রেসক্রিপশন স্ক্যান") : t("Write prescription", "প্রেসক্রিপশন লিখুন")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {data.items.slice(0, compact ? 5 : undefined).map((rx) => (
              <li key={rx.id}>
                <Link href={`/dashboard/issue/${rx.id}`} className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{rx.patientName}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {[fmtDate(rx.createdAt), rx.diagnosis, t(`${rx.items.length} medicines`, `${n(rx.items.length)}টি ওষুধ`)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {rx.claimedAt ? (
                    <Badge variant="success">{t("Added by patient", "রোগী যোগ করেছেন")}</Badge>
                  ) : (
                    <Badge variant="warning">{t("Waiting for scan", "স্ক্যানের অপেক্ষায়")}</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {!compact && <Pagination page={page} totalPages={data.meta?.totalPages ?? 1} onChange={setPage} />}
        </>
      )}
    </div>
  );
}
