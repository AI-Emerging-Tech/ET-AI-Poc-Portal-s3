// /src/components/ProtectedRoute.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Spinner from './Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowPending?: boolean;
}

export default function ProtectedRoute({ children, allowPending = false }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to login if not authenticated
      router.push('/auth/login');
      return;
    }

    // Redirect users with PENDING status to the pending approval page
    if (status === 'authenticated' && 
        session?.user?.status === 'PENDING' && 
        !allowPending) {
      router.push('/pending-approval');
    }
  }, [status, router, session, allowPending]);

  // While checking session, show loading or prevent page from showing
  if (status === 'loading') {
    return <Spinner />;
  }

  // If authenticated, render the children (protected page content)
  return <>{children}</>;
}
