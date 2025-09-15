"use client";
import { useEffect } from "react";
import { useAccessControl } from "../hooks/useAccessControl";
import { usePathname } from "next/navigation";

export default function FetchGuardProvider({ children }: { children: React.ReactNode }) {
  const { accessLevel, accessAllowed, pageAccess } = useAccessControl();
  const pathname = usePathname();
  const hasPageAccess = pageAccess && pageAccess[pathname] && pageAccess[pathname] === "full"
  
  useEffect(() => {
    const originalFetch = window?.fetch;
    window.fetch = async (...args) => {
      const [resource, config] = args;
      const method = (config && config.method) || "GET";
      const url: string =
        typeof resource === "string" ? resource :
        resource instanceof Request  ? resource.url :
        String(resource);
      const blocked =
        (accessLevel === "view-only" || !accessAllowed ||
         (accessLevel === "partial" && !hasPageAccess)) &&
        !url.includes("api/auth") &&          // <- AND, not OR
        !url.includes("signout");  
      // Only block non-GET requests for view-only users
      if (blocked && method !== "GET") {
          alert("View-only users cannot perform this action.");
          return Promise.reject(new Error("View-only users cannot perform this action."));
      }
      return originalFetch(...args);
    };
    return () => {
      if (originalFetch) {
        window.fetch = originalFetch;
      }
    };
  }, [accessLevel, hasPageAccess, accessAllowed, pathname]);

  return <>{children}</>;
}
