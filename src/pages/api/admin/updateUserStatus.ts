import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, status } = req.body;

    // Validate status input
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get user's access token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const response = await fetch(`${process.env.AWS_GATEWAY_URL}/admin/users/status`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, status }),
    });

    // Handle different response status codes
    if (response.status === 401) {
      return res.status(401).json({ error: 'Unauthorized - invalid or expired token' });
    }
    
    if (response.status === 403) {
      return res.status(403).json({ error: 'Forbidden - insufficient permissions' });
    }
    
    if (response.status === 200) {
      const updatedUser = await response.json();
      return res.status(200).json(updatedUser);
    }
    
    // Catchall for other status codes
    const errorData = await response.json().catch(() => ({ error: 'Failed to update user status' }));
    return res.status(response.status).json(errorData);

  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
