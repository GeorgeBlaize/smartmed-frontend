"use client";

import { AlertTriangle, CheckCircle2, Loader2, Plus, ScanLine, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePicker } from "@/components/shared/image-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MedicineInput } from "@/features/medicines/api";
import { cleanMedicine, emptyMedicine, MedicineEditor, validateMedicine } from "@/features/medicines/medicine-editor";
import { useT } from "@/hooks/use-t";
import { errorMessage } from "@/lib/api";
import type { IssuedItem, Role } from "@/types";
import { useCreateIssued, useScanForIssue } from "./api";

const toItem = (m: MedicineInput): IssuedItem => {
  const { startDate: _s, endDate: _e, isActive: _a, ...rest } = cleanMedicine(m);
  return { ...rest, reminders: rest.reminders.map(({ id: _id, ...r }) => ({ ...r, isActive: true })) };
};

const fromItem = (i: IssuedItem): MedicineInput => ({
  ...emptyMedicine(),
  ...i,
  genericName: i.genericName ?? "",
  strength: i.strength ?? "",
  form: i.form ?? "tablet",
  dosagePattern: i.dosagePattern ?? "",
  instructions: i.instructions ?? "",
  instructionsBn: i.instructionsBn ?? "",
  durationDays: i.durationDays ?? null,
  reminders: i.reminders.map((r) => ({ time: r.time, quantity: r.quantity, daysOfWeek: r.daysOfWeek ?? [] })),
});

export function IssueForm({ role }: { role: Role }) {
  const router = useRouter();
  const { t, n, lang } = useT();
  const isPharmacy = role === "PHARMACY";
  const create = useCreateIssued();
  const scan = useScanForIssue();

  const [file, setFile] = useState<File | null>(null);
  const [scanned, setScanned] = useState<{ imageUrl: string; imagePublicId: string; confidence: number } | null>(null);
  const [manual, setManual] = useState(!isPharmacy);
  const [patient, setPatient] = useState({ name: "", age: "", gender: "", phone: "" });
  const [clinical, setClinical] = useState({ diagnosis: "", advice: "", followUpDate: "" });
  const [medicines, setMedicines] = useState<MedicineInput[]>(() => (isPharmacy ? [] : [emptyMedicine()]));

  const showForm = !isPharmacy || manual || scanned;

  const runScan = () => {
    if (!file) return;
    scan.mutate(file, {
      onSuccess: (r) => {
        setScanned({ imageUrl: r.imageUrl, imagePublicId: r.imagePublicId, confidence: r.confidence });
        setClinical((c) => ({ ...c, diagnosis: r.diagnosis ?? "", advice: r.advice ?? "" }));
        setMedicines(r.items.length ? r.items.map(fromItem) : [emptyMedicine()]);
        toast.success(t("Prescription read. Please check every medicine.", "প্রেসক্রিপশন পড়া হয়েছে। প্রতিটি ওষুধ মিলিয়ে দেখুন।"));
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  const submit = () => {
    if (patient.name.trim().length < 2) return toast.error(t("Enter the patient's name", "রোগীর নাম লিখুন"));
    if (!medicines.length) return toast.error(t("Add at least one medicine", "অন্তত একটি ওষুধ যোগ করুন"));
    for (const [i, m] of medicines.entries()) {
      const problem = validateMedicine(m, lang);
      if (problem) return toast.error(`${t("Medicine", "ওষুধ")} ${n(i + 1)}: ${problem}`);
    }
    create.mutate(
      {
        patientName: patient.name.trim(),
        patientAge: patient.age ? Number(patient.age) : null,
        patientGender: (patient.gender || null) as "male" | "female" | "other" | null,
        patientPhone: patient.phone.trim() || null,
        diagnosis: clinical.diagnosis.trim() || null,
        advice: clinical.advice.trim() || null,
        followUpDate: clinical.followUpDate || null,
        imageUrl: scanned?.imageUrl ?? null,
        imagePublicId: scanned?.imagePublicId ?? null,
        items: medicines.map(toItem),
      },
      {
        onSuccess: (res) => {
          toast.success(t("Prescription ready — show the QR code to the patient.", "প্রেসক্রিপশন তৈরি — রোগীকে QR কোড দেখান।"));
          router.push(`/dashboard/issue/${res.data.id}`);
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-6">
      {isPharmacy && !scanned && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="size-5 text-primary" /> {t("Scan the customer's prescription", "গ্রাহকের প্রেসক্রিপশন স্ক্যান করুন")}
            </CardTitle>
            <CardDescription>
              {t(
                "AI reads the handwriting so your staff can dispense the right medicine. The customer then scans the QR code to get reminders.",
                "এআই হাতের লেখা পড়ে দেবে, যাতে সঠিক ওষুধ দেওয়া যায়। এরপর গ্রাহক QR কোড স্ক্যান করে রিমাইন্ডার পাবেন।",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImagePicker file={file} onChange={setFile} disabled={scan.isPending} />
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={runScan} disabled={!file || scan.isPending}>
                {scan.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />} {t("Read with AI", "এআই দিয়ে পড়ুন")}
              </Button>
              {!manual && (
                <Button size="lg" variant="outline" onClick={() => {
                  setManual(true);
                  if (!medicines.length) setMedicines([emptyMedicine()]);
                }}>
                  {t("Enter manually instead", "নিজে লিখে দিন")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {scanned && (
        <Alert className="border-primary/30 bg-secondary">
          <AlertTriangle className="text-primary" />
          <AlertTitle>{t("Check before dispensing", "ওষুধ দেওয়ার আগে মিলিয়ে নিন")}</AlertTitle>
          <AlertDescription>
            {t(
              `AI legibility ${Math.round(scanned.confidence * 100)}%. Compare every medicine with the paper prescription.`,
              `লেখা পড়ার নিশ্চয়তা ${n(Math.round(scanned.confidence * 100))}%। প্রতিটি ওষুধ কাগজের প্রেসক্রিপশনের সাথে মিলিয়ে নিন।`,
            )}
          </AlertDescription>
        </Alert>
      )}

      {showForm && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("Patient", "রোগী")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pt-name">{t("Full name *", "পুরো নাম *")}</Label>
                <Input id="pt-name" value={patient.name} onChange={(e) => setPatient({ ...patient, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pt-age">{t("Age", "বয়স")}</Label>
                <Input id="pt-age" type="number" min={0} max={130} value={patient.age} onChange={(e) => setPatient({ ...patient, age: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pt-gender">{t("Gender", "লিঙ্গ")}</Label>
                <Select value={patient.gender} onValueChange={(v) => setPatient({ ...patient, gender: v })}>
                  <SelectTrigger id="pt-gender" className="w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t("Male", "পুরুষ")}</SelectItem>
                    <SelectItem value="female">{t("Female", "নারী")}</SelectItem>
                    <SelectItem value="other">{t("Other", "অন্যান্য")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pt-phone">{t("Mobile (optional)", "মোবাইল (ঐচ্ছিক)")}</Label>
                <Input id="pt-phone" type="tel" placeholder="01XXXXXXXXX" value={patient.phone} onChange={(e) => setPatient({ ...patient, phone: e.target.value })} />
              </div>
              {!isPharmacy && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="pt-follow">{t("Follow-up date", "পরবর্তী সাক্ষাৎ")}</Label>
                  <Input id="pt-follow" type="date" value={clinical.followUpDate} onChange={(e) => setClinical({ ...clinical, followUpDate: e.target.value })} />
                </div>
              )}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                <Label htmlFor="pt-dx">{t("Diagnosis", "রোগ নির্ণয়")}</Label>
                <Input id="pt-dx" value={clinical.diagnosis} onChange={(e) => setClinical({ ...clinical, diagnosis: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                <Label htmlFor="pt-advice">{t("Advice (tests, diet, rest)", "পরামর্শ (টেস্ট, খাবার, বিশ্রাম)")}</Label>
                <Textarea id="pt-advice" rows={2} value={clinical.advice} onChange={(e) => setClinical({ ...clinical, advice: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {t("Medicines", "ওষুধ")} ({n(medicines.length)})
              </h2>
              <Button variant="outline" size="sm" onClick={() => setMedicines((list) => [...list, emptyMedicine()])}>
                <Plus /> {t("Add medicine", "ওষুধ যোগ করুন")}
              </Button>
            </div>
            {medicines.map((m, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    {n(i + 1)}. {m.name || t("New medicine", "নতুন ওষুধ")}
                  </CardTitle>
                  {medicines.length > 1 && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setMedicines((list) => list.filter((_, idx) => idx !== i))}>
                      <Trash2 /> {t("Remove", "সরান")}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <MedicineEditor idPrefix={`issue-${i}`} value={m} onChange={(v) => setMedicines((list) => list.map((item, idx) => (idx === i ? v : item)))} />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="sticky bottom-4 z-10 flex justify-end">
            <Button size="lg" onClick={submit} disabled={create.isPending} className="shadow-lg">
              {create.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {t("Create prescription & QR code", "প্রেসক্রিপশন ও QR কোড তৈরি করুন")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
