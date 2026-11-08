"use client";

import { FileText, Stethoscope, Store } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";
import type { PrescriptionSource } from "@/types";

/**
 * Prescription thumbnail: the uploaded photo (resized by Cloudinary) or, for digital
 * prescriptions from a doctor, a labelled placeholder.
 */
export function RxThumb({
  url,
  source = "UPLOAD",
  width = 600,
  height = 300,
  className,
}: {
  url: string | null;
  source?: PrescriptionSource;
  width?: number;
  height?: number;
  className?: string;
}) {
  const { t } = useT();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Cloudinary-transformed thumbnail
      <img src={url.replace("/upload/", `/upload/c_fill,w_${width},h_${height},q_auto,f_auto/`)} alt="" loading="lazy" className={cn("size-full object-cover", className)} />
    );
  }
  const Icon = source === "DOCTOR" ? Stethoscope : source === "PHARMACY" ? Store : FileText;
  return (
    <div className={cn("grid size-full place-items-center bg-secondary text-primary", className)}>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <Icon className="size-8" aria-hidden />
        <span className="text-xs font-semibold">
          {source === "DOCTOR" ? t("Digital prescription", "ডিজিটাল প্রেসক্রিপশন") : t("No photo", "ছবি নেই")}
        </span>
      </div>
    </div>
  );
}
