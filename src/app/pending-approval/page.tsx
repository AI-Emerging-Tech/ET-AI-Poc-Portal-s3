'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from 'components/ToastContainer';

interface UserData {
  userId: string;
  email: string;
  name: string;
  status: string;
  roles: string[];
  accessLevel: string;
  accessStartTime: string | null;
  accessEndTime: string | null;
  pageAccess: any;
}

export default function PendingApproval() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    // Create a flag to track component mount state
    let isMounted = true;
    
    const handleNavigation = async () => {
      // Handle authentication states
      if (status === 'loading') {
        return;
      }
      
      if (!isMounted) return;
      setIsLoading(false);
      
      // If not authenticated, redirect to SSO
      if (status === 'unauthenticated') {
        router.push('/auth');
        return;
      }

      // Load user data from localStorage
      const userDataStr = localStorage.getItem('vm_user_data');
      if (userDataStr) {
        try {
          const data = JSON.parse(userDataStr);
          setUserData(data);
          
          // If user is no longer pending, redirect to dashboard
          if (data.status !== 'PENDING') {
            router.push('/');
            return;
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      // Fallback: If authenticated but no stored user data or not pending, check session
      if (session && session.user.status && session.user.status !== 'PENDING') {
        router.push('/');
      }
    };

    handleNavigation();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [session, status, router]);

  const refreshSession = async () => {
    if (!session?.user) {
      showToast('No session found. Please sign in again.', 'error');
      router.push('/auth');
      return;
    }

    setIsRefreshing(true);
    
    try {
      // Re-authenticate with the backend to get latest user status
      const response = await fetch('/api/auth/sso-backend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          },
          idToken: (session as any).idToken,
          accessToken: (session as any).accessToken,
          provider: 'azure-ad',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to refresh session: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.access_token) {
        // Update stored session data
        localStorage.setItem('vm_access_token', data.access_token);
        
        const updatedUserData = {
          userId: data.userId,
          email: data.email,
          name: data.name,
          status: data.status,
          roles: data.roles,
          accessLevel: data.accessLevel,
          accessStartTime: data.accessStartTime,
          accessEndTime: data.accessEndTime,
          pageAccess: data.pageAccess,
        };
        
        localStorage.setItem('vm_user_data', JSON.stringify(updatedUserData));
        
        // Update local state
        setUserData(updatedUserData);
        
        // Update NextAuth session with refreshed backend user data
        try {
          await update({
            backendUserData: updatedUserData
          });
          console.log('Session updated successfully with refreshed backend data');
        } catch (error) {
          console.error('Failed to update session during refresh:', error);
          // Continue anyway as we have localStorage fallback
        }
        
        showToast('Session refreshed successfully!', 'success');
        
        // If status changed from PENDING, redirect to dashboard
        if (data.status !== 'PENDING') {
          showToast('Account approved! Redirecting to dashboard...', 'success');
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } else {
        throw new Error('No access token received from backend');
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      showToast(`Session Expired. Redirecting to login...`, 'error');
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary-light opacity-50 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated (should be redirecting)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full mx-auto my-8 p-8 relative overflow-hidden">
        <div className="absolute inset-0 pattern-circuit opacity-[0.03]"></div>
        
        {/* Status icon */}
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        {/* Title and content */}
        <h1 className="text-3xl font-bold text-center mb-6 text-gradient">Account Pending Approval</h1>
        
        <div className="space-y-6 text-center max-w-lg mx-auto">
          <p className="text-lg">
            Thank you for registering with the ET AI Lab Portal. Your account is currently under review by our administrators.
          </p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Requests are reviewed by the Emerging Technologies team regularly. This typically takes 1-2 business days.
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-6 backdrop-button">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Account Details</h3>
              <button
                onClick={refreshSession}
                disabled={isRefreshing}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-1 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Status
                  </>
                )}
              </button>
            </div>
            <div className="space-y-2 text-left">
              <p><span className="text-medium-gray">Name:</span> {userData?.name || session?.user?.name}</p>
              <p><span className="text-medium-gray">Email:</span> {userData?.email || session?.user?.email}</p>
              <p><span className="text-medium-gray">Status:</span> 
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                  (userData?.status || 'PENDING') === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  (userData?.status || 'PENDING') === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {userData?.status || 'PENDING'}
                </span>
              </p>
            </div>
          </div>
          
          <div className="pt-6">
            <Link 
              href="/contact" 
              className="text-primary hover:text-primary-dark transition-colors"
            >
              Need help? Contact the Emerging Technologies team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 