'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PendingApproval() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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
      
      // If not authenticated, redirect to login
      if (status === 'unauthenticated') {
        router.push('/auth/login');
        return;
      }
      
      // If authenticated but not pending, redirect home
      if (session && session.user.status !== 'PENDING') {
        router.push('/');
      }
    };

    handleNavigation();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [session, status, router]);

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
            <h3 className="font-semibold text-lg mb-3">Account Details</h3>
            <div className="space-y-2 text-left">
              <p><span className="text-medium-gray">Name:</span> {session?.user?.name}</p>
              <p><span className="text-medium-gray">Email:</span> {session?.user?.email}</p>
              <p><span className="text-medium-gray">Status:</span> <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">PENDING</span></p>
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