import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { id, role, roles, accessLevel, accessStartTime, accessEndTime, pageAccess } = req.body;

    // Get user's access token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    // Prepare the request body for AWS backend
    const requestBody: any = { id };
    
    // Handle roles - AWS backend expects 'roles' array, but frontend might send 'role'
    if (typeof role !== "undefined") requestBody.roles = [role];
    if (typeof roles !== "undefined") requestBody.roles = roles;
    if (typeof accessLevel !== "undefined") requestBody.accessLevel = accessLevel;
    if (typeof accessStartTime !== "undefined" && accessStartTime !== '') {
      requestBody.accessStartTime = accessStartTime;
    }
    if (typeof accessEndTime !== "undefined" && accessEndTime !== '') {
      requestBody.accessEndTime = accessEndTime;
    }
    if (typeof pageAccess !== "undefined") requestBody.pageAccess = pageAccess;

    const response = await fetch(`${process.env.AWS_GATEWAY_URL}/admin/users/access`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Handle different response status codes
    if (response.status === 401) {
      return res.status(401).json({ error: 'Unauthorized - invalid or expired token' });
    }
    
    if (response.status === 403) {
      return res.status(403).json({ error: 'Forbidden - insufficient permissions' });
    }
    
    if (response.status === 200) {
      const result = await response.json();
      return res.status(200).json(result);
    }
    
    // Catchall for other status codes
    const errorData = await response.json().catch(() => ({ error: 'Failed to update user access' }));
    return res.status(response.status).json(errorData);

  } catch (error) {
    console.error('Error updating user access:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
