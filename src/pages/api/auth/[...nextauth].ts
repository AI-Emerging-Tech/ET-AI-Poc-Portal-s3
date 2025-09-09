import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../lib/prisma';
import { compare } from 'bcryptjs';
import { User as CustomUser } from '../../../types/next-auth';
import { Role, Status } from '@prisma/client'; // Import enums from Prisma

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', required: true },
        password: { label: 'Password', type: 'password', required: true },
      },
      authorize: async (credentials): Promise<CustomUser | null> => {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordCorrect = await compare(credentials.password, user.password);
        if (!isPasswordCorrect) {
          return null;
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          company: user.company,
          role: user.role as Role,  // Include role
          status: user.status as Status,  // Include status
          accessLevel: user.accessLevel,
          accessStartTime: user.accessStartTime,
          accessEndTime: user.accessEndTime,
          pageAccess: user.pageAccess,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.company = token.company as string;
        session.user.role = token.role as Role;
        session.user.status = token.status as Status;
        session.user.accessLevel = token.accessLevel as string;
        session.user.accessStartTime = token.accessStartTime as string;
        session.user.accessEndTime = token.accessEndTime as string;
        session.user.pageAccess = token.pageAccess as any;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.company = user.company;
        token.role = user.role;  // Add role to token
        token.status = user.status;  // Add status to token
        token.accessLevel = user.accessLevel;
        token.accessStartTime = user.accessStartTime;
        token.accessEndTime = user.accessEndTime;
        token.pageAccess = user.pageAccess;
      }
      return token;
    },
  },
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
});
