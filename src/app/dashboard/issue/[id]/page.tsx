"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { PageLoader } from "@/components/shared/states";
import { IssuedSheet } from "@/features/issued/issued-sheet";
import { ProOnly } from "@/features/issued/pro-only";

function Content() {
  const { id } = useParams<{ id: string }>();
  return <ProOnly>{() => <IssuedSheet id={id} />}</ProOnly>;
}

export default function IssuedDetailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Content />
    </Suspense>
  );
}
