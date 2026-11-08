"use client";

import { PageHeader } from "@/components/shared/page-header";
import { IssueForm } from "@/features/issued/issue-form";
import { ProOnly } from "@/features/issued/pro-only";
import { useT } from "@/hooks/use-t";

export default function NewIssuedPage() {
  const { t } = useT();
  return (
    <ProOnly>
      {(user) => (
        <>
          <PageHeader
            title={user.role === "PHARMACY" ? t("Scan a prescription", "প্রেসক্রিপশন স্ক্যান করুন") : t("Write a prescription", "প্রেসক্রিপশন লিখুন")}
            description={t(
              "After saving you get a printable prescription with a QR code for the patient.",
              "সংরক্ষণের পর রোগীর জন্য QR কোডসহ প্রিন্টযোগ্য প্রেসক্রিপশন পাবেন।",
            )}
          />
          <IssueForm role={user.role} />
        </>
      )}
    </ProOnly>
  );
}
