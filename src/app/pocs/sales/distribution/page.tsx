"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import ChatBox, { Message } from "components/ChatBox";
import DataManagementPanel from "components/DataManagementPanel";
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';



// const API_BASE_URL = "http://localhost:11069/"; WHile testing use this in local
const API_BASE_URL = 'https://www.valuemomentum.studio/dist_chat'


interface ChatResponse {
  question: string;
  answer: string;
  source: string;
  document_path: string;
  reliability_level: string;
}

export default function ChatPage() {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Initialize messages with just the welcome message, no persistence
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'system', 
      content: "Hello! I’m here to help with any questions you have about insurance distribution rules and processes. How can I assist you today?", 
      sender: 'Max' 
    }
  ]);

  const [files, setFiles] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    listFiles();
  }, []);

  function getFormattedTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `Today, ${hours}:${minutes}`;
  }
const handleMessageSubmit = async () => {
  if (!inputMessage.trim()) return;
  if (!hasUserInteracted) setHasUserInteracted(true);

  const messageToSend = inputMessage;
  setInputMessage("");

  const userMessage: Message = {
    role: 'user',
    content: messageToSend,
    sender: 'You',
    timestamp: getFormattedTime()
  };
  setMessages(prev => [...prev, userMessage]);

  setMessages(prev => [
    ...prev,
    {
      role: 'assistant',
      content: '',
      sender: 'Max',
      timestamp: getFormattedTime()
    }
  ]);

  setIsLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          ...messages
            .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
            .map(({ role, content }) => ({ role, content })),
          { role: 'user', content: messageToSend }
        ],
        mode: "stream"
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const evt of events) {
        const lines = evt.split("\n");
        let eventType = "message";
        let dataPayload = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.replace("event:", "").trim();
          } else if (line.startsWith("data:")) {
            dataPayload += line.replace("data:", "").trim();
          }
        }

        if (!dataPayload) continue;

        let parsed;
        try {
          parsed = JSON.parse(dataPayload);
        } catch (err) {
          console.error("JSON parse error:", dataPayload, err);
          continue;
        }

        if (eventType === "tool_call") {
          setMessages(prev => [
            ...prev,
            {
              role: "tool",
              content: parsed.content,
              timestamp: getFormattedTime()
            }
          ]);
        }


        if (eventType === "final_response") {
            const content = parsed.content?.trim();
            const sources = parsed.sources || [];

            const sourceLinks = sources.map((src: any, idx: number) => {
              const filename = src.document_path?.split("/").pop() || "document";
              return `<a href="download://${filename}" class="text-blue-600 underline">[${idx + 1}]</a>`;
            }).join(" ");

            const finalText = (content || "") + (sourceLinks ? " " + sourceLinks : "");

            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                last.content = finalText;
              } else {
                updated.push({
                  role: "assistant",
                  content: finalText,
                  sender: "Max",
                  timestamp: getFormattedTime()
                });
              }
              return updated;
            });
          }

        if (eventType === "error") {
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: `Error: ${parsed.content || "Unknown error"}`,
              sender: "Max",
              timestamp: getFormattedTime()
            }
          ]);
        }
      }
    }
  } catch (error) {
    console.error("❌ Streaming chat error:", error);
    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        sender: "Max",
        timestamp: getFormattedTime()
      }
    ]);
  } finally {
    setIsLoading(false);
  }
};

  const handleDocumentDownload = async (documentPath: string) => {
    try {
      const filename = documentPath.split('/').pop() || 'document';
      const response = await axios.get(`${API_BASE_URL}/api/download/${filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const listFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/files/`);
      setFiles(response.data.files);
      console.log("[FRONTEND] Files received from backend:", response.data.files);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
  
    setIsUploading(true);
    setUploadStatus('');
  
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
  
        await axios.post(`${API_BASE_URL}/api/upload/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
  
      setUploadStatus('Files uploaded successfully!');
      listFiles();
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError 
        ? error.response?.data?.detail 
        : error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
      setUploadStatus(`Upload failed: ${errorMessage}`);
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) event.target.value = '';
    }
  };

  const handleDeleteFile = async (filename: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/files/${filename}`);
      setFiles(prev => prev.filter(f => f !== filename));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleRebuildIndex = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/rebuild-index/`);
      setUploadStatus('Knowledge base index rebuilt successfully!');
    } catch (error) {
      setUploadStatus('Failed to rebuild index.');
      console.error("Index rebuild failed:", error);
    }
  };

  // Content for the Details panel
  const detailsPanelContent = (
      <>
        <h3 className="text-lg font-semibold mt-4">Executive Summary</h3>
        <p className="mt-1">
          The objective of this PoC is to develop and validate a conversational chatbot that assists distribution and sales teams in accessing information from distribution-related documents. 
          It enables users to upload relevant materials and interactively query them, reducing manual search efforts and delivering real-time, document-grounded responses.
        </p>
        <h3 className="text-lg font-semibold mt-4">Background and Business Problem</h3>
        <p className="mt-1">
          Distribution teams often work with scattered documentation—such as underwriting guidelines, policy manuals, and training materials—which can be time-consuming to search and reference. 
          This PoC addresses the challenge by providing a unified interface that enables quick retrieval of accurate answers from uploaded documents.
        </p>
        <h3 className="text-lg font-semibold mt-4">Justification for the PoC</h3>
        <p className="mt-1">
          This PoC leverages modern AI technologies such as agent-based orchestration, LangGraph, LangChain, and Retrieval-Augmented Generation (RAG) to process questions and dynamically route them to the appropriate tools.
          It empowers distribution teams to make informed decisions by using their own documents as a trusted knowledge base.
        </p>
      </>
    );

  // Content for the How to start demo panel
   const howToStartPanelContent = (
    <div className="mt-4">
      Description of how to start services and run if they aren&apos;t up and running.
      <ol className="mt-2">
        <li>1. Start Ollama</li>
        <li>2. Start Distribution Chat service</li>
      </ol>
    </div>
  );
  const dataManagementContent = (
  <DataManagementPanel
    files={files}
    uploadStatus={uploadStatus}
    isUploading={isUploading}
    onFileUpload={handleFileUpload}
    onDeleteFile={handleDeleteFile}
    showAvatar={true}
    userInteracted={hasUserInteracted}
  />
);
const demoContent = (
  <div className="bg-gray-100 p-0 flex items-center justify-center w-[50%] mx-auto">
    <ChatBox
      title="Distribution Chat Bot"
      messages={messages}
      inputMessage={inputMessage}
      loading={isLoading}
      onInputChange={setInputMessage}
      onSendMessage={handleMessageSubmit}
      onDocumentDownload={handleDocumentDownload}
      showAvatarForAssistant={true}
    />
  </div>
);

  return (
    <PocPageWrapper
      metadata={metadata}
      demoContent={demoContent}
      infoContent={detailsPanelContent}
      setupContent={howToStartPanelContent}
      dataContent={dataManagementContent}
    />
  );
}