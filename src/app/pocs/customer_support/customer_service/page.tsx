"use client";

import { useState, useEffect } from "react";
import ChatBox, { Message } from "components/ChatBox";
import PocPageWrapper from "components/PocPageWrapper";
import metadata from "./metadata.json";
// import SideMenu from "components/SideMenu";
import DataManagementPanel from "../../../../components/DataManagementPanel";

const API_BASE_URL = "https://www.valuemomentum.studio/customer_support";

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
      content: "Hi, I'm a support bot. How can I assist you today?", 
      sender: 'VM Support' 
    }
  ]);

  const [files, setFiles] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    listFiles();
  }, []);

  const handleMessageSubmit = async () => {
    if (!inputMessage.trim()) return;

    const messageToSend = inputMessage;
    setInputMessage("");

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      sender: 'You'
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend }),
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      const data: ChatResponse = await response.json();

      // Simplify response handling - only include reliability and documents if they exist and are valid
      let botMessageContent = data.answer;
      let documents = undefined;

      // Only add reliability and documents if they exist and answer is not a "no information" response
      if (data.document_path.startsWith("/home")) {
        botMessageContent = `${data.answer}`;
        documents = [data.document_path];
      }

      const botMessage: Message = {
        role: 'bot',
        content: botMessageContent,
        sender: 'VM Support',
        documents: documents
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'bot',
        content: 'Failed to process request. Please try again.',
        sender: 'VM Support'
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error("❌ Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentDownload = async (documentPath: string) => {
    try {
      const filename = documentPath.split('/').pop() || 'document';
      const response = await fetch(`${API_BASE_URL}/api/download/${filename}`);
      
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
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
      const response = await fetch(`${API_BASE_URL}/api/files/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files with status ${response.status}`);
      }
      
      const data = await response.json();
      setFiles(data.files);
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

        const response = await fetch(`${API_BASE_URL}/api/upload/`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
        }
      }

      setUploadStatus('Files uploaded successfully!');
      listFiles();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
      const response = await fetch(`${API_BASE_URL}/api/files/${filename}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`);
      }
      
      setFiles(prev => prev.filter(f => f !== filename));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleRebuildIndex = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rebuild-index/`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Index rebuild failed with status ${response.status}`);
      }
      
      setUploadStatus('Knowledge base index rebuilt successfully!');
    } catch (error) {
      setUploadStatus('Failed to rebuild index.');
      console.error("Index rebuild failed:", error);
    }
  };

  // Content for the Details panel
  const detailsPanelContent = (
    <div className="p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">AI-powered RAG Customer Support System</h2>
      
      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
        <p className="text-gray-700">
          A Retrieval-Augmented Generation (RAG) based customer support system that combines Mistral LLM with ChromaDB for intelligent document retrieval and response generation. The system processes customer queries, retrieves relevant documentation, and generates contextual responses while maintaining source traceability.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">System Architecture</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Core Components:</h4>
            <div className="space-y-3">
              <div>
                <p className="font-medium">1. Query Processing Pipeline</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Generic Query Detection</li>
                  <li>Context Classification</li>
                  <li>Follow-up Question Handling</li>
                  <li>Response Generation with Source Attribution</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">2. Document Management</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Real-time File Monitoring (Watchdog)</li>
                  <li>Automatic Document Processing</li>
                  <li>ChromaDB Vector Storage</li>
                  <li>Document Embedding Generation</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">3. LLM Integration</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Mistral Model via Ollama</li>
                  <li>Context-aware Response Generation</li>
                  <li>Chat History Management</li>
                  <li>Reliability Scoring</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Key Features</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">1. Intelligent Query Processing</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Automatic query classification (generic/contextual/non-contextual)</li>
              <li>Follow-up question detection</li>
              <li>Context-aware response generation</li>
              <li>Source documentation tracking</li>
            </ul>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">2. Document Management</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Supported formats: PDF, DOC, DOCX, TXT</li>
              <li>Real-time document monitoring</li>
              <li>Automatic embedding generation</li>
              <li>Version tracking and updates</li>
            </ul>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">3. Quality Assurance</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Response reliability scoring (high/medium/low)</li>
              <li>Source attribution</li>
              <li>Context relevance verification</li>
              <li>Answer completeness checking</li>
            </ul>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">4. System Integration</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>FastAPI REST endpoints</li>
              <li>File management API</li>
              <li>Real-time processing status updates</li>
              <li>Secure file handling</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Future Enhancements</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Multi-model support</li>
          <li>Enhanced reliability metrics</li>
          <li>Automated knowledge base updates</li>
          <li>Advanced query preprocessing</li>
          <li>Improved context matching</li>
        </ul>
      </section>
    </div>
  );

  // Content for the How to start demo panel
  const howToStartPanelContent = (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-4">Getting Started Guide: RAG Customer Support System</h2>

      <section className="mb-6">
        <h3 className="text-lg font-semibold">Prerequisites</h3>
        <div className="space-y-4 mt-2">
          <div>
            <h4 className="font-medium">Required Software</h4>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Python (v3.9 or higher)</li>
              <li>Ollama (latest version)</li>
              <li>Node.js (v18 or higher) - for frontend development</li>
              <li>Git</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">System Requirements</h4>
            <ul className="list-disc pl-5 text-gray-700">
              <li>8GB RAM minimum (16GB recommended)</li>
              <li>10GB free disk space</li>
              <li>Internet connection for model downloads</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold">Step 1: Environment Setup</h3>
        <ol className="list-decimal pl-5 mt-2 space-y-4">
          <li>
            <p className="font-medium">Clone the Repository</p>
            <pre className="bg-gray-100 p-2 mt-1 rounded">
              git clone https://github.com/yourusername/ET-AI-CustomerServiceFaq.git{"\n"}
              cd ET-AI-CustomerServiceFaq
            </pre>
          </li>
          <li>
            <p className="font-medium">Create Python Environment</p>
            <pre className="bg-gray-100 p-2 mt-1 rounded">
              python -m venv venv{"\n"}
              source venv/bin/activate  # On Windows: venv\Scripts\activate{"\n"}
              pip install -r requirements.txt
            </pre>
          </li>
          <li>
            <p className="font-medium">Install Ollama</p>
            <pre className="bg-gray-100 p-2 mt-1 rounded">
              # For Linux/MacOS{"\n"}
              curl https://ollama.ai/install.sh | sh{"\n\n"}
              # For Windows{"\n"}
              # Download from https://ollama.ai/download
            </pre>
          </li>
          <li>
            <p className="font-medium">Pull Mistral Model</p>
            <pre className="bg-gray-100 p-2 mt-1 rounded">ollama pull mistral</pre>
          </li>
        </ol>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold">Step 2: Configuration Setup</h3>
        <div className="space-y-4 mt-2">
          <div>
            <p className="font-medium">Verify Directory Structure</p>
            <pre className="bg-gray-100 p-2 mt-1 rounded">
              ET-AI-CustomerServiceFaq/{"\n"}
              ├── rag-custsupport/{"\n"}
              │   ├── main_backend.py{"\n"}
              │   ├── llm_main.py{"\n"}
              │   └── services/{"\n"}
              ├── docs/{"\n"}
              └── data/{"\n"}
                  └── documents/  # Create this directory
            </pre>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold">Step 3: Start the Backend</h3>
        <ol className="list-decimal pl-5 mt-2 space-y-2">
          <li>Navigate to RAG Customer Support Directory:
            <pre className="bg-gray-100 p-2 mt-1 rounded">cd rag-custsupport</pre>
          </li>
          <li>Start FastAPI Server:
            <pre className="bg-gray-100 p-2 mt-1 rounded">python main_backend.py</pre>
          </li>
          <li>Verify Backend Health:
            <ul className="list-disc pl-5 mt-1">
              <li>Open browser to: <a href="http://localhost:8001/docs" className="text-blue-600 hover:underline">http://localhost:8001/docs</a></li>
              <li>Check API documentation is accessible</li>
              <li>Test basic endpoints</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold">Common Issues & Troubleshooting</h3>
        <div className="space-y-4 mt-2">
          <div>
            <h4 className="font-medium">Ollama Issues</h4>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Ensure Ollama service is running: <code>ollama serve</code></li>
              <li>Check model availability: <code>ollama list</code></li>
              <li>Verify no port conflicts on 11434</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Document Processing</h4>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Check file permissions in documents directory</li>
              <li>Verify supported file formats</li>
              <li>Monitor logs for processing errors</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">API Connection</h4>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Default port: 8001</li>
              <li>Check firewall settings</li>
              <li>Verify CORS configuration if needed</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold">Additional Resources</h3>
        <ul className="list-disc pl-5 mt-2">
          <li>FastAPI Documentation: <a href="http://localhost:8001/docs" className="text-blue-600 hover:underline">http://localhost:8001/docs</a></li>
          <li>ChromaDB Docs: <a href="https://docs.trychroma.com/" className="text-blue-600 hover:underline">https://docs.trychroma.com/</a></li>
          <li>Ollama Guide: <a href="https://ollama.ai/docs" className="text-blue-600 hover:underline">https://ollama.ai/docs</a></li>
          <li>GitHub Issues: <a href="https://github.com/yourusername/ET-AI-CustomerServiceFaq/issues" className="text-blue-600 hover:underline">Repository Issues</a></li>
        </ul>
      </section>
    </div>
  );
  const dataManagementContent = (
    <DataManagementPanel
      files={files}
      uploadStatus={uploadStatus}
      isUploading={isUploading}
      onFileUpload={handleFileUpload}
      onDeleteFile={handleDeleteFile}
      />
    );
    
  const demoContent = (
    <div className="bg-gray-100 p-0 flex items-center justify-center w-[50%] mx-auto">
        <ChatBox
          title="Customer Support"
          messages={messages}
          inputMessage={inputMessage}
          loading={isLoading}
          onInputChange={setInputMessage}
          onSendMessage={handleMessageSubmit}
          onDocumentDownload={handleDocumentDownload}
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
  )
}