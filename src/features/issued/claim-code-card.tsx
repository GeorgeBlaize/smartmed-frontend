"use client";

import { QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useT } from "@/hooks/use-t";
import { extractClaimCode } from "./api";

/** Lets a patient type or paste the code printed under a doctor's / pharmacy's QR. */
export function ClaimCodeCard() {
  const router = useRouter();
  const { t } = useT();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = extractClaimCode(value);
    if (!code) return setError(true);
    router.push(`/claim/${code}`);
  };

  return (
    <Card className="border-primary/30 bg-secondary/60">
      <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-start gap-3 md:flex-1">
          <QrCode className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-semibold">{t("Got a prescription with a QR code?", "QR কোডসহ প্রেসক্রিপশন পেয়েছেন?")}</p>
            <p className="text-sm text-muted-foreground">
              {t("Scan it with your phone camera, or type the code printed under it.", "ফোনের ক্যামেরা দিয়ে স্ক্যান করুন, অথবা নিচে লেখা কোডটি দিন।")}
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="flex gap-2 md:w-96" noValidate>
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder={t("Code or link", "কোড বা লিংক")}
            aria-label={t("Prescription code", "প্রেসক্রিপশন কোড")}
            aria-invalid={error}
          />
          <Button type="submit">{t("Open", "খুলুন")}</Button>
        </form>
        {error && <p className="text-sm text-destructive md:basis-full">{t("That code doesn't look right — check it and try again.", "কোডটি সঠিক মনে হচ্ছে না — আবার দেখে দিন।")}</p>}
      </CardContent>
    </Card>
  );
}
