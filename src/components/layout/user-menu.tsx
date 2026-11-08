"use client";

import { LogOut, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/features/auth/api";
import { initials } from "@/lib/format";
import type { User } from "@/types";
import { useT } from "@/hooks/use-t";
import { ROLE_LABELS } from "@/lib/roles";

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const logout = useLogout();
  const { t } = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-1.5" aria-label={t("Account menu", "অ্যাকাউন্ট মেনু")}>
          <Avatar className="size-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="bg-secondary text-primary">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="space-y-1">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
          <div className="flex gap-1.5 pt-1">
            <Badge variant="secondary">{t(ROLE_LABELS[user.role].en, ROLE_LABELS[user.role].bn)}</Badge>
            {user.plan === "PREMIUM" && <Badge>{t("Premium", "প্রিমিয়াম")}</Badge>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield /> {t("Admin panel", "অ্যাডমিন প্যানেল")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings /> {t("Settings", "সেটিংস")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => logout.mutate(undefined, { onSettled: () => router.replace("/login") })}
        >
          <LogOut /> {t("Log out", "লগআউট")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
