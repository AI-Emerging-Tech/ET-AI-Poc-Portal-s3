// /src/components/SessionProviderWrapper.tsx
'use client'; // This makes it a client-side component

import { SessionProvider } from 'next-auth/react';

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
