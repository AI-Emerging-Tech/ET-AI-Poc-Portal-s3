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
      // Redirect to SSO if not authenticated
      router.push('/auth');
      return;
    }

    // Get user status from session or localStorage as fallback
    let currentStatus = session?.user?.status;
    if (!currentStatus && status === 'authenticated') {
      // Fallback to localStorage data
      try {
        const userDataStr = localStorage.getItem('vm_user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          currentStatus = userData.status;
        }
      } catch (error) {
        console.error('Error reading user data from localStorage:', error);
      }
    }
  
    // Redirect users with PENDING status to the pending approval page
    if (status === 'authenticated' && 
        currentStatus === 'PENDING' && 
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
