"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { PageLoader } from "@/components/shared/states";
import { ClaimView } from "@/features/issued/claim-view";

function Content() {
  const { code } = useParams<{ code: string }>();
  return <ClaimView code={code} />;
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Content />
    </Suspense>
  );
}
