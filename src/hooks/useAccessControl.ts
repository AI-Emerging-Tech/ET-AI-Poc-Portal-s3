"use client";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";


function isWithinTimeWindow(start?: string, end?: string): boolean {
  if (!start || !end) return true; // No restriction
  const now = new Date();
  const nowUTC = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [startH, startM] = start.includes("T") ? start.split("T")[1].split(":").map(Number) : start.split(":").map(Number);
  const [endH, endM] = end.includes("T") ? end.split("T")[1].split(":").map(Number) : end.split(":").map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;
  if (startMin === endMin) return true; // 24h access
  if (startMin < endMin) {
    return nowUTC >= startMin && nowUTC <= endMin;
  } else {
    // Overnight window (e.g., 22:00-06:00)
    return nowUTC >= startMin || nowUTC <= endMin;
  }
}

export function useAccessControl() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [result, setResult] = useState({
    accessAllowed: false, // default: all users cannot view
    user: undefined,
    accessLevel: undefined,
    pageAccess: undefined,
    status,
    reason: undefined as string | undefined,
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !session.user) {
      setResult({ accessAllowed: false, user: undefined, accessLevel: undefined, pageAccess: undefined, status, reason: "Not signed in" });
      return;
    }
    const user = session.user as any;
    // Admins always allowed
    if (user.role === "ADMINISTRATOR") {
      setResult({ accessAllowed: true, user, accessLevel: user.accessLevel, pageAccess: user.pageAccess, status, reason: undefined });
      return;
    }
    // Check time window (optional: restrict run, not view)
    if (!isWithinTimeWindow(user.accessStartTime, user.accessEndTime)) {
      setResult({ accessAllowed: false, user, accessLevel: user.accessLevel, pageAccess: user.pageAccess, status, reason: "Access not allowed at this time." });
      return;
    }
    setResult({ accessAllowed: true, user, accessLevel: user.accessLevel, pageAccess: user.pageAccess, status, reason: undefined });
  }, [session, status, pathname]);

  return result;
}
