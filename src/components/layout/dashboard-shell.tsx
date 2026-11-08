"use client";

import { MailWarning, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Logo } from "@/components/shared/logo";
import { PageLoader } from "@/components/shared/states";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useMe } from "@/features/auth/api";
import { useVoiceAlerts } from "@/features/notifications/use-voice-alerts";
import type { Role } from "@/types";
import { NotificationBell } from "./notification-bell";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { useT } from "@/hooks/use-t";

/**
 * Authenticated app frame: role-aware sidebar, top bar, auth guard and voice alerts.
 * `allow` restricts the section to certain roles (e.g. the admin panel).
 */
export function DashboardShell({ children, allow }: { children: ReactNode; allow?: Role[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();
  const [open, setOpen] = useState(false);
  const { t } = useT();

  useVoiceAlerts(user);

  const forbidden = Boolean(user && allow && !allow.includes(user.role));

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (forbidden) router.replace("/dashboard");
  }, [isLoading, user, forbidden, router, pathname]);

  if (isLoading || !user || forbidden) return <PageLoader />;

  return (
    <div className="flex min-h-screen">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        {t("Skip to content", "মূল অংশে যান")}
      </a>
      <aside className="sticky top-0 hidden h-screen print:!hidden w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo href={user.role === "ADMIN" ? "/admin" : "/dashboard"} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav role={user.role} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 print:hidden items-center gap-2 border-b bg-background/85 px-4 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("Open navigation", "মেনু খুলুন")}>
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetHeader className="h-16 justify-center px-5">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto px-3 pb-6">
                <SidebarNav role={user.role} onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <Logo className="lg:hidden" />
          <div className="ml-auto flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
            <NotificationBell />
            <UserMenu user={user} />
          </div>
        </header>

        {!user.isEmailVerified && (
          <div className="flex flex-wrap items-center gap-3 border-b bg-secondary px-4 py-2.5 print:hidden text-sm text-secondary-foreground">
            <MailWarning className="size-5 shrink-0" />
            <span>{t("Verify your email to unlock AI scans, caregivers and payments.", "এআই স্ক্যান, কেয়ারগিভার ও পেমেন্ট চালু করতে আপনার ইমেইল যাচাই করুন।")}</span>
            <Button size="sm" variant="outline" asChild className="ml-auto">
              <Link href={`/verify-email?email=${encodeURIComponent(user.email)}`}>{t("Verify now", "এখনই যাচাই করুন")}</Link>
            </Button>
          </div>
        )}

        <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
