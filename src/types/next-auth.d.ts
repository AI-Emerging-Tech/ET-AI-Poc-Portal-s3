// src/next-auth.d.ts
import NextAuth from 'next-auth';

type Role = 'ADMINISTRATOR' | 'DEVELOPER' | 'VIEWER';
type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

declare module 'next-auth' {
  interface Session {
    user: User;
    accessToken?: string;
    idToken?: string;
  }

  interface User {
    id: string;
    name?: string;
    email: string;
    image?: string;
    company?: string;
    role?: Role;
    status?: Status;
    accessLevel?: string;
    accessStartTime?: string;
    accessEndTime?: string;
    pageAccess?: Record<string, string>;
    ssoResponse?: any;
  }
}

export type { User };
