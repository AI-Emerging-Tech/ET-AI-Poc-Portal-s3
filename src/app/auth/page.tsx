'use client';

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from 'components/ToastContainer';

function SSOContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');
  const { showToast } = useToast();

  useEffect(() => {
    if (error) {
      const errorMessage = error === 'Callback' ? 'Authentication failed. Please try again.' : 
                          error === 'OAuthCallback' ? 'There was an issue with the authentication provider.' :
                          error === 'Verification' ? 'Token verification failed.' :
                          error === 'Backend' ? 'Backend authentication failed. Please try again.' :
                          error === 'Authentication' ? 'Authentication session expired.' :
                          'An authentication error occurred. Please try again.';
      
      showToast(errorMessage, 'error', 5000);
    }
  }, [error, showToast]);

  const handleSSO = async () => {
    setLoading(true);
    try {
      await signIn("azure-ad", { 
        callbackUrl: "/auth/processing",
        redirect: true 
      });
    } catch (error) {
      console.error("SSO Error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h2>
            <p className="text-gray-600 mb-8">Sign in with your Microsoft account to access the ValueMomentum Emerging Tech Studio</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 text-sm mt-3">
                  {error === 'Callback' ? 'Authentication failed. Please try again.' : 
                   error === 'OAuthCallback' ? 'There was an issue with the authentication provider.' :
                   error === 'Verification' ? 'Token verification failed.' :
                   'An authentication error occurred. Please try again.'}
                </p>
              </div>
            </div>
          )}

          {/* SSO Button */}
          <button
            onClick={handleSSO}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-light hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
                Continue with Microsoft
              </>
            )}
          </button>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              By continuing, you agree to access the ValueMomentum platform using your Microsoft credentials.
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SSOPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Loading...</h2>
              <p className="text-gray-600">Please wait while we prepare your sign-in experience.</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SSOContent />
    </Suspense>
  );
}
