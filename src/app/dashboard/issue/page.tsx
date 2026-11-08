"use client";

import { PageHeader } from "@/components/shared/page-header";
import { IssuedList } from "@/features/issued/issued-list";
import { ProOnly } from "@/features/issued/pro-only";
import { useT } from "@/hooks/use-t";

export default function IssuedPage() {
  const { t } = useT();
  return (
    <ProOnly>
      {(user) => (
        <>
          <PageHeader
            title={user.role === "PHARMACY" ? t("Handed to customers", "গ্রাহকদের দেওয়া") : t("My prescriptions", "আমার প্রেসক্রিপশন")}
            description={t("See which patients have added your prescriptions to SmartMed.", "কোন রোগী আপনার প্রেসক্রিপশন স্মার্টমেডে যোগ করেছেন দেখুন।")}
          />
          <IssuedList role={user.role} />
        </>
      )}
    </ProOnly>
  );
}
