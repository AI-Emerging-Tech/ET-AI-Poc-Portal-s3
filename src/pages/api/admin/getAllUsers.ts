import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    // Get user's access token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const response = await fetch(`${process.env.AWS_GATEWAY_URL}/admin/users/list`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    // Handle different response status codes
    if (response.status === 401) {
      return res.status(401).json({ error: 'Unauthorized - invalid or expired token' });
    }
    
    if (response.status === 403) {
      return res.status(403).json({ error: 'Forbidden - insufficient permissions' });
    }
    
    if (response.status === 200) {
      const users = await response.json();
      return res.status(200).json(users);
    }
    
    // Catchall for other status codes
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
    return res.status(response.status).json(errorData);

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
