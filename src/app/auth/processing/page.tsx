'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from 'components/ToastContainer';

export default function ProcessingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const processAuthentication = async () => {
      if (status === 'loading' || isProcessing) return;
      
      if (status === 'unauthenticated') {
        router.push('/auth?error=Authentication');
        return;
      }

      if (session?.user) {
        setIsProcessing(true);
        try {
          // Call our server-side API route which handles the backend call
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
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
          if (data.access_token) {
            // Store the session token from backend
            localStorage.setItem('vm_access_token', data.access_token);
            
            // Store additional user info
            const userData = {
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
            
            localStorage.setItem('vm_user_data', JSON.stringify(userData));
            
            // Update NextAuth session with backend user data
            try {
              await update({
                backendUserData: userData
              });
              console.log('Session updated successfully with backend data');
            } catch (error) {
              console.error('Failed to update session:', error);
              // Continue anyway as we have localStorage fallback
            }
            
            // Show success message and redirect based on status
            if (data.status === 'PENDING') {
              showToast('Authentication successful!', 'success', 2000);
              setTimeout(() => {
                router.push('/pending-approval');
              }, 1000);
            } else {
              showToast('Authentication successful! Redirecting to dashboard...', 'success', 2000);
              setTimeout(() => {
                router.push('/');
              }, 1000);
            }
          } else {
            throw new Error('No access token received from backend');
          }
        } catch (error) {
          console.error('Backend integration error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setError(errorMessage);
          showToast(`Backend authentication failed: ${errorMessage}`, 'error', 5000);
          
          // Redirect to SSO page with error after 3 seconds
          setTimeout(() => {
            router.push('/auth?error=Backend');
          }, 3000);
        }
      }
    };

    processAuthentication();
  }, [session, status, router, showToast, isProcessing]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting you back to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="mb-4">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Authentication</h2>
        <p className="text-gray-600 mb-4">Please wait while we set up your session...</p>
        <div className="flex justify-center">
          <div className="flex space-x-1">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
