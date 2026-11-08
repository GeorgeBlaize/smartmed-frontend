"use client";

import { BadgeCheck, FilePlus2, ScanLine, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import type { User } from "@/types";
import { IssuedList } from "./issued-list";

/** Home screen for doctors and pharmacies. */
export function ProHome({ user }: { user: User }) {
  const { t } = useT();
  const isPharmacy = user.role === "PHARMACY";

  return (
    <>
      <PageHeader
        title={isPharmacy ? (user.organization ?? user.name) : `${t("Welcome", "স্বাগতম")}, Dr. ${user.name.split(" ")[0]}`}
        description={
          isPharmacy
            ? t("Read prescriptions with AI and give customers Bangla reminders.", "এআই দিয়ে প্রেসক্রিপশন পড়ুন, গ্রাহকদের বাংলায় রিমাইন্ডার দিন।")
            : t("Write digital prescriptions your patients can scan into SmartMed.", "ডিজিটাল প্রেসক্রিপশন লিখুন — রোগী স্ক্যান করলেই স্মার্টমেডে চলে যাবে।")
        }
        actions={
          <Button size="lg" asChild>
            <Link href="/dashboard/issue/new">
              {isPharmacy ? <ScanLine /> : <FilePlus2 />} {isPharmacy ? t("Scan prescription", "প্রেসক্রিপশন স্ক্যান") : t("Write prescription", "প্রেসক্রিপশন লিখুন")}
            </Link>
          </Button>
        }
      />

      {user.isProVerified ? (
        <Alert className="mb-6 border-primary/30 bg-secondary">
          <BadgeCheck className="text-primary" />
          <AlertTitle>{t("Verified account", "যাচাইকৃত অ্যাকাউন্ট")}</AlertTitle>
          <AlertDescription>{t("Patients see a verified badge on your prescriptions.", "রোগীরা আপনার প্রেসক্রিপশনে যাচাইকৃত চিহ্ন দেখতে পাবেন।")}</AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 border-primary/30 bg-secondary">
          <ShieldAlert className="text-primary" />
          <AlertTitle>{t("Verification pending", "যাচাই বাকি")}</AlertTitle>
          <AlertDescription>
            {t(
              `SmartMed is checking your ${isPharmacy ? "drug licence" : "BMDC registration"} (${user.licenseNumber ?? "—"}). Until then patients see an "unverified" notice.`,
              `স্মার্টমেড আপনার ${isPharmacy ? "ড্রাগ লাইসেন্স" : "BMDC রেজিস্ট্রেশন"} (${user.licenseNumber ?? "—"}) যাচাই করছে। ততদিন রোগীরা "অযাচাইকৃত" সতর্কতা দেখবেন।`,
            )}
          </AlertDescription>
        </Alert>
      )}

      <h2 className="mb-3 text-xl font-semibold">{t("Recent", "সাম্প্রতিক")}</h2>
      <IssuedList role={user.role} compact />
      <div className="mt-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/issue">{t("See all", "সব দেখুন")}</Link>
        </Button>
      </div>
    </>
  );
}
