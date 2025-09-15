'use client';
import PocPageWrapper from 'components/PocPageWrapper';
import Tooltip from 'components/Tooltip';
import ChatBubble from 'components/ChatBubble';
import { Message } from 'components/ChatBox';
import { useSession } from 'next-auth/react';


// Backend configuration

//const BACKEND_HTTP = `http://localhost:${BACKEND_PORT}`;
const BACKEND_HTTP = 'https://www.valuemomentum.studio/cdc/v2';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { FaEye, FaFileAlt, FaHashtag, FaFileSignature, FaCircle, FaUpload, FaChevronDown, FaChevronUp, FaFileInvoice, FaCheck, FaTimes, FaMagic, FaExclamationTriangle, FaChartBar, FaUserTie, FaIndustry, FaCheckCircle, FaInfoCircle, FaCog, FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';

import TiffViewer from './components/TiffViewer';
import metadata from './metadata.json';

// Helper to convert fractional progress (0-1) to percentage (0-100)
const toPercent = (progress: number): number => {
  if (progress <= 1) return Math.round(progress * 100);
  return Math.round(progress); // Already in percentage format
};

type FileStatus = {
  file?: File | null; // Make file optional for reloaded files
  fileName: string;
  fileId: string;
  pageCount?: number;
  progress: number;
  message?: string;
  isDone: boolean;
  result?: {
    claim_number: string;
    extracted_text: string;
    document_type: string;
    summary: object;
    overview: string;
    gw_details: object;
    overviews: string[];
    summaries: object[];
    document_types: string[];
    page_numbers: number[][];
  };
  error?: string;
  taskId?: string; // Add taskId for WebSocket tracking
  jobId?: string; // Add jobId for chat API requests
};

export default function ClaimsClassification() {
  const { data: session } = useSession();
  const [filesStatus, setFilesStatus] = useState<FileStatus[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFileStatus, setSelectedFileStatus] = useState<FileStatus | null>(null);
  const [isDocumentVisible, setIsDocumentVisible] = useState(false);
  const [isExtractedVisible, setIsExtractedVisible] = useState(true);
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [summary, setSummary] = useState<object>({});
  const [overview, setOverview] = useState<string>("");
  const [summarizer, setSummarizer] = useState(1)
  const [apiStatus, setApiStatus] = useState(0)
  const [isV2, setIsV2] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{id: string, name: string} | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastChatContentRef = useRef<string>("");

  const toggleDocumentVisibility = () => {
    if (isDocumentVisible) {
      setIsDocumentVisible(false);
    } else {
      setIsDocumentVisible(true);
      setIsExtractedVisible(false);
    }
  };

  const toggleExtractedVisibility = () => {
    if (isExtractedVisible) {
      setIsExtractedVisible(false);
    } else {
      setIsExtractedVisible(true);
      setIsDocumentVisible(false);
    }
  };

  const toggleSummarizer = () => {
    if (summarizer === 1){
        setSummarizer(0)
    } else {
        setSummarizer(1)
    }
  }
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const filesArray = Array.from(selectedFiles);
      const newFilesStatus: FileStatus[] = [];
      filesArray.forEach((file) => {
        // Check for duplicates
        const isDuplicate = filesStatus.some(
          (fileStatus) => fileStatus.fileName === file.name
        );

        if (isDuplicate) {
          alert(`The file ${file.name} has already been uploaded.`);
        } else {
          const fileId = uuidv4();
          const newFileStatus: FileStatus = {
            file,
            fileName: file.name,
            fileId,
            progress: 0,     // Initialize progress
            isDone: false,   // Initialize isDone
          };
          newFilesStatus.push(newFileStatus);
        }
      });
      if (newFilesStatus.length > 0) {
        setFilesStatus((prevFilesStatus) => [...prevFilesStatus, ...newFilesStatus]);

        // Start the upload and processing for all files at once
        uploadAndProcessFiles(newFilesStatus);
      }
      
      // Reset the file input to allow selecting the same file again
      event.target.value = '';
    }
  };

  const getApiStatus = async () => {
    try {
      console.log('Testing API connection to:', `${BACKEND_HTTP}/test`);
      const response = await fetch(`${BACKEND_HTTP}/test`, {
        method: 'GET'
      });

      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('API response body:', responseText);
        setApiStatus(1)
      }
      else {
        console.error('API returned non-OK status:', response.status, response.statusText);
        setApiStatus(2)
      }
    }
    catch(error) {
      console.error('API connection failed:', error);
      setApiStatus(2)
    }
  }

  const testFileEndpoint = async (fileId: string) => {
    try {
      const response = await fetch(`${BACKEND_HTTP}/file/${fileId}`);
      console.log('File endpoint test:', {
        status: response.status,
        contentType: response.headers.get('content-type'),
        url: `${BACKEND_HTTP}/file/${fileId}`
      });
      return response.ok;
    } catch (error) {
      console.error('File endpoint test failed:', error);
      return false;
    }
  }

  const showDeleteConfirmation = (fileId: string, fileName: string) => {
    // Disconnect SSE to prevent blinking
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      // setEventSource(null);
      eventSourceRef.current = null;
    }
    setFileToDelete({id: fileId, name: fileName});
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      console.log('Attempting to delete file:', fileToDelete.id);
      const response = await fetch(`${BACKEND_HTTP}/file/${fileToDelete.id}`, {
        method: 'DELETE'
      });
      
      console.log('Delete response status:', response.status);
      
      if (response.ok) {
        console.log('Delete successful, removing from UI');
        setFilesStatus(prev => prev.filter(fs => fs.fileId !== fileToDelete.id));
      } else {
        const errorText = await response.text();
        console.error('Delete failed with status:', response.status, 'Error:', errorText);
        alert(`Failed to delete file: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Delete request failed:', error);
      alert('Failed to delete file: Network error');
    } finally {
      setDeleteModalOpen(false);
      setFileToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setFileToDelete(null);
  };

  // Add SSE connection management
  const connectSSE = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    console.log('Connecting to SSE:', `${BACKEND_HTTP}/queue_status`);
    const sse = new EventSource(`${BACKEND_HTTP}/queue_status`);

    sse.onopen = () => {
      console.log('SSE connected successfully');
    };

    sse.onmessage = (event) => {
      try {
        // Skip empty messages
        if (!event.data || event.data.trim() === '{}' || event.data.trim() === '') {
          return;
        }
        
        console.log('SSE message received:', event.data);
        const updates = JSON.parse(event.data);
        
        // Skip if updates is empty object
        if (Object.keys(updates).length === 0) {
          return;
        }
        
        setFilesStatus(prevStatus => {
          return prevStatus.map(fs => {
            const matchingUpdate = Object.entries(updates).find(([taskId, update]: [string, unknown]) => 
              fs.taskId === taskId || fs.fileId === (update as any).file_id
            );
            
            if (matchingUpdate) {
              const [taskId, updateData] = matchingUpdate;
              const update = updateData as any;
              return {
                ...fs,
                taskId: taskId,
                jobId: update.job_id || taskId,
                progress: update.progress ? toPercent(update.progress) : fs.progress,
                pageCount: update.pages || fs.pageCount,
                message: update.message || fs.message,
                isDone: update.is_done || fs.isDone,
                result: update.result || fs.result,
                error: update.error || fs.error
              };
            }
            return fs;
          });
        });
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    sse.onerror = (ev) => {
      console.error('SSE connection error:', ev);
      const es = ev.target as EventSource;
      es.close();
      eventSourceRef.current = null;
    };

    eventSourceRef.current = sse;
    return sse;
  }, []);

  useEffect(() => {
    // Only connect SSE when we have files that are processing and modals are closed
    const hasProcessingFiles = filesStatus.some(fs => !fs.isDone && !fs.error);
    
    if (!modalOpen && !deleteModalOpen && hasProcessingFiles) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      const sse = connectSSE();
      return () => sse?.close();
    } else if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, [modalOpen, deleteModalOpen, filesStatus]);

  // Replace uploadAndProcessFiles with new queued version
  const uploadAndProcessFiles = async (filesToUpload: FileStatus[]) => {
    const formData = new FormData();
    filesToUpload.forEach((fileStatus) => {
      formData.append(fileStatus.fileId, fileStatus.file);
    });

    try {
      const version = isV2 ? '2' : '1';
      const response = await fetch(
         `${BACKEND_HTTP}/queue_process_files_v2?summarizer=${summarizer}&version=${version}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to queue files');
      }

      const { tasks } = await response.json();
      
      // Update files with their task IDs and job IDs immediately
      setFilesStatus(prevStatus => 
        prevStatus.map(fs => {
          const matchingTask = tasks.find((t: { task_id: string; job_id?: string; file_key: string; }) => t.file_key === fs.fileId);
          if (matchingTask) {
            return {
              ...fs,
              taskId: matchingTask.task_id,
              jobId: matchingTask.job_id || matchingTask.task_id, // Fallback to task_id if job_id missing
              progress: 0,
              message: 'Queued for processing'
            };
          }
          return fs;
        })
      );
    } catch (error) {
      console.error(error);
      filesToUpload.forEach(fileStatus => {
        setFilesStatus(prevStatus =>
          prevStatus.map(fs =>
            fs.fileId === fileStatus.fileId
              ? { ...fs, error: 'Failed to queue file for processing.' }
              : fs
          )
        );
      });
    }
  };

  const fetchExistingFiles = async () => {
    try {
      console.log('Fetching existing files from:', `${BACKEND_HTTP}/files`);
      const response = await fetch(`${BACKEND_HTTP}/files`, {
        method: 'GET'
      });
      console.log('Files endpoint response status:', response.status);
      
      if (response.ok) {
        const files = await response.json();
        console.log('Existing files:', files);
        // Map API response to FileStatus format
        const fileStatuses: FileStatus[] = files.map((file: any) => ({
          file: null as File | null,
          fileName: file.fileName,
          fileId: file.fileId,
          pageCount: file.pageCount,
          progress: file.progress,
          isDone: file.isDone,
          taskId: file.taskId,
          jobId: file.jobId,
          result: file.result
        }));
        setFilesStatus(fileStatuses);
      } else {
        console.error('Files endpoint returned non-OK status:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch existing files:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      getApiStatus();
      fetchExistingFiles();
    }
  }, []);
  
  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  const chooseContent = (pageNumber: number, fileStatus: FileStatus) => {
    if(pageNumber) {
      const selectedOverview = fileStatus.result?.overviews ? fileStatus.result?.overviews[pageNumber-1] : "";
      setSummary(fileStatus.result?.summaries ? fileStatus.result?.summaries[pageNumber-1] : {})
      setOverview(selectedOverview)
    }
    else {
      const selectedOverview = fileStatus.result?.overview || "";
      setSummary(fileStatus.result?.summary || {})
      setOverview(selectedOverview)
    }
  }
  const openModal = (fileStatus: FileStatus, pageNumber: null | number = null) => {
    // Disconnect SSE to prevent blinking
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Reset visibility states for consistent modal behavior
    setIsDocumentVisible(false);
    setIsExtractedVisible(true);
    
    setSelectedFileStatus(fileStatus);
    setSelectedPage(pageNumber);
    chooseContent(pageNumber || 0, fileStatus)
    setModalOpen(true);
    
    // Initialize chat with welcome message but don't show it
    setChatMessages([{
      role: 'assistant',
      content: `**Hello!** I'm your assistant for "**${fileStatus.fileName}**". ${fileStatus.result ? `\n\nThis appears to be a **${fileStatus.result.document_type?.toLocaleUpperCase().replaceAll('_', ' ') || 'document'}** for claim number **${fileStatus.result.claim_number || 'unknown'}**.` : ''} \n\n*You can ask me questions about this document, and I'll help you understand its content.*\n\n**What would you like to know?**`,
      sender: 'Assistant'
    }]);
  };

  const closeModal = () => {
    // Abort any ongoing chat requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsChatLoading(false);
    setModalOpen(false);
    setSelectedFileStatus(null);
    setSelectedPage(null);
  };
  
  // Chat handlers
  // Each document has a unique job ID that ensures chat requests are associated with the correct document
  const handleInputChange = (message: string) => {
    setInputMessage(message);
  };

  const handleSendMessage = async (messages: Message[]) => {
    if (!selectedFileStatus?.fileId || !inputMessage.trim()) return;

    try {
      setIsChatLoading(true);
      
      // Add user message
      const userMessage: Message = {
        role: 'user',
        content: inputMessage,
        sender: 'You'
      };
      setChatMessages(prev => [...prev, userMessage]);
      setInputMessage('');

      // Cancel any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      // Reset chat content ref for new response
      lastChatContentRef.current = '';
      
      // Use fileId for chat API
      const jobId = selectedFileStatus.fileId;
      
      // Use POST with proper SSE handling as shown in the curl example
      const response = await fetch(`${BACKEND_HTTP}/api/job/${jobId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          messages: chatMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })).concat([{
            role: 'user',
            content: inputMessage
          }])
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          setIsChatLoading(false);
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        
        for (const event of events) {
          const lines = event.split('\n');
          let eventType = '';
          let data = '';
          
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              data = line.substring(5).trim();
            }
          }
          
          if (!data) continue;
          
          try {
            const parsedData = JSON.parse(data);
            console.log('Parsed SSE data:', { eventType, parsedData });
            
            switch (eventType) {
              case 'start':
                console.log('Chat request started for job:', jobId);
                break;
                
              case 'tool': {
                if (!parsedData.content) break;
                
                // Handle tool messages specifically
                setChatMessages(prev => [...prev, {
                  role: 'tool',
                  content: parsedData.content,
                  sender: 'Assistant'
                }]);
                break;
              }
                
              case 'message': {
                if (!parsedData.content) break;

                if (parsedData.type === 'tool') {
                  setChatMessages(prev => [...prev, {
                    role: 'tool',
                    content: parsedData.content,
                    sender: 'Assistant'
                  }]);
                  break;
                }

                // Add new assistant message for LLM response if not exists
                lastChatContentRef.current += parsedData.content;
                setChatMessages(prev => {
                  const lastMsg = prev[prev.length - 1];
                  if (!lastMsg || lastMsg.role !== 'assistant') {
                    return [...prev, {
                      role: 'assistant',
                      content: lastChatContentRef.current,
                      sender: 'Assistant'
                    }];
                  }
                  
                  // Update existing assistant message with streaming content
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = {
                    ...lastMsg,
                    content: lastChatContentRef.current
                  };
                  return newMsgs;
                });
                break;
              }
                
              case 'complete':
                // Handle complete event - don't add content as it's already accumulated
                console.log('Chat completed with full response');
                break;
                
              case 'end':
                // Only handle the end event to mark completion
                console.log('Chat ended');
                setIsChatLoading(false);
                break;
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err, 'Raw data:', data);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', error);
        
        // Show error message to user
        setChatMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage?.role === 'assistant') {
            lastMessage.content = 'Sorry, I encountered an error. Please try again later.';
          }
          return newMessages;
        });
      }
    } finally {
      setIsChatLoading(false);
      abortControllerRef.current = null;
    }
  };
  const NestedObjectDisplay = ({ data, level = 0 }: { data: object; level?: number }) => {
    if (level > 5) return null; // Limit to 3 levels
    if (typeof data !== 'object' || data === null) {
      return <div className="nested-value string-value">{String(data)}</div>;
    }

    return (
      <div className={`nested-container level-${level}`}>
        {Object.entries(data).map(([key, value]) => (
          // Skip rendering the key if it's a numeric index
            <div key={key} className="nested-item">
              {!(/^\d+$/.test(key)) && (
                <div className="nested-key">{key.replaceAll('_', ' ')?.toLocaleUpperCase()}</div>
              )}
              <div className="nested-value">
                {typeof value === 'object' ? (
                  <NestedObjectDisplay data={value} level={level + 1} />
                ) : (
                  <span className="string-value">{String(value)}</span>
                )}
              </div>
            </div>
          )
        )}
      </div>
    );
  };

  
  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Business Context</h3>
      <p className="text-gray-700 leading-relaxed">
      In the insurance industry, the claims process involves handling a vast number of multi-page documents, 
      which are often scanned images. These documents need to be classified correctly to ensure they are processed efficiently. 
      Manual classification is time-consuming, error-prone, and can lead to delays in claims processing. 
      Automating this process with AI could significantly enhance operational efficiency and reduce errors.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
      The current manual classification of multi-page insurance claims documents is inefficient and prone to errors. 
      This PoC aims to solve this problem by developing an automated classification system using a combination of OCR and ML models/GenAI.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
      Solving this problem will result in reduced processing times, lower operational costs, and improved customer satisfaction 
      due to faster claims handling. Additionally, it will allow human resources to focus on more complex tasks that require critical thinking.
      </p>
    </>
  );

  const videoContentPanel = {
    videoTitle: "Claims Classification & Information Extraction",
    uri: `https://vmivsp.sharepoint.com/sites/VM.ALL.EmergingTechnologies/_layouts/15/embed.aspx?UniqueId=6d894222-e4ce-4339-b3d7-118adf46b719&embed=%7B%22af%22%3Atrue%2C%22hvm%22%3Atrue%2C%22ust%22%3Atrue%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create`,
    uri2: `https://vmivsp.sharepoint.com/sites/VM.ALL.EmergingTechnologies/_layouts/15/embed.aspx?UniqueId=8fcb2bf6-15eb-44e3-b89f-bfcf54f2b982&embed=%7B%22af%22%3Atrue%2C%22hvm%22%3Atrue%2C%22ust%22%3Atrue%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create`,
    videoTitle2: "Claims Classification & Information Extraction - V2",
  }
  // Content for the Developer Setup panel
  const setupPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Developer Setup</h3>
      <p className="text-gray-700 leading-relaxed">To set up and run this PoC locally, follow these steps:</p>
      <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
        <li>Ensure you have Python 3.9+ and Quart installed on your system.</li>
        <li>
          Clone the repository containing the PoC code. Navigate to the 'app' folder and install the dependencies:
          <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
            <code>pip install -r requirements.txt</code>
          </pre>
        </li>
        <li>
          Ensure the Quart service is running on <code>localhost:11001</code> by executing:
          <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
            <code>python main.py</code>
          </pre>
        </li>
        <li>Upload documents via the PoC front end for classification.</li>
      </ol>
      <h3 className="text-xl font-semibold mt-6 mb-4">How to Use This PoC</h3>
      <p className="text-gray-700 leading-relaxed">Follow these steps to use the PoC:</p>
      <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
        <li>Click the &quot;Upload&quot; button and select a document (.tif, .pdf).</li>
        <li>Disable summarizer if not needed.</li>
        <li>Wait for the Quart service to process upto 4 files in parallel.</li>
        <li>The table will be populated with a view action as the response is received from Quart event stream.</li>
        <li>Click view button for more details extracted from the document.</li>
      </ol>
    </>
  );

  // Demo content for the Claims Classification
  const demoContent = (
    <div className="claims-class-container">
      <div className="solution-controls">
        {/* Version toggle before the upload button */}
        {/* <div className="version-toggle">
          <Tooltip 
            content="Rule-based extraction with limited summarization capabilities"
            position="bottom"
          >
            <span className={`toggle-label ${!isV2 ? "font-bold text-primary" : ""}`}>V1</span>
          </Tooltip>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isV2}
              onChange={(e) => setIsV2(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>

          <Tooltip 
            content="Enhanced LLM-based extraction with full summarization capabilities"
            position="bottom"
          >
            <span className={`toggle-label ${isV2 ? "font-bold text-primary" : ""}`}>V2</span>
          </Tooltip>
        </div> */}

        <div>
        <div className="upload-section">
          <input
            type="file"
            accept=".pdf,.tif"
            multiple
            onChange={handleFileUpload}
            id="file-input"
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" className="upload-button">
            <FaUpload /> Upload Document
          </label>

          {/* <button
            className={`summarizer-button ${summarizer ? 'active' : ''}`}
            onClick={toggleSummarizer}
          >
            <FaMagic /> {summarizer ? "Summarizer Enabled" : "Enable Summarizer"}
          </button> */}
        </div>
        </div>
      </div>

      <div className="table-container">
        {/* Table Header */}
        <div className="table-header">
          <div className="table-row">
            <div className="header-cell">File Name</div>
            <div className="header-cell">Claim Number</div>
            <div className="header-cell">Document Type</div>
            <div className="header-cell">Claim GW Validated</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="table-body">
          {filesStatus.length === 0 ? (
            <div className="no-files-yet">
              <div className="no-files-icon">
                <FaFileInvoice />
              </div>
              <p>No documents uploaded yet</p>
              <label htmlFor="file-input" className="upload-button">
                <FaUpload /> Upload Document
              </label>
            </div>
          ) : (
            filesStatus.map((fileStatus) => (
              <div key={fileStatus.fileId} className="table-row-card">
                {/* Main Row */}
                <div className="table-row">
                  <div className="table-cell">
                    <div className="flex flex-col items-start text-left min-w-[180px]">
                      <span className="font-medium mb-1">{fileStatus.fileName}</span>
                      <span className="text-sm text-gray-500">
                        {fileStatus.pageCount || 'Unknown'}{' '}
                        {fileStatus.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                    </div>
                  </div>
                  <div className="table-cell">
                    {fileStatus.result?.claim_number ? (
                      <span className="claim-number-badge">{fileStatus.result.claim_number}</span>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </div>
                  <div className="table-cell">
                    {fileStatus.result?.document_type ? (
                      <span className="document-type-cell">
                        {fileStatus.result.document_type.toLocaleUpperCase().replaceAll('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </div>
                  <div className="table-cell">
                    {fileStatus.result?.gw_details ? (
                      Object.keys(fileStatus.result.gw_details).length === 0 ? (
                        <span className="badge error"><FaTimes /> No</span>
                      ) : (
                        <span className="badge success"><FaCheck /> Yes</span>
                      )
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </div>
                  <div className="table-cell progress-container">
                    {fileStatus.result ? (
                      <span className="badge success">
                        <FaCheck /> Processed
                      </span>
                    ) : fileStatus.error ? (
                      <span className="badge error">
                        <FaExclamationTriangle /> Error
                      </span>
                    ) : (
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${fileStatus.progress}%` }}
                        ></div>
                        <div className="progress-text">
                          <span>{fileStatus.progress?.toFixed(0) || 0}%</span>
                        </div>
                      </div>
                    )}
                    {(fileStatus.message || fileStatus.progress === 0) && !fileStatus.result && !fileStatus.error && (
                      <span className="progress-message">
                        {fileStatus.message || 'Added to queue'}
                      </span>
                    )}
                  </div>
                  <div className="table-cell">
                    <div className="flex gap-2">
                      {fileStatus.result && (
                        <button
                          className="details-button"
                          onClick={() => openModal(fileStatus)}
                            aria-label="View details"
                        >
                          <FaEye /> View
                        </button>
                      )}
                      {(session?.user?.role === "ADMINISTRATOR" || session?.user?.role === "DEVELOPER") && (
                        <button
                          className="details-button"
                          onClick={() => showDeleteConfirmation(fileStatus.fileId, fileStatus.fileName)}
                          style={{ backgroundColor: '#dc3545', color: 'white' }}
                          aria-label="Delete file"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Content */}
                {fileStatus.result && fileStatus.pageCount && fileStatus.pageCount > 1 && expandedRows[fileStatus.fileId] && (
                  <div className="nested-card">
                    {Array.from({ length: fileStatus.result.document_types?.length || 0 }, (_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <div key={pageNumber} className="page-row">
                          <div className="page-info">
                            <FaFileAlt className="text-primary" />
                            <span>
                              Document {pageNumber}
                              {fileStatus.result?.page_numbers?.[index] ? 
                                `, Pages ${(fileStatus.result.page_numbers[index][0] ?? 0) + 1} - ${(fileStatus.result.page_numbers[index].at(-1) ?? 0) + 1}` 
                                : ''}
                            </span>
                          </div>
                          <div className="document-type-cell">
                            {fileStatus.result?.document_types?.[index]?.toLocaleUpperCase().replaceAll('_', ' ') ||
                              'Unknown'}
                          </div>
                          <button
                            className="view-page-button"
                            onClick={() => openModal(fileStatus, pageNumber)}
                          >
                            <FaEye /> View Page
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className='api-status'>
        <div className="status-icon">
          <FaCircle 
            color={apiStatus === 1 ? 'green' : apiStatus === 2 ? 'red' : 'orange'} 
            size={12} 
          />
        </div>
        <div className="status-text">
          {apiStatus === 1 ? 'API Active' : apiStatus === 2 ? 'API Inactive' : 'Checking API Status'}
        </div>
      </div>
    </div>
  );

  // State for fetched document blob URL
  const [fetchedBlobUrl, setFetchedBlobUrl] = useState<string | null>(null);
  const [isFetchingDocument, setIsFetchingDocument] = useState(false);

  // Memoize blob URLs to prevent recreation on every render
  const documentBlobUrl = useMemo(() => {
    if (!selectedFileStatus?.file) return null;
    return URL.createObjectURL(selectedFileStatus.file);
  }, [selectedFileStatus?.file]);

  // Function to fetch document and create blob URL
  const fetchDocumentBlob = useCallback(async (fileId: string) => {
    if (isFetchingDocument) return;
    
    setIsFetchingDocument(true);
    try {
      console.log('Fetching document from:', `${BACKEND_HTTP}/file/${fileId}`);
      const response = await fetch(`${BACKEND_HTTP}/file/${fileId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setFetchedBlobUrl(blobUrl);
      
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setIsFetchingDocument(false);
    }
  }, [isFetchingDocument]);

  // Clean up fetched blob URL when modal closes or file changes
  useEffect(() => {
    if (!modalOpen || !selectedFileStatus) {
      if (fetchedBlobUrl) {
        URL.revokeObjectURL(fetchedBlobUrl);
        setFetchedBlobUrl(null);
      }
    }
  }, [modalOpen, selectedFileStatus, fetchedBlobUrl]);

  // Fetch document when modal opens for existing files
  useEffect(() => {
    if (modalOpen && selectedFileStatus && !selectedFileStatus.file && !fetchedBlobUrl && !isFetchingDocument) {
      fetchDocumentBlob(selectedFileStatus.fileId);
    }
  }, [modalOpen, selectedFileStatus, fetchedBlobUrl, isFetchingDocument, fetchDocumentBlob]);

  // Cleanup blob URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (documentBlobUrl) {
        URL.revokeObjectURL(documentBlobUrl);
      }
    };
  }, [documentBlobUrl]);

  const modelContent = modalOpen && selectedFileStatus && (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-content"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <button className="close-button" onClick={closeModal} aria-label="Close">
          &times;
        </button>
        <div className="modal-grid">
          <button className="toggle-button document-button" onClick={toggleDocumentVisibility}>
            {isDocumentVisible ? <><FaEye /> Hide Doc</> : <><FaEye /> Show Doc</>}
          </button>
          <button className="toggle-button extracted-button" onClick={toggleExtractedVisibility}>
            {isExtractedVisible ? <><FaFileAlt /> Hide Text</> : <><FaFileAlt /> Show Text</>}
          </button>

          {/* Left Side: Details */}
          <div className="modal-details">
            <div className="details-row">
              <div className="detail-item">
                <div className="detail-content">
                  <div className="detail-icon"><FaFileAlt /></div>
                  <div>
                  <div className="detail-key">File Name</div>
                    <div className="detail-value">
                      {selectedFileStatus.fileName} {selectedPage ? `(Page ${selectedPage})` : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-content">
                  <div className="detail-icon"><FaHashtag /></div>
                  <div>
                  <div className="detail-key">Claim Number</div>
                    <div className="detail-value">
                      {selectedFileStatus.result?.claim_number || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-content">
                  <div className="detail-icon"><FaFileSignature /></div>
                  <div>
                  <div className="detail-key">Document Type</div>
                    <div className="detail-value">
                      {selectedPage 
                        ? selectedFileStatus.result?.document_types[selectedPage-1]?.toLocaleUpperCase().replaceAll('_', ' ') 
                        : selectedFileStatus.result?.document_type?.toLocaleUpperCase().replaceAll('_', ' ') || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {overview !== "" && (
              <div className="detail-item">
                  <div className="detail-key">
                  Overview
                  </div>
                  <div
                    className="detail-value"
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {overview}
                  </div>
              </div>
            )}

            {!selectedPage && selectedFileStatus.result?.gw_details && Object.keys(selectedFileStatus.result?.gw_details).length !== 0 && (
                  <div className="detail-item">
                        <div className="detail-key">
                  GuidWire Details
                        </div>
                        <div className="detail-value">
                          <NestedObjectDisplay data={selectedFileStatus.result?.gw_details} />
                        </div>
                      </div>
            )}
            {summary && Object.keys(summary).length !== 0 && (
              <div className="detail-item">
                  <div className="detail-key"> 
                    Document Information
                  </div>
                  <div className="detail-value">
                    <NestedObjectDisplay data={summary} />
                  </div>
                </div>
            )}
          </div>
          {/* Right Side: Document/Text Container */}
          <div className="modal-document expanded">
            <div className="document-container">
              {isDocumentVisible && (
                <div className="document-viewer" style={{ width: '100%', height: '100%' }}>
                  {selectedFileStatus.fileName.endsWith('.pdf') ? (
                    (documentBlobUrl || fetchedBlobUrl) ? (
                      <iframe
                        src={`${documentBlobUrl || fetchedBlobUrl}#page=${
                          selectedFileStatus.result?.page_numbers 
                            ? selectedFileStatus.result?.page_numbers[selectedPage-1] 
                              ? selectedFileStatus.result?.page_numbers[selectedPage-1][0] + 1 
                              : 1 
                            : selectedPage || 1
                        }&zoom=fit`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                      >
                        <p>Unable to display PDF document.</p>
                      </iframe>
                    ) : isFetchingDocument ? (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f9fa',
                        color: '#6b7280',
                        padding: '2rem',
                        textAlign: 'center'
                      }}>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p>Loading document...</p>
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f9fa',
                        color: '#6b7280',
                        padding: '2rem',
                        textAlign: 'center'
                      }}>
                        <p className="mb-4">Failed to load document for inline viewing.</p>
                        <button
                          onClick={() => {
                            const url = `${BACKEND_HTTP}/file/${selectedFileStatus.fileId}`;
                            window.open(url, '_blank');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Open PDF in New Tab
                        </button>
                      </div>
                    )
                  ) : selectedFileStatus.fileName.endsWith('tif') || selectedFileStatus.fileName.endsWith('tiff') ? (
                    selectedFileStatus.file ? (
                      <TiffViewer file={selectedFileStatus.file} />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f9fa',
                        color: '#6b7280'
                      }}>
                        <p>Unable to display TIFF. File not available.</p>
                      </div>
                    )
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f8f9fa',
                      color: '#6b7280'
                    }}>
                      <p>Unable to display document. Unsupported format.</p>
                    </div>
                  )}
                </div>
              )}
              {isExtractedVisible && (
                <div className="extracted-text-container">
                  <div className="extracted-text">
                    {selectedPage 
                      ? selectedFileStatus.result?.extracted_text.split("---PAGE BREAK---")[selectedPage-1].trim() 
                      : selectedFileStatus.result?.extracted_text}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Delete confirmation modal
  const deleteConfirmationModal = deleteModalOpen && fileToDelete && (
    <div className="modal-overlay" onClick={cancelDelete}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '400px', padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mb-4">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete File</h3>
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{fileToDelete.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={cancelDelete}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use the PocPageWrapper component with all our content
  return (
    <PocPageWrapper
      metadata={metadata}
      demoContent={demoContent}
      infoContent={detailsPanelContent}
      setupContent={setupPanelContent}
      videoContent={videoContentPanel}
      defaultActiveTab="solution"
      modalContent={<>{modelContent}{deleteConfirmationModal}</>}
      fixedContent={selectedFileStatus && (
        <ChatBubble
          messages={chatMessages}
          inputMessage={inputMessage}
          loading={isChatLoading}
          onInputChange={handleInputChange}
          onSendMessage={handleSendMessage}
          title="Adjuster Assistant"
        />
      )}
    />
  );
}