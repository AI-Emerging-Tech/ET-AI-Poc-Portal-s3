import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

export default NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read"
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours to match backend token expiry
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours to match backend token expiry
  },
  callbacks: {
    async signIn({ account, profile, user }) {
      try {
        // Allow Azure AD sign in
        if (account?.provider === "azure-ad") {
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after sign in      
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allow redirects to the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to base URL
      return baseUrl;
    },
    async session({ session, token }) {
      try {
        if (session.user && token) {
          session.user.id = token.sub as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
          (session as any).accessToken = token.accessToken;
          (session as any).idToken = token.idToken;
          
          // Include JWT expiry information in session
          if (token.exp && typeof token.exp === 'number') {
            session.expires = new Date(token.exp * 1000).toISOString();
          }
          
          // Include backend user data if available
          if (token.backendUserData) {
            const backendData = token.backendUserData as any;
            session.user.status = backendData.status;
            session.user.role = backendData.roles?.[0]; // Take the first role
            session.user.accessLevel = backendData.accessLevel;
            session.user.accessStartTime = backendData.accessStartTime;
            session.user.accessEndTime = backendData.accessEndTime;
            session.user.pageAccess = backendData.pageAccess;
          }
        }
        return session;
      } catch (error) {
        return session;
      }
    },
    async jwt({ token, account, profile, user, trigger, session }) {
      try {
        if (account?.provider === "azure-ad") {
          token.accessToken = account.access_token;
          token.idToken = account.id_token;
          
          // Set expiry time based on our 15-minute session duration
          const now = Math.floor(Date.now() / 1000);
          token.exp = now + (24 * 60 * 60); // 24 hours from now
          token.iat = now;
          
          // Set user info from profile or user object
          if (profile) {
            token.email = profile.email;
            token.name = profile.name;
          } else if (user) {
            token.email = user.email;
            token.name = user.name;
          }
        }
        
        // Handle session updates to include backend user data
        if (trigger === "update" && session?.backendUserData) {
          token.backendUserData = session.backendUserData;
          // Refresh expiry time when updating with backend data
          const now = Math.floor(Date.now() / 1000);
          token.exp = now + (24 * 60 * 60); // Reset 24 hours from now
        }
        
        // Check if token has expired
        const now = Math.floor(Date.now() / 1000);
        if (token.exp && typeof token.exp === 'number' && token.exp < now) {
          return null;
        }
        
        return token;
      } catch (error) {
        return token;
      }
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
});
