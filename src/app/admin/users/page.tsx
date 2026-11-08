"use client";

import { BadgeCheck, Ban, CheckCircle2, Crown, LogOut, MoreHorizontal, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminUsers, useDeleteUser, useForceLogout, useUpdateUser, type AdminUser } from "@/features/admin/api";
import { ListToolbar } from "@/features/admin/list-toolbar";
import { useMe } from "@/features/auth/api";
import { errorMessage } from "@/lib/api";
import { fmtDate, fmtRelative, initials } from "@/lib/format";
import type { Role } from "@/types";
import { useT } from "@/hooks/use-t";
import { isProfessional, ROLE_LABELS } from "@/lib/roles";


function UserActions({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const update = useUpdateUser();
  const del = useDeleteUser();
  const logout = useForceLogout();
  const { t } = useT();
  const done = (msg: string) => ({ onSuccess: () => toast.success(msg), onError: (e: unknown) => toast.error(errorMessage(e)) });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t(`Actions for ${user.name}`, `${user.name} এর অপশন`)}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isSelf && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserCog /> {t("Change role", "ভূমিকা পরিবর্তন")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {(["PATIENT", "CAREGIVER", "DOCTOR", "PHARMACY", "ADMIN"] as Role[]).map((r) => (
                <DropdownMenuItem key={r} disabled={user.role === r} onClick={() => update.mutate({ id: user.id, role: r }, done(t(`Role changed to ${r.toLowerCase()}`, "ভূমিকা পরিবর্তন হয়েছে")))}>
                  {t(ROLE_LABELS[r].en, ROLE_LABELS[r].bn)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {!isSelf &&
          (user.status === "ACTIVE" ? (
            <DropdownMenuItem onClick={() => update.mutate({ id: user.id, status: "SUSPENDED" }, done(t("User suspended", "ইউজার স্থগিত করা হয়েছে")))}>
              <Ban /> {t("Suspend", "স্থগিত করুন")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => update.mutate({ id: user.id, status: "ACTIVE" }, done(t("User re-activated", "ইউজার আবার সক্রিয়")))}>
              <CheckCircle2 /> {t("Re-activate", "আবার সক্রিয় করুন")}
            </DropdownMenuItem>
          ))}
        {isProfessional(user.role) && (
          <DropdownMenuItem
            onClick={() =>
              update.mutate(
                { id: user.id, isProVerified: !user.isProVerified },
                done(user.isProVerified ? t("Verification removed", "যাচাই বাতিল করা হয়েছে") : t("Professional verified", "পেশাদার যাচাই সম্পন্ন")),
              )
            }
          >
            <BadgeCheck /> {user.isProVerified ? t("Remove verification", "যাচাই বাতিল করুন") : t("Mark licence verified", "লাইসেন্স যাচাইকৃত করুন")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => update.mutate({ id: user.id, plan: user.plan === "PREMIUM" ? "FREE" : "PREMIUM" }, done(user.plan === "PREMIUM" ? t("Moved to Free", "ফ্রি প্ল্যানে নেওয়া হয়েছে") : t("Granted Premium", "প্রিমিয়াম দেওয়া হয়েছে")))}
        >
          <Crown /> {user.plan === "PREMIUM" ? t("Remove Premium", "প্রিমিয়াম সরান") : t("Grant Premium", "প্রিমিয়াম দিন")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => logout.mutate(user.id, done(t("All sessions revoked", "সব সেশন বাতিল হয়েছে")))}>
          <LogOut /> {t("Force logout", "জোর করে লগআউট")}
        </DropdownMenuItem>
        {!isSelf && (
          <>
            <DropdownMenuSeparator />
            <ConfirmDialog
              title={t(`Delete ${user.name}?`, `${user.name} কে মুছবেন?`)}
              description={t("This permanently deletes the account and all of its medical data.", "অ্যাকাউন্ট ও তার সব মেডিকেল তথ্য স্থায়ীভাবে মুছে যাবে।")}
              confirmLabel={t("Delete user", "ইউজার মুছুন")}
              onConfirm={() => del.mutate(user.id, done(t("User deleted", "ইউজার মুছে ফেলা হয়েছে")))}
              trigger={
                <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                  <Trash2 /> {t("Delete user", "ইউজার মুছুন")}
                </DropdownMenuItem>
              }
            />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminUsersPage() {
  const { data: me } = useMe();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const { t, n } = useT();
  const { data, isLoading, error, refetch } = useAdminUsers({
    page,
    search: search || undefined,
    role: role === "ALL" ? undefined : role,
    status: status === "ALL" ? undefined : status,
  });
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  return (
    <>
      <PageHeader title={t("Users", "ইউজার")} description={data?.meta ? t(`${data.meta.total} accounts`, `${n(data.meta.total)}টি অ্যাকাউন্ট`) : undefined} />
      <ListToolbar
        search={search}
        onSearch={reset(setSearch)}
        placeholder={t("Search name, email or phone", "নাম, ইমেইল বা ফোন দিয়ে খুঁজুন")}
        filters={[
          {
            label: t("Role", "ভূমিকা"),
            value: role,
            onChange: reset(setRole),
            options: [
              { value: "ALL", label: t("All roles", "সব ভূমিকা") },
              { value: "PATIENT", label: t("Patients", "রোগী") },
              { value: "CAREGIVER", label: t("Caregivers", "কেয়ারগিভার") },
              { value: "ADMIN", label: t("Admins", "অ্যাডমিন") },
            ],
          },
          {
            label: t("Status", "অবস্থা"),
            value: status,
            onChange: reset(setStatus),
            options: [
              { value: "ALL", label: t("Any status", "সব অবস্থা") },
              { value: "ACTIVE", label: t("Active", "সক্রিয়") },
              { value: "SUSPENDED", label: t("Suspended", "স্থগিত") },
            ],
          },
        ]}
      />
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <EmptyState title={t("No users found", "কোনো ইউজার পাওয়া যায়নি")} />
      ) : (
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t("User", "ইউজার")}</TableHead>
                  <TableHead>{t("Role", "ভূমিকা")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("Activity", "কার্যক্রম")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("Joined", "যোগদান")}</TableHead>
                  <TableHead>{t("Status", "অবস্থা")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
                          <AvatarFallback className="bg-primary/15 text-xs text-primary">{initials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium">
                            {u.name}
                            {u.isEmailVerified && <ShieldCheck className="size-3.5 text-primary" aria-label={t("Email verified", "ইমেইল যাচাইকৃত")} />}
                            {u.plan === "PREMIUM" && <Crown className="size-3.5 text-primary" aria-label={t("Premium", "প্রিমিয়াম")} />}
                          </p>
                          <p className="max-w-56 truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{t(ROLE_LABELS[u.role].en, ROLE_LABELS[u.role].bn)}</Badge>
                      {isProfessional(u.role) &&
                        (u.isProVerified ? (
                          <Badge variant="outline" className="mt-1 flex w-fit gap-1 border-primary/40 text-primary">
                            <BadgeCheck className="size-3" /> {t("Verified", "যাচাইকৃত")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="mt-1 flex w-fit">{t("Pending check", "যাচাই বাকি")}</Badge>
                        ))}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {u.role === "PATIENT"
                        ? t(`${u._count.prescriptions} Rx · ${u._count.medicines} meds · ${u._count.patientLinks} caregivers`, `${n(u._count.prescriptions)} প্রেসক্রিপশন · ${n(u._count.medicines)} ওষুধ · ${n(u._count.patientLinks)} কেয়ারগিভার`)
                        : u.role === "CAREGIVER"
                          ? t(`${u._count.caregiverLinks} patients`, `${n(u._count.caregiverLinks)} জন রোগী`)
                          : isProfessional(u.role)
                            ? [u.organization, u.licenseNumber && `${u.role === "DOCTOR" ? "BMDC" : t("Licence", "লাইসেন্স")}: ${u.licenseNumber}`].filter(Boolean).join(" · ") || "—"
                            : "—"}
                      <br />
                      {t("Last login", "শেষ লগইন")} {fmtRelative(u.lastLoginAt)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{fmtDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === "ACTIVE" ? "success" : "destructive"}>{u.status === "ACTIVE" ? t("active", "সক্রিয়") : t("suspended", "স্থগিত")}</Badge>
                    </TableCell>
                    <TableCell>
                      <UserActions user={u} isSelf={u.id === me?.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Pagination page={page} totalPages={data?.meta?.totalPages ?? 1} onChange={setPage} />
    </>
  );
}
