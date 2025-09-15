"use client";
import { ReactNode } from "react";
import { useAccessControl } from "../../hooks/useAccessControl";
import FetchGuardProvider from "../../components/FetchGuardProvider";

export default function PocLayout({ children }: { children: ReactNode }) {
  const { accessLevel } = useAccessControl();
  
  return (
    <FetchGuardProvider>
      <div>
        {children}
      </div>
    </FetchGuardProvider>
  );
}
