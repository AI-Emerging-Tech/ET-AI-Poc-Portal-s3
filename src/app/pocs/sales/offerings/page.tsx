'use client';

import { useState, useEffect } from 'react';
import ChatBox, { Message } from 'components/ChatBox';
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';

export default function OfferingsChat() {
  const [selectedService, setSelectedService] = useState('llamaindex');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'Hello! How can I help you today?', sender: ''},
  ]);
  const [session_id] = useState(Math.random().toString(36).substring(7));
  const [port, setPort] = useState(5500);

  useEffect(() => {
    const linuxUser = process.env.NEXT_PUBLIC_USERNAME;
    // Determine the port based on the username
    if (linuxUser === 'qholmes') {
      setPort(5500);
    } else if (linuxUser === 'omohammed') {
      setPort(5501);
    } else {
      setPort(5502);
    }
  }, []);

  const API_BASE_URL = port === 5502 
    ? 'https://www.valuemomentum.studio/offering_rag'
    : `http://localhost:${port}`;

  const handleMessageSubmit = async () => {
    if (!inputMessage.trim()) return;

    const messageToSend = inputMessage;
    setInputMessage('');

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      sender: 'You'
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const endpoint = selectedService === 'llamaindex' ? '/api/llamaindex' : '/api/langchain';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageToSend,
          session_id: session_id
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage: Message = {
        role: 'bot',
        content: data.response.response,
        sender: selectedService,
        documents: data.response.document_paths || [],
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'bot',
        content: 'Failed to process request. Please try again.',
        sender: selectedService
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentDownload = async (documentPath: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/download/${encodeURIComponent(documentPath.split('/').pop() || '')}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentPath.split('/').pop() || '';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Content for the Details panel
  const detailsPanelContent = (
    <>
      <h3 className="text-lg font-semibold mt-4">Executive Summary</h3>
      <p className="mt-1">
        The objective of this PoC is to develop and validate a conversation bot that enables the sales and customer success teams to resolve questions 
        and answers around the ValueMomentum vertical team offerings, freeing up vertical resources and providing real-time answers.
      </p>
      <h3 className="text-lg font-semibold mt-4">Background and Business Problem</h3>
      <p className="mt-1">
        The vertical teams at ValueMomentum are responsible for creating and training sales team members on the various offerings for clients and prospects.
        This PoC is intended to help sales teams quickly access accurate information about the offerings.
      </p>
      <h3 className="text-lg font-semibold mt-4">Justification for the PoC</h3>
      <p className="mt-1">
        This PoC aims to solve current challenges by using new technologies like LlamaIndex, LangChain, and Retrieval-Augmented Generation (RAG).
        It allows ValueMomentum to use existing data and provide real-time answers to sales teams.
      </p>
    </>
  );

  // Content for the How to start demo panel
  const howToStartPanelContent = (
    <div className="mt-4">
      Description of how to start services and run if they aren&apos;t up and running.
      <ol className="mt-2">
        <li>1. Start Ollama</li>
        <li>2. Start LlamaIndex service</li>
        <li>3. Start LangChain service</li>
      </ol>
    </div>
  );

  const demoContent = (
    <div className="flex flex-col items-left bg-gray-100 p-4">

      {/* Service Toggle */}
      <div className="w-full max-w-lg mt-0 mb-4 ml-5 absolute">
        <p className="font-semibold mb-2">Service:</p>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={selectedService === 'llamaindex'}
              onChange={() => setSelectedService('llamaindex')}
              className="form-radio" 
            />
            <span>LlamaIndex</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={selectedService === 'langchain'}
              onChange={() => setSelectedService('langchain')}
              className="form-radio"
            />
            <span>LangChain</span>
          </label>
        </div>
      </div>

      <div className="bg-gray-100 p-0 flex items-center justify-center w-[50%] mx-auto">
        <ChatBox
          title="Offerings Chatbot"
          messages={messages}
          inputMessage={inputMessage}
          loading={isLoading}
          onInputChange={setInputMessage}
          onSendMessage={handleMessageSubmit}
          onDocumentDownload={handleDocumentDownload}
        />
      </div>
    </div>
  );

  return (
    <PocPageWrapper
      metadata={metadata}
      demoContent={demoContent}
      infoContent={detailsPanelContent}
      setupContent={howToStartPanelContent}
    />
  );
}