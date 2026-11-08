"use client";

import { Loader2, MessageSquareText, PhoneCall, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/hooks/use-t";
import { errorMessage } from "@/lib/api";
import type { User } from "@/types";
import { useTestAlert, useUpdatePreferences, useUpdateProfile } from "./api";

/** SMS + voice-call reminders for feature phones / no-internet moments. */
export function AlertsCard({ user }: { user: User }) {
  const { t } = useT();
  const prefs = useUpdatePreferences();
  const profile = useUpdateProfile();
  const test = useTestAlert();
  const [phone, setPhone] = useState(user.phone ?? "");
  const hasPhone = Boolean(user.phone);
  const caregiver = user.role === "CAREGIVER";

  const toggle = (patch: { smsEnabled?: boolean; callEnabled?: boolean }) =>
    prefs.mutate(patch, {
      onSuccess: () => toast.success(t("Alert setting saved", "অ্যালার্ট সেটিং সংরক্ষণ হয়েছে")),
      onError: (e) => toast.error(errorMessage(e)),
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("SMS & phone-call alerts", "SMS ও ফোন কল অ্যালার্ট")}</CardTitle>
        <CardDescription>
          {t(
            "Reminders reach your phone even without internet or a smartphone. Calls are read aloud in your language.",
            "ইন্টারনেট বা স্মার্টফোন ছাড়াও রিমাইন্ডার ফোনে পৌঁছাবে। কলে আপনার ভাষায় পড়ে শোনানো হবে।",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="alert-phone">{t("Mobile number", "মোবাইল নম্বর")}</Label>
          <div className="flex gap-2">
            <Input id="alert-phone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button
              variant="outline"
              disabled={profile.isPending || phone.trim() === (user.phone ?? "")}
              onClick={() =>
                profile.mutate(
                  { phone: phone.trim() || null },
                  { onSuccess: () => toast.success(t("Number saved", "নম্বর সংরক্ষণ হয়েছে")), onError: (e) => toast.error(errorMessage(e)) },
                )
              }
            >
              {profile.isPending && <Loader2 className="animate-spin" />} {t("Save", "সংরক্ষণ")}
            </Button>
          </div>
          {!hasPhone && <p className="text-sm text-muted-foreground">{t("Add a number first to turn on SMS or calls.", "SMS বা কল চালু করতে আগে নম্বর দিন।")}</p>}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <MessageSquareText className="mt-0.5 size-5 text-primary" aria-hidden />
            <div>
              <Label htmlFor="alert-sms" className="text-base">{t("SMS reminders", "SMS রিমাইন্ডার")}</Label>
              <p className="text-sm text-muted-foreground">
                {caregiver
                  ? t("Get a text when someone you care for misses a dose.", "আপনার দেখাশোনার মানুষ ডোজ মিস করলে মেসেজ পাবেন।")
                  : t("A text message for every dose, plus low-stock and expiry warnings.", "প্রতিটি ডোজে একটি মেসেজ, সাথে ওষুধ ফুরানো ও মেয়াদের সতর্কতা।")}
              </p>
            </div>
          </div>
          <Switch id="alert-sms" checked={user.smsEnabled} disabled={!hasPhone || prefs.isPending} onCheckedChange={(v) => toggle({ smsEnabled: v })} />
        </div>

        {!caregiver && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <PhoneCall className="mt-0.5 size-5 text-primary" aria-hidden />
            <div>
              <Label htmlFor="alert-call" className="text-base">{t("Voice call reminders", "ভয়েস কল রিমাইন্ডার")}</Label>
              <p className="text-sm text-muted-foreground">{t("The phone rings and a voice says which medicine to take — ideal for elders.", "ফোন বাজবে আর একটি কণ্ঠ বলবে কোন ওষুধ খেতে হবে — বয়স্কদের জন্য উপযোগী।")}</p>
            </div>
          </div>
          <Switch id="alert-call" checked={user.callEnabled} disabled={!hasPhone || prefs.isPending} onCheckedChange={(v) => toggle({ callEnabled: v })} />
        </div>
        )}

        <Button
          variant="secondary"
          disabled={!hasPhone || test.isPending || (!user.smsEnabled && !user.callEnabled)}
          onClick={() =>
            test.mutate(undefined, {
              onSuccess: ({ data }) =>
                data.smsConfigured
                  ? toast.success(t("Test alert sent — check your phone", "টেস্ট অ্যালার্ট পাঠানো হয়েছে — ফোন দেখুন"))
                  : toast.info(t("SMS provider is not connected yet — the message was only logged on the server.", "SMS সার্ভিস এখনো যুক্ত হয়নি — মেসেজটি শুধু সার্ভারে লগ হয়েছে।")),
              onError: (e) => toast.error(errorMessage(e)),
            })
          }
        >
          {test.isPending ? <Loader2 className="animate-spin" /> : <Send />} {t("Send a test", "টেস্ট পাঠান")}
        </Button>
      </CardContent>
    </Card>
  );
}
