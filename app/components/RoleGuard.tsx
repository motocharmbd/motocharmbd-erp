"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export type ErpRole = "admin" | "moderator";

function getRole(): ErpRole {
  if (typeof window === "undefined") return "moderator";
  const value = String(localStorage.getItem("userRole") || "moderator").trim().toLowerCase();
  return value === "admin" ? "admin" : "moderator";
}

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<ErpRole | null>(null);

  useEffect(() => {
    const currentRole = getRole();
    setRole(currentRole);

    // Moderator is a read-only role. They can see dashboard, order history and fraud check,
    // but cannot open create-order, expenses or settings screens.
    if (currentRole === "moderator" && ["/orders", "/expenses", "/settings"].some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
      router.replace("/orders-history");
    }
  }, [pathname, router]);

  if (role === null) return null;

  return <>{children}</>;
}
