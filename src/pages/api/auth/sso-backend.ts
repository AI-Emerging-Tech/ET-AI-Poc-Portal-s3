import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { user, idToken, accessToken, provider, timestamp } = req.body;

    // Validate required fields
    if (!user || (!idToken && !accessToken)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get environment variables server-side
    const authUrl = process.env.AWS_GATEWAY_URL;
    const apiKey = process.env.AWS_AUTH_API_KEY;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if available
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    // Call the Lambda function
    const lambdaResponse = await fetch(authUrl + '/auth', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user,
        idToken,
        accessToken,
        provider,
        timestamp,
      }),
    });

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text();
      return res.status(lambdaResponse.status).json({ 
        error: 'Backend authentication failed',
        details: errorText 
      });
    }

    const lambdaData = await lambdaResponse.json();

    // Handle the Lambda response format
    let responseData;
    
    if (lambdaData.statusCode === 200) {
      // Lambda returns a nested format with statusCode and body
      if (typeof lambdaData.body === 'string') {
        responseData = JSON.parse(lambdaData.body);
      } else {
        responseData = lambdaData.body;
      }
    } else {
      // Error response from Lambda
      const errorBody = typeof lambdaData.body === 'string' 
        ? JSON.parse(lambdaData.body) 
        : lambdaData.body;
      
      return res.status(lambdaData.statusCode || 500).json({
        error: errorBody.error || 'Authentication failed',
        details: errorBody.detail || 'Unknown error'
      });
    }

    // Return the parsed response
    return res.status(200).json(responseData);

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
