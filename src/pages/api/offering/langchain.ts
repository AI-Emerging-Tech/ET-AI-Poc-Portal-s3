import { NextApiRequest, NextApiResponse } from 'next';

// Specify types for req and res
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { message } = req.body;

  // Check whether to use the mock or real service based on environment variable
  const useMockService = process.env.USE_MOCK_SERVICE === 'true';

  if (useMockService) {
    const mockResponses = [
      { answer: "This is LangChain speaking. How can I assist you today?" },
      { answer: "LangChain service is ready to help with your queries.", document_path: "/path/to/document/queries.pdf" },
      { answer: "You are now interacting with the LangChain service.", document_path: "/path/to/document/interact.pdf" },
      { answer: "Let me process that through LangChain...", document_path: "/path/to/document/process.pdf" },
      { answer: "LangChain service is here to help you!", document_path: "/path/to/document/help.pdf" },
    ];

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay

    return res.status(200).json(randomResponse);
  } else {
    // Real service URL
    const realServiceUrl = 'https://www.valuemomentum.studio/offering_rag/api/chat';

    try {
      const response = await fetch(realServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorResponse = await response.text();  // Retrieve the actual error message from the service
        console.error(`LangChain Service Error: ${errorResponse}`);
        throw new Error(`Failed to fetch data from LangChain service. Status: ${response.status}`);
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error contacting real service:', error.message);
      } else {
        console.error('Unknown error contacting real service:', error);
      }
      return res.status(500).json({ error: 'Error contacting real LangChain service' });
    }
  }
}
