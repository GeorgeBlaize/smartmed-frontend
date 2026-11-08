"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { PageLoader } from "@/components/shared/states";
import { useMe } from "@/features/auth/api";
import { isProfessional } from "@/lib/roles";
import type { User } from "@/types";

/** Renders children only for doctor / pharmacy accounts; others go back to their dashboard. */
export function ProOnly({ children }: { children: (user: User) => ReactNode }) {
  const router = useRouter();
  const { data: user } = useMe();
  const allowed = Boolean(user && isProfessional(user.role));

  useEffect(() => {
    if (user && !allowed) router.replace("/dashboard");
  }, [user, allowed, router]);

  if (!user || !allowed) return <PageLoader />;
  return <>{children(user)}</>;
}
