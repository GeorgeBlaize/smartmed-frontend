"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useMe } from "@/features/auth/api";
import { ClaimCodeCard } from "@/features/issued/claim-code-card";
import { PrescriptionList } from "@/features/prescriptions/prescription-list";
import { T } from "@/components/shared/t";

function Content() {
  const params = useSearchParams();
  const { data: me } = useMe();
  const patientId = params.get("patientId") ?? undefined;
  return (
    <div className="space-y-5">
      {me?.role === "PATIENT" && !patientId && <ClaimCodeCard />}
      <PrescriptionList openUpload={params.get("upload") === "1"} patientId={patientId} />
    </div>
  );
}

export default function PrescriptionsPage() {
  return (
    <>
      <PageHeader title={<T en="Prescriptions" bn="প্রেসক্রিপশন" />} description={<T en="Your digital prescription history — never lose a paper prescription again." bn="আপনার ডিজিটাল প্রেসক্রিপশন ইতিহাস — কাগজ হারানোর ভয় আর নেই।" />} />
      <Suspense>
        <Content />
      </Suspense>
    </>
  );
}
