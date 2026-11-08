"use client";

import { Loader2, MessageSquareText, PhoneCall } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/hooks/use-t";
import { errorMessage } from "@/lib/api";
import type { PatientOverview } from "@/types";
import { useUpdatePatientAlerts } from "./api";

/** A caregiver sets up SMS / voice-call reminders for an elder who has only a basic phone. */
export function PatientAlertsCard({ patientId, patient }: { patientId: string; patient: PatientOverview["patient"] }) {
  const { t } = useT();
  const update = useUpdatePatientAlerts(patientId);
  const [phone, setPhone] = useState(patient.phone ?? "");
  const [sms, setSms] = useState(patient.smsEnabled);
  const [call, setCall] = useState(patient.callEnabled);
  const first = patient.name.split(" ")[0];
  const dirty = phone.trim() !== (patient.phone ?? "") || sms !== patient.smsEnabled || call !== patient.callEnabled;
  const noPhone = !phone.trim();

  const save = () =>
    update.mutate(
      { phone: phone.trim() || null, smsEnabled: noPhone ? false : sms, callEnabled: noPhone ? false : call },
      { onSuccess: () => toast.success(t("Alerts updated", "অ্যালার্ট আপডেট হয়েছে")), onError: (e) => toast.error(errorMessage(e)) },
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`Phone alerts for ${first}`, `${first}-এর ফোন অ্যালার্ট`)}</CardTitle>
        <CardDescription>
          {t(
            "Perfect for a button phone: SmartMed texts or calls this number at every dose time.",
            "বাটন ফোনের জন্য উপযুক্ত: প্রতিটি ডোজের সময় স্মার্টমেড এই নম্বরে মেসেজ বা কল দেবে।",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="pa-phone">{t("Their mobile number", "তাঁর মোবাইল নম্বর")}</Label>
          <Input id="pa-phone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="pa-sms" className="flex items-center gap-2 text-base">
            <MessageSquareText className="size-5 text-primary" aria-hidden /> {t("SMS at every dose", "প্রতি ডোজে SMS")}
          </Label>
          <Switch id="pa-sms" checked={sms && !noPhone} disabled={noPhone} onCheckedChange={setSms} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="pa-call" className="flex items-center gap-2 text-base">
            <PhoneCall className="size-5 text-primary" aria-hidden /> {t("Voice call at every dose", "প্রতি ডোজে ভয়েস কল")}
          </Label>
          <Switch id="pa-call" checked={call && !noPhone} disabled={noPhone} onCheckedChange={setCall} />
        </div>
        <Button onClick={save} disabled={!dirty || update.isPending}>
          {update.isPending && <Loader2 className="animate-spin" />} {t("Save alerts", "অ্যালার্ট সংরক্ষণ")}
        </Button>
      </CardContent>
    </Card>
  );
}
