"use client";

import { Camera, ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/use-t";

/**
 * Photo picker with a big "Take photo" button (opens the rear camera on phones)
 * and a gallery option. Images are compressed client-side before upload.
 */
export function ImagePicker({
  file,
  onChange,
  disabled,
  className,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const { t } = useT();
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  // Revoke only the URL a new photo replaced. Revoking in an effect cleanup breaks the preview under
  // React Strict Mode, which unmounts and remounts once while the memoised URL stays the same.
  const shownUrl = useRef<string | null>(null);
  useEffect(() => {
    if (shownUrl.current && shownUrl.current !== preview) URL.revokeObjectURL(shownUrl.current);
    shownUrl.current = preview;
  }, [preview]);

  const handle = async (list: FileList | null) => {
    const picked = list?.[0];
    if (picked) onChange(await compressImage(picked));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={preview} alt={t("Selected photo preview", "নির্বাচিত ছবি")} className="mx-auto max-h-72 object-contain" />
          {!disabled && (
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => onChange(null)}
              aria-label={t("Remove photo", "ছবি সরান")}
            >
              <X />
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" size="lg" className="h-24 flex-col gap-1" disabled={disabled} onClick={() => cameraRef.current?.click()}>
            <Camera className="size-7!" />
            {t("Take photo", "ছবি তুলুন")}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-24 flex-col gap-1"
            disabled={disabled}
            onClick={() => galleryRef.current?.click()}
          >
            <ImagePlus className="size-7!" />
            {t("Choose from gallery", "গ্যালারি থেকে নিন")}
          </Button>
        </div>
      )}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handle(e.target.files)} />
      <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" hidden onChange={(e) => handle(e.target.files)} />
      <p className="text-xs text-muted-foreground">{t("Tip: use good light, keep the paper flat and fill the frame. Max 8 MB.", "পরামর্শ: ভালো আলোতে, কাগজ সমান রেখে পুরো ফ্রেম জুড়ে ছবি তুলুন। সর্বোচ্চ ৮ MB।")}</p>
    </div>
  );
}
