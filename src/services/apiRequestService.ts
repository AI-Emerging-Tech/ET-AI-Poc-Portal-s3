export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('vm_access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  // Handle different response status codes
  if (response.status === 401) {
    throw new Error('Unauthorized - please sign in again');
  }
  
  if (response.status === 403) {
    throw new Error('Forbidden - insufficient permissions');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
};
