"use client";

import { format, parseISO } from "date-fns";
import { Bot, Crown, FileText, HeartHandshake, Pill, Target, Users, Wallet } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ErrorState, PageLoader } from "@/components/shared/states";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BroadcastCard } from "@/features/admin/broadcast-card";
import { useAdminStats } from "@/features/admin/api";
import { dateLocale, fmtRelative, formatTaka } from "@/lib/format";
import { useT } from "@/hooks/use-t";
import { ROLE_LABELS } from "@/lib/roles";

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" };
const PIE_COLORS = ["var(--chart-1)", "var(--chart-4)", "var(--chart-3)", "var(--chart-5)", "var(--chart-2)"];
const FEATURE_LABEL: Record<string, [string, string]> = {
  PRESCRIPTION_OCR: ["Prescription OCR", "প্রেসক্রিপশন পড়া"],
  EXPIRY_SCAN: ["Expiry scan", "মেয়াদ স্ক্যান"],
  MEDICINE_INFO: ["Medicine info", "ওষুধ পরিচিতি"],
  INTERACTION_CHECK: ["Interactions", "প্রতিক্রিয়া যাচাই"],
  HEALTH_CHAT: ["Chat", "চ্যাট"],
  ADHERENCE_INSIGHT: ["Insights", "রিপোর্ট"],
};

export default function AdminOverviewPage() {
  const { data, isLoading, error, refetch } = useAdminStats();
  const { t, tp, n } = useT();
  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;

  const growth = data.users.signupsDaily.map((d, i) => ({
    label: n(format(parseISO(d.date), "d MMM", { locale: dateLocale() })),
    signups: d.count,
    uploads: data.prescriptions.uploadsDaily[i]?.count ?? 0,
  }));
  const roles = (["PATIENT", "CAREGIVER", "DOCTOR", "PHARMACY", "ADMIN"] as const).map((r) => ({ name: t(ROLE_LABELS[r].en, ROLE_LABELS[r].bn), value: data.users.byRole[r] ?? 0 }));
  const ai = data.ai.byFeature.map((f) => ({ name: FEATURE_LABEL[f.feature] ? tp(FEATURE_LABEL[f.feature]) : f.feature, count: f.count, latency: f.avgLatencyMs }));

  return (
    <>
      <PageHeader title={t("Admin overview", "অ্যাডমিন সারসংক্ষেপ")} description={`${t("Platform health · updated", "প্ল্যাটফর্মের অবস্থা · আপডেট")} ${fmtRelative(data.generatedAt)}`} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("Users", "ইউজার")} value={n(data.users.total)} hint={t(`+${data.users.newLast30Days} in 30 days`, `৩০ দিনে +${n(data.users.newLast30Days)}`)} icon={<Users />} />
        <StatCard label={t("Premium users", "প্রিমিয়াম ইউজার")} value={n(data.users.premium)} icon={<Crown />} tone="warning" />
        <StatCard label={t("Prescriptions", "প্রেসক্রিপশন")} value={n(data.prescriptions.total)} hint={t(`${data.prescriptions.byStatus.VERIFIED ?? 0} verified`, `${n(data.prescriptions.byStatus.VERIFIED ?? 0)}টি যাচাইকৃত`)} icon={<FileText />} />
        <StatCard label={t("Revenue", "আয়")} value={formatTaka(data.revenue.totalBdt)} hint={t(`${data.revenue.successfulPayments} payments`, `${n(data.revenue.successfulPayments)}টি পেমেন্ট`)} icon={<Wallet />} tone="success" />
        <StatCard label={t("Active medicines", "চলমান ওষুধ")} value={n(data.medicines.active)} icon={<Pill />} />
        <StatCard label={t("30-day adherence", "৩০ দিনের নিয়মিততা")} value={data.adherence.rate === null ? "—" : n(`${data.adherence.rate}%`)} icon={<Target />} tone="success" />
        <StatCard label={t("AI calls (30d)", "এআই ব্যবহার (৩০ দিন)")} value={n(data.ai.totalLast30Days)} hint={t(`${data.ai.successRate ?? "—"}% success`, `${n(data.ai.successRate ?? "—")}% সফল`)} icon={<Bot />} />
        <StatCard label={t("Care links", "কেয়ার সংযোগ")} value={n(data.care.activeLinks)} hint={t(`${data.inventory.expiredNotDisposed} expired items at homes`, `ঘরে ${n(data.inventory.expiredNotDisposed)}টি মেয়াদোত্তীর্ণ ওষুধ`)} icon={<HeartHandshake />} tone="muted" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("Growth (30 days)", "বৃদ্ধি (৩০ দিন)")}</CardTitle>
            <CardDescription>{t("New sign-ups and prescription uploads per day", "প্রতিদিনের নতুন ইউজার ও প্রেসক্রিপশন আপলোড")}</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" interval={4} />
                <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="signups" name={t("Sign-ups", "নতুন ইউজার")} stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} />
                <Area type="monotone" dataKey="uploads" name={t("Uploads", "আপলোড")} stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Users by role", "ভূমিকা অনুযায়ী ইউজার")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={roles} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {roles.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-sm">
              {roles.map((r, i) => (
                <span key={r.name} className="flex items-center gap-1.5 capitalize">
                  <span className="size-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} /> {r.name} ({r.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("AI usage by feature (30 days)", "ফিচার অনুযায়ী এআই ব্যবহার (৩০ দিন)")}</CardTitle>
            <CardDescription>
              {t(`${data.ai.failuresLast30Days} failed calls · fallback provider used automatically when the primary fails`, `${n(data.ai.failuresLast30Days)}টি ব্যর্থ · প্রধান এআই ব্যর্থ হলে বিকল্পটি স্বয়ংক্রিয়ভাবে ব্যবহার হয়`)}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {ai.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ai} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => (n === "latency" ? `${v} ms` : v)} />
                  <Bar dataKey="count" name={t("Calls", "ব্যবহার")} fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">{t("No AI calls yet.", "এখনো এআই ব্যবহার হয়নি।")}</p>
            )}
          </CardContent>
        </Card>

        <BroadcastCard />
      </div>
    </>
  );
}
