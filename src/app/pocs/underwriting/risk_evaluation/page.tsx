'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import ChatBubble from 'components/ChatBubble';
import { Message as ChatBoxMessage } from 'components/ChatBox';
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';
import { ChainOfThought } from 'components/ChainOfThought';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  sender?: string;
}

// Add new interfaces for email data
interface EmailSender {
  name: string;
  email: string;
}

interface EmailData {
  from: EmailSender[];
  subject: string;
  body: string;
  attachments: string[];
}

const API_BASE_URL = 'https://www.valuemomentum.studio/risk_eval';
const POLL_INTERVAL = 5000; // 5 seconds

export default function RiskEvaluation() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<FileList | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! How can I help you today?", 
      sender: 'Producer Assistant' 
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input'|'evaluation'|'report'>('input');
  // within "Input" we toggle email vs. file-upload
  const [inputMode, setInputMode] = useState<'email'|'upload'>('email');
  
  // Add new state variables for email functionality
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachmentContent, setAttachmentContent] = useState<string | null>(null);
  const [isAttachmentLoading, setIsAttachmentLoading] = useState(false);
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    };
  }, [pollInterval]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isSupporting = false) => {
    if (e.target.files) {
      if (isSupporting) {
        setSupportingFiles(e.target.files);
      } else {
        setFiles(e.target.files);
      }
    }
  };

  const clearPolling = async () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    setIsLoading(false);
  };

  const checkEvaluationStatus = async (id: string) => {
    console.log('Checking evaluation status...', id, pollInterval, isLoading);
      
    try {
      const response = await fetch(`${API_BASE_URL}/evaluate/risk/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `et-st-92847291745mcefh0287348cg65ds56d9`
        },
      });
      const data = await response.json();

      if (data.status === 'completed') {
        await clearPolling();
        setProgress(100);
        setResponseText(formatEvaluationResult(data.result));
        const finalText =
          extractReasoning(data.result.file_assessment.reasoning).trim()
          + '\n\n' 
          + extractReasoning(data.result.evaluation_result.reasoning).trim();
        setThoughtSteps(prev => {
          if (prev.includes(finalText)) return prev;
          return [...prev, finalText];
        });
        setActiveTab('report');
      } else if (data.status === 'error') {
        await clearPolling();
        setEvaluationId(null);
        setError(data.error);
      } else if (data.status === 'processing') {
        setProgress(data.progress || 0);
        setMessage(data.message || null);
        
        // append each new “step” into our array
        if (data.message) {
          const step = data.message;
          setThoughtSteps(prev => prev[prev.length - 1] === step ? prev : [...prev, step]);
        }
        if (data.reasoning) {
          const text = extractReasoning(data.reasoning).trim();
          if (text) {
            setThoughtSteps(prev => prev.includes(text) ? prev : [...prev, text]);
          }
        }

        // join them for the old <ChainOfThought> component
        setReasoning(thoughtSteps.concat().join('\n\n'));

        setActiveTab('evaluation');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setError('Failed to check evaluation status');
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatEvaluationResult = (result: any) => {
    const validationResults = result.validation_result || { is_sufficient: true, requirements: [] };
    const isPreliminary = !validationResults.is_sufficient;

    // Use semantic HTML that doesn't need to be parsed as HTML in markdown
    const formatRiskScore = (score: number) => {
      // If score is greater than 10, assume it's on a scale of 100 and normalize it
      return score > 10 ? `${score}/100` : `${score}/10`;
    };

    return `${isPreliminary ? '# Preliminary Assessment\n\n' : '# Risk Evaluation Results\n\n'}
  ${isPreliminary ? `
  <div class="warning">
  ${validationResults.requirements.map((req: string) => `<li>${req.trim()}</li>`).join('\n')}
  </div>
  ` : ''}

  ## Overview

  <div class="info">
  ${result.evaluation_result.overview || 'No overview available'}
  </div>

  ## Risk Assessment

  <div class="score">
    <div class="label">Risk Score: <b>${formatRiskScore(result.evaluation_result.risk_score)}</b></div>
    <div class="label">Overall Evaluation: <b>${result.evaluation_result.evaluation}</b></div>
  </div>

  ## Detailed Analysis
  ${(result.evaluation_result.analysis || '').split('\n').map((point: string) => 
    point
  ).join('\n')}`;
  };

  // Fetch emails function
  const fetchEmails = async () => {
    setIsLoadingEmails(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/emails/fetch`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `et-st-92847291745mcefh0287348cg65ds56d9`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      
      const data = await response.json();
      setEmails(data);
      
      // Select the first email by default if available
      if (data.length > 0) {
        setSelectedEmail(data[0]);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Failed to fetch emails. Please try again later.');
    } finally {
      setIsLoadingEmails(false);
    }
  };

  // Handle email submission for risk evaluation
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail) {
      setError('Please select an email to evaluate.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setProgress(0);
    setMessage(null);
    setResponseText(null);
    setThoughtSteps([]);
    setReasoning(null);
    
    try {
      // Start evaluation with selected email
      const selectedEmailIndex = emails.findIndex(email => 
        email.subject === selectedEmail.subject && 
        email.from[0].email === selectedEmail.from[0].email
      );
      
      const response = await fetch(`${API_BASE_URL}/evaluate/risk/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `et-st-92847291745mcefh0287348cg65ds56d9`
        },
        body: JSON.stringify({ emailId: selectedEmailIndex + 1 }) // Use index + 1 as submission_id
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { evaluation_id } = await response.json();
      await clearPolling();
      setEvaluationId(evaluation_id);
      setIsLoading(true);
      setProgress(0);
      setMessage(null);
      
      // Start polling for results
      const interval = setInterval(() => {
        checkEvaluationStatus(evaluation_id);
      }, POLL_INTERVAL);
      
      setPollInterval(interval);
      
      // Auto-switch to evaluation tab
      setActiveTab('evaluation');

    } catch (error) {
      console.error('Error processing email submission:', error);
      setError(`Error evaluating email: ${error}`);
      setIsLoading(false);
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent, isRerun = false) => {
    e.preventDefault();
    if (!files && !isRerun) {
      setError('Please select files to upload.');
      return;
    }
    if (isRerun && !supportingFiles) {
      setError('Please select supporting documents.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setProgress(0);
    setMessage(null);
    const formData = new FormData();
    const filesToUpload = isRerun ? supportingFiles : files;
    
    if (filesToUpload) {
      Array.from(filesToUpload).forEach(file => {
        formData.append('files', file);
      });
    }

    try {
      // Start evaluation
      const response = await fetch(`${API_BASE_URL}/evaluate/risk`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `et-st-92847291745mcefh0287348cg65ds56d9`
        },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { evaluation_id } = await response.json();
      await clearPolling();
      setEvaluationId(evaluation_id);
      setIsLoading(true);
      setProgress(0);
      setMessage(null);
      // Start polling
      const interval = setInterval(() => {
        checkEvaluationStatus(evaluation_id);
      }, POLL_INTERVAL);
      
      setPollInterval(interval);
      
      // Auto-switch to evaluation tab
      setActiveTab('evaluation');

    } catch (error) {
      console.error('Error during file upload:', error);
      setError(`Error processing files: ${error}`);
      setIsLoading(false);
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      setProgress(0);
      setMessage(null);
      setResponseText(null);
      setThoughtSteps([]);
      setReasoning(null);
      setEvaluationId(null);
    }
  };

  // Add cancel evaluation handler
  const handleCancel = async () => {
    console.log('Cancelling evaluation...', evaluationId, pollInterval, isLoading,);
    if (!evaluationId) return;

    try {
      await fetch(`${API_BASE_URL}/evaluate/risk/${evaluationId}`, {
        method: 'DELETE'
      });
      
      await clearPolling();
      setError('Evaluation cancelled');
    } catch (error) {
      console.error('Error cancelling evaluation:', error);
      setError('Failed to cancel evaluation');
    }
  };

  const extractReasoning = (responseText: string) => {
    // extract reasoning from <think> ... </think> tags
    return responseText.includes('<think>') && responseText.includes('</think>') ? responseText.split('</think>')[0].replace('<think>', '') : responseText
  };

  // Update the renderActionButton function to work with both file uploads and email submissions
  const renderActionButton = (isLoading: boolean, filesOrEmail: FileList | EmailData | null) => {
    const isEmailMode = activeTab === 'input' && inputMode === 'email';
    return (
    <div className="flex gap-4">
      <button
        type={isEmailMode ? 'button' : 'submit'}
        onClick={isEmailMode ? handleEmailSubmit : undefined}
        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading || !filesOrEmail || evaluationId !== null}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </>
        ) : (
          'Evaluate Risk'
        )}
      </button>
      {isLoading && (
        <button
          type="button"
          onClick={handleCancel}
          className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors duration-300"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

  const handleChatMessage = async (messages: Message[]) => {
    if (!chatInput.trim()) return;
  
    const messageToSend = chatInput;
    setChatInput("");
  
    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      sender: 'You'
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    // remove sender from messages where role is user or assistant
    const formattedMessages = messages.filter(message => 
      message.role === 'user' || message.role === 'assistant'
    ).map(message => ({
      role: message.role,
      content: message.content
    }));
    
    try {      
      // Use fetch with streaming response
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': `et-st-92847291745mcefh0287348cg65ds56d9`
        },
        body: JSON.stringify({ 
          messages: [...formattedMessages, {role: 'user', content: messageToSend}],
          eval_id: evaluationId,
          mode: 'stream'
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Process the stream
      const processStream = async () => {
        if (!reader) return;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete SSE messages
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (!line.trim()) continue;
              
              // Parse the SSE message
              const eventMatch = line.match(/^event: (.+)$/m);
              const dataMatch = line.match(/^data: (.+)$/m);
              
              if (eventMatch && dataMatch) {
                const eventType = eventMatch[1];
                const data = JSON.parse(dataMatch[1]);
                
                switch (eventType) {
                  case 'token':
                  case 'message':
                    // Update the latest message content with the token
                    setChatMessages(prev => {
                      const updated = [...prev];
                      const lastMessage = updated[updated.length - 1];
                      if (lastMessage.role === 'assistant') {
                        lastMessage.content += data.content || '';
                      }
                      return updated;
                    });
                    break;
                    
                  case 'tool_call':
                    setChatMessages(prev => [...prev, {
                      role: 'tool',
                      content: data.content,
                    }]);
                    break;
                    
                  case 'tool_output':
                    console.log('Tool output:', data.content);
                    break;
                    
                  case 'final_response':
                    setChatMessages(prev => [...prev, {
                      role: 'assistant',
                      content: data.content,
                      sender: 'Producer Assistant'
                    }]);
                    break;
                    
                  case 'error':
                    setChatMessages(prev => {
                      const updated = [...prev];
                      const lastMessage = updated[updated.length - 1];
                      if (lastMessage.role === 'assistant') {
                        lastMessage.content = `Error: ${data.content || 'Unknown error'}`;
                      }
                      return updated;
                    });
                    break;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing stream:', error);
        } finally {
          setIsChatLoading(false);
        }
      };
      
      processStream();
      
    } catch (error) {
      console.error("Chat error:", error);
      
      // Update the temporary message with an error
      setChatMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = 'Sorry, there was an error processing your request. Please try again.';
        }
        return updated;
      });
      
      setIsChatLoading(false);
    }
  };

  const detailsPanelContent = (
    <>
        <h3 className="text-xl font-semibold mb-4">Business Context</h3>
        <p className="text-gray-700 leading-relaxed">
          Underwriters process thousands of insurance applications daily, evaluating complex risk factors 
          across multiple lines of business. Traditional underwriting relies heavily on manual assessment 
          of policy documents, financial statements, inspection reports, and historical data. This manual 
          process is time-intensive, prone to inconsistencies, and can lead to suboptimal risk pricing 
          or missed opportunities. With increasing regulatory requirements and competitive market pressures, 
          insurers need faster, more accurate risk evaluation capabilities.
        </p>
        <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
        <p className="text-gray-700 leading-relaxed">
          Current underwriting processes face significant challenges: inconsistent risk assessment across 
          different underwriters, lengthy review cycles that delay quote delivery, difficulty in validating 
          document sufficiency before assessment, and limited integration of external data sources. 
          Underwriters need an intelligent system that can analyze application documents, validate data 
          completeness, assess risk factors using industry guidelines, and provide evidence-based 
          recommendations while maintaining regulatory compliance and audit trails.
        </p>
        <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
        <p className="text-gray-700 leading-relaxed">
          Implementing AI-driven risk evaluation delivers significant business value:
        </p>
        <ul className="text-gray-700 leading-relaxed list-disc ml-6">
          <li>
            <strong>Operational Efficiency:</strong> 60% faster time-to-quote through automated document 
            analysis and risk assessment
          </li>
          <li>
            <strong>Risk Quality:</strong> 75% improvement in risk assessment accuracy through consistent 
            application of underwriting guidelines and multi-agent validation
          </li>
          <li>
            <strong>Regulatory Compliance:</strong> Enhanced audit trails and evidence-based decision 
            making support regulatory requirements
          </li>
          <li>
            <strong>Competitive Advantage:</strong> Faster quote turnaround improves customer experience 
            and market responsiveness
          </li>
          <li>
            <strong>Resource Optimization:</strong> Underwriters can focus on complex cases requiring 
            human judgment while routine assessments are automated
          </li>
        </ul>
      </>
    );

    
    const setupPanelContent = (
      <>
          <h3 className="text-xl font-semibold mb-4">Developer Setup</h3>
          <p className="text-gray-700 leading-relaxed">To set up and run this PoC locally, follow these steps:</p>
          <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
            <li>Ensure you have Python 3.11 installed on your system.</li>
            <li>
              Clone the underwriting risk evaluation repository and install dependencies:
              <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
                <code>pip install -r requirements.txt</code>
              </pre>
            </li>
            <li>
              Start the Quart service for risk evaluation:
              <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
                <code>python main.py</code>
              </pre>
            </li>
          </ol>
          
          <h3 className="text-xl font-semibold mt-6 mb-4">How to Use This PoC</h3>
          <p className="text-gray-700 leading-relaxed">Follow these steps to evaluate underwriting risk:</p>
          <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
            <li>Upload application documents (PDF, TXT, JSON, or ZIP files) using the file upload area.</li>
            <li>Click "Evaluate Risk" to start the multi-agent analysis process.</li>
            <li>Monitor the progress as the system validates document sufficiency and performs risk assessment.</li>
            <li>Review the comprehensive risk evaluation results with evidence-based reasoning.</li>
            <li>If reassessment is required, upload additional supporting documents when prompted.</li>
            <li>Use the Producer Assistant chat for questions about specific risk factors or underwriting guidelines.</li>
          </ol>
          
          <h3 className="text-xl font-semibold mt-6 mb-4">System Architecture</h3>
          <p className="text-gray-700 leading-relaxed">
            The system employs multiple specialized AI agents working together:
          </p>
          <ul className="list-disc ml-6 text-gray-700 leading-relaxed">
            <li><strong>Document Analysis Agent:</strong> Extracts and structures information from uploaded documents</li>
            <li><strong>Sufficiency Validation Agent:</strong> Ensures all required information is present for assessment</li>
            <li><strong>Risk Assessment Agent:</strong> Evaluates risk factors using underwriting guidelines via RAG</li>
            <li><strong>Producer Assistant:</strong> Interactive chat interface for underwriting guidance</li>
          </ul>
        </>
      );

  const chatPanelContent = (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4">Concierge ChatBot</h3>
      <p className="text-gray-700 mb-4">
        Ask questions about risk assessments, underwriting guidelines, or get help with evaluating specific risks.
      </p>
      <div className="flex-grow">
        {/* 
        <ChatBox
          title="Concierge ChatBot"
          messages={chatMessages}
          inputMessage={chatInput}
          loading={isChatLoading}
          onInputChange={setChatInput}
          onSendMessage={handleChatMessage}
        />
        */}
      </div>
    </div>
  );

  // Updated EmailTabContent component
  const EmailTabContent = () => (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg">
        {emails.length === 0 && !isLoadingEmails && (
          <div className="p-6 text-center">
            <p className="text-gray-600 mb-4">No emails loaded. Click the button below to fetch emails.</p>
            <button 
              type="button" 
              onClick={fetchEmails}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Fetch Emails
            </button>
          </div>
        )}
        
        {isLoadingEmails && (
          <div className="p-6 text-center">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading emails...</p>
          </div>
        )}
        
        {emails.length > 0 && !isLoadingEmails && (
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Email list (left panel) */}
            <div className="md:w-1/2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              <h3 className="font-medium text-lg p-4 bg-gray-50 border-b border-gray-200">Email Submissions</h3>
              <ul className="divide-y divide-gray-200">
                {emails.map((email, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => setSelectedEmail(email)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors duration-200 ${
                        selectedEmail === email ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <p className="font-medium text-gray-900 truncate">{email.subject}</p>
                      <p className="text-sm text-gray-500 truncate">
                        From: {email.from[0]?.name || email.from[0]?.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {email.attachments.length} attachment(s)
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Email details (right panel) */}
            <div className="md:w-1/2 p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {selectedEmail ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">Subject: {selectedEmail.subject}</h3>
                    <p className="text-sm text-gray-500">
                      From: {selectedEmail.from[0]?.name} &lt;{selectedEmail.from[0]?.email}&gt;
                    </p>
                  </div>
                  
                  <div className="border-t border-b border-gray-200 py-4">
                    <h4 className="font-medium mb-2">Message:</h4>
                    <div className="bg-gray-50 p-3 rounded whitespace-pre-wrap text-sm">
                      {selectedEmail.body}
                    </div>
                  </div>
                  
                  {selectedEmail.attachments.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Attachments ({selectedEmail.attachments.length}):</h4>
                      <ul className="space-y-1">
                        {selectedEmail.attachments.map((attachment, idx) => {
                          const filename = attachment.split('/').pop();
                          return (
                            <li key={idx} className="bg-gray-50 p-2 rounded flex items-center">
                              <svg className="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                              </svg>
                              <button 
                                onClick={() => handleAttachmentClick(attachment)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate flex-1 text-left"
                              >
                                {filename}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 012 2z" />
                  </svg>
                  <p className="mt-2">Select an email to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700">
          {error}
        </div>
      )}

      {emails.length > 0 && selectedEmail && (
        <div className="mt-4">
          {renderActionButton(isLoading, selectedEmail)}
        </div>
      )}
    </div>
  );
  
  const UploadTabContent = () => (
    <div className="flex flex-col h-full justify-between space-y-4">
      <div className="flex-grow relative border-2 border-dashed border-gray-300 rounded-lg p-6 transition-all duration-300 hover:border-blue-500 group flex items-center justify-center">
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.json,.zip"
          onChange={(e) => handleFileChange(e, false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          <svg className="mx-auto h-10 w-10 text-gray-400 group-hover:text-blue-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-gray-600 mb-1">Drag and drop files here, or click to select</p>
          <p className="text-sm text-gray-900">
            {files ? `${files.length} files selected` : 'TXT, JSON, or ZIP files'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="mt-2">
        {renderActionButton(isLoading, files)}
      </div>
    </div>
  );
  
  const EvaluationTabContent = () => (
    <div className="space-y-6">
      {/* Always show ChainOfThought if we have reasoning, either from progress or final result */}
      {thoughtSteps.length > 0 && (
        <div className="bg-white rounded-lg shadow-md mb-6">
          <ChainOfThought 
            content={thoughtSteps.join('\n\n')}
          />
        </div>
      )}
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        {evaluationId ? (
          <>
            <div className="flex items-center justify-center mb-4">
              {isLoading ? (
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              )}
            </div>
            <h4 className="text-xl font-medium text-gray-800">Evaluation ID: {evaluationId}</h4>
            {isLoading && (
              <div className="space-y-3 mt-4">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 text-center">{progress}% complete - {message || 'Processing...'}</p>
              </div>
            )}
            <p className="text-gray-600 mt-2">
              {isLoading ? 'Evaluation in progress...' : 'Evaluation complete'}
            </p>
            {isLoading && (
              <button
                type="button"
                onClick={handleCancel}
                className="mt-4 bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                Cancel Evaluation
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-600">No active evaluation. Please submit documents in the Upload tab.</p>
        )}
      </div>
    </div>
  );
  
  const ReportTabContent = () => (
    <div className="space-y-6">
      {responseText ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({children}) => (
                  <h1 className="text-3xl font-bold mb-6 pb-4 border-b border-gray-200">
                    {children}
                  </h1>
                ),
                h2: ({children}) => (
                  <h2 className="text-xl font-semibold text-gray-700 mb-3 mt-6">
                    {children}
                  </h2>
                ),
                p: ({children}) => (
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {children}
                  </p>
                ),
                ul: ({children}) => (
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    {children}
                  </ul>
                ),
                ol: ({children}) => (
                  <ol className="pl-1 space-y-2 mb-4">
                    {children}
                  </ol>
                ),
                li: ({children}) => (
                  <li className="text-gray-600 list-none pl-4">
                    {children}
                  </li>
                ),
                strong: ({children}) => (
                  <strong className="font-semibold text-gray-800">
                    {children}
                  </strong>
                ),
                // Custom components for our special sections
                div: ({children, className}) => {
                  if (className?.includes('warning')) {
                    return (
                      <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400 mb-6">
                        <h3 className="text-yellow-800 font-bold mb-2">⚠️ Reassessment Required</h3>
                        <p className="text-yellow-700 mb-2">Additional documentation needed to complete the assessment:</p>
                        {children}
                      </div>
                    );
                  }
                  if (className?.includes('info')) {
                    return (
                      <div className="bg-blue-50 p-6 rounded-lg mb-6">
                        {children}
                      </div>
                    );
                  }
                  if (className?.includes('score')) {
                    return (
                      <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <div className="flex gap-8">
                          {children}
                        </div>
                      </div>
                    );
                  }
                  if (className?.includes('label')) {
                    return (
                      <div className="bg-gray-100 p-4 rounded-lg">
                        {children}
                      </div>
                    );
                  }
                  return <div className="mb-4">{children}</div>;
                }
              }}
            >
              {responseText}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p className="mt-4 text-gray-600">No report available yet. Complete an evaluation to view results.</p>
        </div>
      )}
    </div>
  );

  const demoContent = (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50 w-full">
        <button
          type="button"
          onClick={() => setActiveTab('input')}
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 
            ${activeTab === 'input' 
              ? 'text-white bg-primary-dark border-b-2 border-primary' 
              : 'text-gray-500 hover:text-primary hover:bg-gray-100'
            }`}
        >
          Input
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('evaluation')}
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 
            ${activeTab === 'evaluation' 
              ? 'text-white bg-primary-dark border-b-2 border-primary' 
              : 'text-gray-500 hover:text-primary hover:bg-gray-100'
            }`}
        >
          Evaluation
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('report')}
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 
            ${activeTab === 'report' 
              ? 'text-white bg-primary-dark border-b-2 border-primary' 
              : 'text-gray-500 hover:text-primary hover:bg-gray-100'
            }`}
        >
          Report
        </button>
      </div>

      {/* Content area - Reduced height with shadow */}
      <div className="bg-white shadow-xl w-full flex-grow overflow-auto">
        {/* Tab Content with reduced padding */}
        <div className="p-6 h-full">
          <form onSubmit={(e) => handleSubmit(e, false)} className="h-full flex flex-col">
             {/* if we're in the new “Input” tab, show a little sub-nav */}
            {activeTab === 'input' && (
              <div className="flex mb-4 space-x-4">
                <button
                  type="button"
                  onClick={() => setInputMode('email')}
                  className={`px-4 py-2 rounded ${inputMode==='email'? 'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`px-4 py-2 rounded ${inputMode==='upload'? 'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}
                  >
                    Upload
                  </button>
              </div>
            )}

            {/* render the appropriate content */}
            {activeTab === 'input' && inputMode === 'email' && <EmailTabContent />}
            {activeTab === 'input' && inputMode === 'upload' && <UploadTabContent />}
            {activeTab === 'evaluation' && <EvaluationTabContent />}
            {activeTab === 'report' && <ReportTabContent />}
          </form>
        </div>
      </div>
    </div>
  );

  const handleAttachmentClick = async (attachmentPath: string) => {
    setIsAttachmentLoading(true);
    setSelectedAttachment(attachmentPath);
    setShowAttachmentModal(true);
    
    try {
      // Fetch the attachment content from the API
      const response = await fetch(`${API_BASE_URL}/emails/attachment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `et-st-92847291745mcefh0287348cg65ds56d9`
        },
        body: JSON.stringify({ path: attachmentPath })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch attachment');
      }
      
      const data = await response.json();
      setAttachmentContent(data.content);
    } catch (error) {
      console.error('Error fetching attachment:', error);
      setError(`Failed to load attachment: ${error}`);
    } finally {
      setIsAttachmentLoading(false);
    }
  };

  const closeAttachmentModal = () => {
    setShowAttachmentModal(false);
    setSelectedAttachment(null);
    setAttachmentContent(null);
  };

  // Add the Attachment Modal component
  const AttachmentModal = () => {
    if (!showAttachmentModal) return null;
    
    const filename = selectedAttachment?.split('/').pop() || 'Attachment';
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    
    // Determine if it's a PDF or other type
    const isPdf = fileExtension === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '');
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{filename}</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={closeAttachmentModal}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-auto">
            {isAttachmentLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="ml-3 text-gray-600">Loading attachment...</p>
              </div>
            ) : (
              <>
                {isPdf && attachmentContent && (
                  <iframe
                    src={`data:application/pdf;base64,${attachmentContent}`}
                    className="w-full h-full min-h-[500px]"
                    title={filename}
                  ></iframe>
                )}
                {isImage && attachmentContent && (
                  <img 
                    src={`data:image/${fileExtension};base64,${attachmentContent}`} 
                    alt={filename}
                    className="max-w-full max-h-[60vh] mx-auto" 
                  />
                )}
                {!isPdf && !isImage && attachmentContent && (
                  <div className="bg-gray-50 p-4 rounded overflow-auto whitespace-pre-wrap">
                    {attachmentContent}
                  </div>
                )}
                {!attachmentContent && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Unable to preview this file type</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={closeAttachmentModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modify the return statement of the main function to include the AttachmentModal
  return (
    <PocPageWrapper
      metadata={metadata}
      demoContent={demoContent}
      infoContent={detailsPanelContent}
      setupContent={setupPanelContent}
      fixedContent={(
        <>
          <ChatBubble
            messages={chatMessages}
            inputMessage={chatInput}
            loading={isChatLoading}
            onInputChange={setChatInput}
            onSendMessage={(chatBoxMessages: ChatBoxMessage[]) => handleChatMessage(chatBoxMessages as unknown as Message[])}
            title="Producer Assistant"
          />
          {/* Add the attachment modal here so it's available globally */}
          <AttachmentModal />
        </>
      )}
    />
  );
}