// src/next-auth.d.ts
import NextAuth from 'next-auth';
import { Role, Status } from "@prisma/client"; // Import enums from Prisma

declare module 'next-auth' {
  interface Session {
    user: User;
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
  }
}

export type { User };
