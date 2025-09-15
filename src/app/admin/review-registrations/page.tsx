'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from "../../../services/apiRequestService";

interface User {
  user_id: string;
  name: string;
  email: string;
  company?: string;
  status: string;
}

export default function ReviewRegistrations() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Ensure only administrators can access this page
    if (!session || session.user.role !== 'ADMINISTRATOR') {
      setLoading(false); // Set loading to false for unauthorized users
      return;
    }

    // Fetch all users with 'PENDING' status if user is admin
    const fetchPendingUsers = async () => {
      try {
        const data = await makeAuthenticatedRequest('/api/admin/getPendingUsers');
        setUsers(data);
      } catch (error) {
        console.error('Error fetching pending users:', error);
        setMessage({ 
          type: 'error', 
          text: error instanceof Error ? error.message : 'Failed to load pending registrations' 
        });
      } finally {
        setLoading(false); // Stop loading after fetching data
      }
    };
    fetchPendingUsers();
  }, [session]);

  const handleApproval = async (userId: string | number, status: string) => {
    try {
      setMessage({ type: '', text: '' });
      
      const result = await makeAuthenticatedRequest(`/api/admin/updateUserStatus`, {
        method: 'POST',
        body: JSON.stringify({ userId, status }),
      });
      
      // Remove the user from the pending list after processing
      setUsers(users.filter(user => 
        (user.user_id !== userId)
      ));
      
      setMessage({ 
        type: 'success', 
        text: `User ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully` 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      
    } catch (error) {
      console.error('Error updating user status:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update user status' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary-light opacity-50 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMINISTRATOR') {
    return (
      <div className="glass-card my-8 mx-auto max-w-lg p-8 text-center">
        <div className="text-error text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-error mb-2">Access Denied</h1>
        <p className="text-medium-gray">You don't have permission to access this admin page.</p>
        <button 
          onClick={() => router.push('/')}
          className="btn-ai mt-6"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto p-8 max-sm:p-4 animate-[fadeIn_0.3s_ease-in]">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
      <div className="absolute inset-0 pattern-circuit opacity-[0.03]"></div>
        <h1 className="text-3xl font-bold mb-6 text-gradient flex items-center gap-3">
          <span className="inline-block bg-primary text-white rounded-full p-2 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
          Review Registrations
        </h1>
        <p className="text-medium-gray mb-6">Review and approve new user registration requests.</p>
        
        {/* Notifications */}
        {message.type === 'error' && (
          <div className="bg-red-50 border-l-4 border-error text-error p-4 mb-6 rounded shadow animate-[fadeIn_0.3s_ease-in] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message.text}
          </div>
        )}
        
        {message.type === 'success' && (
          <div className="bg-green-50 border-l-4 border-success text-success p-4 mb-6 rounded shadow animate-[fadeIn_0.3s_ease-in] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {message.text}
          </div>
        )}
      </div>

      {/* User list */}
      <div className="ai-card min-h-[60vh]">
      {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-medium text-medium-gray mb-2">No Pending Registrations</h2>
            <p className="text-medium-gray">All user registration requests have been processed.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {users.map((user) => (
              <div 
                key={user.user_id} 
                className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden transition-all duration-normal hover:shadow-lg"
              >
                <div className="bg-gradient-to-r from-primary/10 to-primary-light/10 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 text-primary rounded-full p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-dark-gray">{user.name}</h3>
                      <p className="text-sm font-mono text-primary">{user.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4">
                  <div className="mb-4">
                    <p className="text-sm text-medium-gray mb-1">Company</p>
                    <p className="font-medium">{user.company}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-medium-gray mb-1">Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {user.status}
                    </span>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 flex justify-between gap-3">
                  <button 
                    onClick={() => handleApproval(user.user_id, 'APPROVED')}
                    className="btn-ai py-2 px-4 text-sm flex-1 flex items-center justify-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                  <button 
                    onClick={() => handleApproval(user.user_id, 'REJECTED')}
                    className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded shadow transition-colors duration-normal flex-1 flex items-center justify-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
      )}
      </div>
    </div>
  );
}
