'use client';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import './styles.css';
import WorkflowGraph from './components/WorkflowGraph';
import FileUploader from './components/FileUploader';
import StatusPanel from './components/StatusPanel';
import CodeComparisonView from './components/CodeComparisonView';
import HumanReviewPanel from './components/HumanReviewPanel';
import DataModal from './components/DataModal';
import JobHistory from './components/JobHistory';
import MigrationApiClient, { MigrationState, MigrationOptions } from './components/MigrationApiClient';
import { formatInTimeZone } from 'date-fns-tz';
import PromptTemplateEditorFlatList from './components/PromptTemplateEditorFlatList';
import metadata from './metadata.json';
import PocPageWrapper from 'components/PocPageWrapper';
import ChatBubble from 'components/ChatBubble';

// Define types for migration state
interface AppMigrationState {
  status: string;
  current_phase: string;
  files: any[];
  analysis_result: Record<string, any>;
  detailed_analysis?: Record<string, any>;
  generated_files: any[];
  refactored_files: any[];
  embedding_ready: boolean;
  errors: any[];
  progress?: number;
  migration_plan: any[];
}

// Define the checkpoint interface
interface Checkpoint {
  checkpoint_id: string;
  checkpoint_ns: string;
  timestamp: string;
}

// Update the HumanReviewPanel interface with the correct types
interface HumanReviewPanelProps {
  reviewType: string;
  onSubmitFeedback: (decision: 'approved' | 'refine' | 'reject' | 'cancel', feedback?: string) => void;
  state: any;
}

// Define end phase options
type EndPhase = 'embed' | 'analyze' | 'document' | 'plan' | 'execute' | 'refactor' | 'test' | 'finalize';

// Import Message type from ChatBox component
import { Message } from 'components/ChatBox';

export default function CodeMigrationAgent() {
  const router = useRouter();
  const apiClient = useRef(new MigrationApiClient());
  const eventSource = useRef<EventSource | null>(null);
  const [jobId, setJobId] = useState<string>('');
  const [showDataModal, setShowDataModal] = useState<string>('');
  const [migrationState, setMigrationState] = useState<AppMigrationState>({
    status: 'idle',
    current_phase: '',
    files: [],
    analysis_result: {},
    generated_files: [],
    refactored_files: [],
    embedding_ready: false,
    errors: [],
    progress: 0,
    migration_plan: []
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showHumanReview, setShowHumanReview] = useState(false);
  const [reviewType, setReviewType] = useState('');
  const [activeTab, setActiveTab] = useState('workflow');
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStatePanel, setShowStatePanel] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  
  // Create a ref to store prompt templates
  const [promptTemplates, setPromptTemplates] = useState<Record<string, string>>({});
  // Create state for documentation format
  const [docFormat, setDocFormat] = useState<'md' | 'doxy'>('md');
  // Create state for end phase
  const [endPhase, setEndPhase] = useState<EndPhase>('finalize');

  // Add chat state
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatStream, setChatStream] = useState<ReadableStream | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Function to update the prompt templates ref
  const updatePromptTemplate = async (templateName: string, promptText: string) => {
    setPromptTemplates(prev => ({
      ...prev,
      [templateName]: promptText
    }));
    console.log(`Updated template "${templateName}" in memory`);
  };

  // Function to update the documentation format
  const updateDocFormat = (format: 'md' | 'doxy') => {
    setDocFormat(format);
    console.log(`Documentation format set to: ${format}`);
  };

  // Function to update the end phase
  const updateEndPhase = (phase: EndPhase) => {
    setEndPhase(phase);
    console.log(`End phase set to: ${phase}`);
  };
  
  // Set to light mode on unmount
  useEffect(() => {
    return () => {
      setIsDarkMode(false);
      document.body.classList.remove('dark-mode-ams');
      document.body.classList.remove('light-mode');
    };
  }, []);

  // Update parent container when collapsed state changes
  useEffect(() => {
    const container = document.querySelector('.ams-migration-content');
    if (container) {
      if (isCollapsed) {
        container.classList.add('file-uploader-collapsed');
      } else {
        container.classList.remove('file-uploader-collapsed');
      }
    }
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Initialize dark mode from user preferences or localStorage
  useEffect(() => {
    // Check if user has dark mode preference
    const savedMode = localStorage.getItem('ams-migration-dark-mode-ams');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedMode !== null) {
      setIsDarkMode(savedMode === 'true');
    } else if (prefersDark) {
      setIsDarkMode(true);
    }
  }, []);

  // Apply dark mode class when the state changes
  useEffect(() => {
    document.body.classList.toggle('dark-mode-ams', isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
    localStorage.setItem('ams-migration-dark-mode-ams', String(isDarkMode));
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSource.current) {
        eventSource.current.close();
      }
    };
  }, []);

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
  };

  const handleLanguageSelect = (source: string, target: string) => {
    setSourceLanguage(source);
    setTargetLanguage(target);
  };

  const startMigration = async () => {
    if (!selectedFile || !sourceLanguage || !targetLanguage) {
      alert('Please select a file and specify source and target languages.');
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // Start the migration with API
      const options: MigrationOptions = {
        preserveComments: true,
        generateTests: true
      };
      
      const result = await apiClient.current.startMigration(
        selectedFile,
        sourceLanguage,
        targetLanguage,
        options,
        docFormat,                // Pass the documentation format
        promptTemplates,  // Pass all prompt templates
        endPhase                  // Pass the end phase
      );
      
      console.log(result);
      setJobId(result.job.job_id);
      setMigrationState(prev => ({
        ...prev,
        status: result.job.status
      }));
      // Subscribe to real-time updates
      subscribeToJobEvents(result.job.job_id);
      
    } catch (error: any) {
      console.error('Failed to start migration:', error);
      setIsProcessing(false);
      setErrorMessage(`Failed to start migration: ${error.message}`);
      setMigrationState(prev => ({
        ...prev,
        errors: [...prev.errors, error.message]
      }));
    }
  };

  const subscribeToJobEvents = (jobId: string) => {
    if (eventSource.current) {
      eventSource.current.close();
    }
    
    eventSource.current = apiClient.current.subscribeToEvents(
      jobId,
      // Update callback
      (data: MigrationState) => {
        console.log('Update event received:', data);
        setMigrationState(prev => ({
          ...prev,
          status: data.status,
          current_phase: data.current_phase,
          files: data.files || prev.files,
          analysis_result: data.analysis_result || prev.analysis_result,
          detailed_analysis: typeof data.detailed_analysis === 'object' ? data.detailed_analysis : prev.detailed_analysis,
          generated_files: data.generated_files || prev.generated_files,
          refactored_files: data.refactored_files || prev.refactored_files,
          embedding_ready: data.embedding_ready || prev.embedding_ready,
          errors: data.errors || prev.errors,
          migration_plan: data.migration_plan || prev.migration_plan,
          progress: calculateProgress(data.current_phase)
        }));
        
        if (data.status === 'completed' || data.status === 'failed') {
          setIsProcessing(false);
          setMigrationState(prev => ({
            ...prev,
            status: 'completed',
            progress: 100
          }));
        }
      },
      // Message callback
      (data: any) => {
        console.log('Migration message:', data);
      },
      // Human review callback
      (data: any) => {
        console.log('Human review requested:', data);
        setShowHumanReview(true);
        setReviewType(data.current_phase);
      },
      // Completed callback
      (data: any) => {
        console.log('Migration completed:', data);
        setIsProcessing(false);
        setMigrationState(prev => ({
          ...prev,
          status: 'completed',
          progress: 100
        }));
      },
      // Error callback
      (error: any) => {
        console.error('Event stream error:', error);
        setErrorMessage(`Event stream error: ${error.message || 'Connection lost'}`);
        setMigrationState(prev => ({
          ...prev,
          errors: [...prev.errors, 'Event stream error']
        }));
      }
    );
  };

  const calculateProgress = (currentPhase: string): number => {
    // Map phases to progress percentages
    const phaseToProgress: Record<string, number> = {
      'embed': 5,
      'initialize': 10,
      'analyze': 20,
      'document': 30,
      'human_review_analysis': 35,
      'plan': 45,
      'human_review_plan': 50,
      'execute': 60,
      'refactor': 70,
      'human_review_implementation': 80,
      'test': 85,
      'integrate': 90,
      'finalize': 95
    };

    return phaseToProgress[currentPhase] || 0;
  };

  const handleHumanFeedback = async (decision: 'approved' | 'refine' | 'reject' | 'cancel', feedback = '') => {
    setShowHumanReview(false);
    
    // If canceled, just close the review panel without submitting
    if (decision === 'cancel') {
      return;
    }
    
    try {
      await apiClient.current.submitFeedback(
        jobId,
        decision as 'approved' | 'refine' | 'reject', // Type assertion to satisfy the API
        feedback
      );
      
      // Refresh status after feedback
      const updatedStatus = await apiClient.current.getMigrationStatus(jobId);
      setMigrationState(prev => ({
        ...prev,
        status: updatedStatus.status,
        current_phase: updatedStatus.current_phase,
        progress: calculateProgress(updatedStatus.current_phase)
      }));
      
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      setErrorMessage(`Failed to submit feedback: ${error.message}`);
      setMigrationState(prev => ({
        ...prev,
        errors: [...prev.errors, 'Failed to submit feedback: ' + error.message]
      }));
    }
  };

  const pauseJob = async () => {
    if (!jobId) return;
    
    try {
      await apiClient.current.pauseJob(jobId);
      
      // Refresh status
      const updatedStatus = await apiClient.current.getMigrationStatus(jobId);
      setMigrationState(prev => ({
        ...prev,
        status: updatedStatus.status,
        current_phase: updatedStatus.current_phase
      }));
      
      // Close event source when paused
      if (eventSource.current) {
        eventSource.current.close();
      }
      
    } catch (error: any) {
      console.error('Failed to pause job:', error);
      setErrorMessage(`Failed to pause job: ${error.message}`);
      setMigrationState(prev => ({
        ...prev,
        errors: [...prev.errors, 'Failed to pause job: ' + error.message]
      }));
    }
  };

  const resumeJob = async (checkpointId: string | null = null) => {
    if (!jobId) return;
    
    try {
      await apiClient.current.resumeJob(
        jobId, 
        checkpointId || undefined,
        docFormat,                // Pass the documentation format
        promptTemplates, // Pass all prompt templates
        endPhase                  // Pass the end phase
      );
      
      // Refresh status
      const updatedStatus = await apiClient.current.getMigrationStatus(jobId);
      setMigrationState(prev => ({
        ...prev,
        status: updatedStatus.status,
        current_phase: updatedStatus.current_phase
      }));
      
      // Reset error message
      setErrorMessage(null);
      
      // Set processing state
      setIsProcessing(true);
      
      // Resubscribe to events
      subscribeToJobEvents(jobId);
      
    } catch (error: any) {
      console.error('Failed to resume job:', error);
      setErrorMessage(`Failed to resume job: ${error.message}`);
      setMigrationState(prev => ({
        ...prev,
        errors: [...prev.errors, 'Failed to resume job: ' + error.message]
      }));
    }
  };

  const terminateJob = async () => {
    if (!jobId) return;
    
    try {
      await apiClient.current.terminateJob(jobId);
      
      // Refresh status
      const updatedStatus = await apiClient.current.getMigrationStatus(jobId);
      setMigrationState(prev => ({
        ...prev,
        status: updatedStatus.status,
        current_phase: updatedStatus.current_phase
      }));
      
      setIsProcessing(false);
      
      // Close event source
      if (eventSource.current) {
        eventSource.current.close();
      }
      
    } catch (error: any) {
      console.error('Failed to terminate job:', error);
      setErrorMessage(`Failed to terminate job: ${error.message}`);
      setMigrationState(prev => ({
        ...prev,
        errors: [...prev.errors, 'Failed to terminate job: ' + error.message]
      }));
    }
  };

  const downloadResults = async () => {
    if (!jobId) return;
    
    try {
      const blob = await apiClient.current.downloadGeneratedFiles(jobId);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `migration-${jobId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      console.error('Failed to download results:', error);
      setErrorMessage(`Failed to download results: ${error.message}`);
      setMigrationState(prev => ({
        ...prev,
        errors: [...prev.errors, 'Failed to download results: ' + error.message]
      }));
    }
  };

  const loadExistingJob = async (selectedJobId: string) => {
    if (!selectedJobId) return;

    if (selectedJobId == 'new') {
      setJobId('');
      setMigrationState({
        status: 'idle',
        current_phase: '',
        files: [],
        analysis_result: {},
        generated_files: [],
        refactored_files: [],
        embedding_ready: false,
        errors: [],
        progress: 0,
        migration_plan: []
      });
      setSourceLanguage('');
      setTargetLanguage('');
      setCheckpoints([]);
      setSelectedFile(null);
      setIsProcessing(false);
      setShowHumanReview(false);
      setReviewType('');
      setErrorMessage(null);
      return;
    }
    
    setJobId(selectedJobId);
    setErrorMessage(null);
    setIsProcessing(true); // Set processing state to show loading indicators
    
    try {
      // Get job details
      const jobDetails = await apiClient.current.getJobDetails(selectedJobId);
      if (jobDetails.job?.last_phase) setEndPhase(jobDetails.job?.last_phase)
      // Get job status
      const jobStatus = await apiClient.current.getMigrationStatus(selectedJobId);
      // Set state based on job information
      setMigrationState(prev => ({
        ...prev,
        status: jobStatus.status,
        current_phase: jobStatus.current_phase,
        files: jobDetails.job?.state?.files || prev.files,
        analysis_result: jobDetails.job?.state?.analysis_result || prev.analysis_result,
        detailed_analysis: jobDetails.job?.state?.detailed_analysis,
        generated_files: jobDetails.job?.state?.generated_files || prev.generated_files,
        refactored_files: jobDetails.job?.state?.refactored_files || prev.refactored_files,
        embedding_ready: jobDetails.job?.state?.embedding_ready || prev.embedding_ready,
        migration_plan: jobDetails.job?.state?.migration_plan || prev.migration_plan,
        errors: jobDetails.job?.errors || prev.errors,
        progress: calculateProgress(jobStatus.current_phase)
      }));
      
      // Set source and target language if available
      if (jobDetails.job?.source_lang) {
        setSourceLanguage(jobDetails.job?.source_lang);
      }
      
      if (jobDetails.job?.target_lang) {
        setTargetLanguage(jobDetails.job?.target_lang);
      }
      
      // If the job is in human review state, show the appropriate review panel
      if (jobDetails.job?.current_phase.startsWith('human_review_')) {
        setShowHumanReview(true);
        setReviewType(jobDetails.job?.current_phase);
      } else {
        setShowHumanReview(false);
      }
      
      // Subscribe to events if job is still running
      if (jobStatus.status === 'processing' || jobStatus.status === 'initializing') {
        subscribeToJobEvents(selectedJobId);
      } else {
        setIsProcessing(false);
      }
      
      // Show job details in the UI
      console.log(`Loaded job ${selectedJobId} with status ${jobStatus.status}`);
      
      // Switch to workflow view
      setActiveTab('workflow');
      
    } catch (error: any) {
      console.error('Failed to load job:', error);
      setErrorMessage(`Failed to load job: ${error.message}`);
      setMigrationState(prev => ({
        ...prev,
        errors: [...prev.errors, 'Failed to load job: ' + error.message]
      }));
      setIsProcessing(false);
    }
  };

  const handleInputChange = (message: string) => {
    setInputMessage(message);
  };

  const handleSendMessage = async (messages: Message[]) => {
    if (!jobId || !inputMessage.trim()) return;

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
      
      // Make API call
      const response = await fetch(`https://www.valuemomentum.studio/sdlc/api/job/${jobId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let currentMessage: Message = {
        role: 'assistant',
        content: '',
        sender: 'Assistant'
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = JSON.parse(line.slice(5));

          switch (data.type) {
            case 'start':
              // Reset current message
              currentMessage = {
                role: 'assistant',
                content: '',
                sender: 'Assistant'
              };
              break;

            case 'response_chunk':
              // Append to current message
              currentMessage.content += data.content;
              setChatMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === 'assistant') {
                  newMessages[newMessages.length - 1] = currentMessage;
                } else {
                  newMessages.push({...currentMessage});
                }
                return newMessages;
              });
              break;

            case 'tool_call':
              // Add tool message and start a new assistant message
              setChatMessages(prev => [...prev, {
                role: 'tool',
                content: data.content,
                sender: 'Tool'
              }]);
              // Reset current message after tool call
              currentMessage = {
                role: 'assistant',
                content: '',
                sender: 'Assistant'
              };
              break;

            case 'error':
              setErrorMessage(data.content);
              break;

            case 'end':
              // Ensure final message is added if not empty
              if (currentMessage.content) {
                setChatMessages(prev => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage?.role === 'assistant' && lastMessage.content === currentMessage.content) {
                    return prev;
                  }
                  return [...prev, {...currentMessage}];
                });
              }
              break;
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', error);
        setErrorMessage(`Chat error: ${error.message}`);
      }
    } finally {
      setIsChatLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Business Context</h3>
      <p className="text-gray-700 leading-relaxed">
        Organizations frequently face the challenge of migrating legacy codebases to modern languages and frameworks.
        This process is typically manual, error-prone, and requires significant expertise in both source and target technologies.
        Our AI-Driven SDLC System  automates this process using a series of specialized LLM agents that analyze, plan, and execute
        the migration while keeping humans in the loop for critical decision points.
      </p>
      
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
        Manual code migration is time-consuming, error-prone, and expensive, often requiring specialized knowledge in both 
        legacy and modern systems. Many organizations struggle with modernizing their critical applications due to the 
        complexity and risk involved. This PoC demonstrates how AI-assisted code migration can accelerate the process
        while maintaining quality and reducing risk.
      </p>
      
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
        Our AI-Driven SDLC System  can reduce migration time by up to 70%, drastically cut costs, and improve the quality
        of migrated code through consistent patterns and best practices. It enables organizations to modernize faster,
        reduce technical debt, and improve maintenance and scalability of critical applications.
      </p>
    </>
  );

  const setupPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Developer Setup</h3>
      <p className="text-gray-700 leading-relaxed">To set up and run this PoC locally, follow these steps:</p>
      
      <h4 className="text-lg font-semibold mt-4 mb-2">1. Backend Setup</h4>
      <ol className="list-decimal ml-4 text-gray-700 leading-relaxed">
        <li>Clone the agent repository and install dependencies:</li>
        <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
          <code>
            git clone ...
           </code>
        </pre>
        <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
           <code>
            cd ET-AI-AMS-Automation
            </code>
        </pre>
        <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
           <code>
            pip install -r src_v2/requirements.txt
          </code>
        </pre>
        
        <li>Start the Quart server:</li>
        <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
          <code>
            python src_v2/app.py
          </code>
        </pre>
      </ol>
      
      {/* <h4 className="text-lg font-semibold mt-4 mb-2">2. API Documentation</h4>
      <p>The API provides the following endpoints:</p>
      <ul className="list-disc ml-4 text-gray-700 leading-relaxed">
        <li><strong>POST /api/migration/jobs</strong>: Start a migration job with a zip file upload</li>
        <li><strong>GET /api/migration/jobs/{'{job_id}'}/status</strong>: Get current status of migration job</li>
        <li><strong>GET /api/migration/jobs/{'{job_id}'}/events</strong>: Server-sent events stream for real-time updates</li>
        <li><strong>POST /api/migration/jobs/{'{job_id}'}/feedback</strong>: Provide human feedback on an in-progress migration</li>
        <li><strong>GET /api/migration/jobs/{'{job_id}'}/files</strong>: Get list of generated files</li>
        <li><strong>GET /api/migration/jobs/{'{job_id}'}/download</strong>: Download all generated files as a ZIP archive</li>
        <li><strong>POST /api/migration/jobs/{'{job_id}'}/pause</strong>: Pause a running job</li>
        <li><strong>POST /api/migration/jobs/{'{job_id}'}/resume</strong>: Resume a paused job</li>
        <li><strong>GET /api/migration/jobs/{'{job_id}'}/checkpoints</strong>: Get job checkpoints for resuming</li>
      </ul> */}
      
      <h4 className="text-lg font-semibold mt-4 mb-2">3. Event Stream Format</h4>
      <p>The event stream sends JSON objects with the following structure:</p>
      <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2 text-wrap">
        <code>{`{
  "event": "update",
  "data": {
    "status": "processing",
    "current_phase": "analyze",
    "files": ["src/main.py", "src/utils.py"],
    "embedding_ready": true,
    "source_info": { ... },
    "analysis_result": { ... },
    // Additional state information
  }
}`}</code>
      </pre>
    </>
  );

  const promptEditorContent = (
    <PromptTemplateEditorFlatList 
      onSave={async (templateName, promptText) => {
        console.log(`Saved template "${templateName}" with ${promptText.length} characters`);
        await updatePromptTemplate(templateName, promptText);
      }}
      onError={(error) => {
        setErrorMessage(`Prompt template error: ${error.message}`);
      }}
      onDocFormatChange={(format: 'md' | 'doxy') => {
        updateDocFormat(format);
      }}
      onEndPhaseChange={(phase: EndPhase) => {
        updateEndPhase(phase);
      }}
      currentDocFormat={docFormat}
      currentEndPhase={endPhase}
    />
  );

  // Create error message display
  const errorDisplay = errorMessage && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 relative">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{errorMessage}</span>
      <button 
        className="absolute top-0 bottom-0 right-0 px-4 py-3"
        onClick={() => setErrorMessage(null)}
      >
        &times;
      </button>
    </div>
  );

  console.log('Migration state:', migrationState.status);
  console.log('isProcessing:', isProcessing);
  // Create job control buttons
  const jobControlButtons = (
    <>
      {(isProcessing && migrationState.status !== 'paused') && (
        <div className="flex space-x-2 mt-4">
          <button 
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            onClick={pauseJob}
          >
            Pause
          </button>
          <button 
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={terminateJob}
          >
            Terminate
          </button>
        </div>
      )} 
      {(migrationState.status === 'paused' || migrationState.status === 'failed') && (
          <button 
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4"
            onClick={() => resumeJob()}
          >
            Resume
          </button>
        )
      }
      
      {(migrationState.status === 'completed' || migrationState.status === 'terminated') && (
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
          onClick={downloadResults}
        >
          Download Results
        </button>
      )}
      
    </>
  );

  // Fetch checkpoints when job is paused
  useEffect(() => {
    if (jobId && migrationState.status) {
      const fetchCheckpoints = async () => {
        try {
          const result: {checkpoints: any[]} = await apiClient.current.getJobCheckpoints(jobId);
          setCheckpoints(result.checkpoints);
        } catch (error) {
          console.error('Failed to fetch checkpoints:', error);
        }
      };
      
      fetchCheckpoints();
    }
  }, [jobId, migrationState.status]);
  
  const formatLocalTime = (dateString: string, formatStr: string = 'PPp') => {
    const date = new Date(dateString + 'Z'); // Append 'Z' to treat it as UTC
    // Get the browser's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return formatInTimeZone(date, timezone, formatStr);
  };

  const checkpointsUI = checkpoints?.length > 0 && (
    <div className="mt-4">
      <h4 className="text-lg font-semibold">Resume from Checkpoint</h4>
      <div className="mt-2 space-y-2 overflow-y-auto max-h-60">
        {checkpoints.map(checkpoint => (
          checkpoint.checkpoint_ns && (
          <button
            key={checkpoint.checkpoint_ns}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 block w-full text-left"
            onClick={() => resumeJob(checkpoint.checkpoint_id)}
          >
            {checkpoint.checkpoint_ns} - {formatLocalTime(checkpoint.timestamp)}
          </button>
          )
        ))}
      </div>
    </div>
  );

  const demoContent = (
    <div className={`ams-migration-container ${isDarkMode ? 'dark-mode-ams' : 'light-mode'}`}>
      <div className="ams-migration-header">
        {/* Dark mode toggle */}
        <button 
          className="theme-toggle" 
          onClick={toggleDarkMode}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="theme-toggle-icon">{isDarkMode ? "☀️" : "🌙"}</span>
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="ams-migration-tabs">
        <button 
          className={`tab-button ${activeTab === 'workflow' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          Workflow View
        </button>
        <button 
          className={`tab-button ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          Code Comparison
        </button>
      </div>

      {/* Job History Section */}
      <JobHistory 
        onSelectJob={loadExistingJob}
        currentJobId={jobId}
      />

      <div className="ams-migration-content">
        {/* File Upload and Migration Controls */}
        <div className={`ams-migration-controls ${isCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="collapse-toggle" 
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand file uploader" : "Collapse file uploader"}
            title={isCollapsed ? "Expand file uploader" : "Collapse file uploader"}
          >
            {isCollapsed ? '→' : '←'}
          </button>
          {!isCollapsed && (
            <>
              <FileUploader 
                onFileSelected={handleFileUpload} 
                onLanguageSelect={handleLanguageSelect}
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onStartMigration={startMigration}
                isProcessing={isProcessing}
              />
              
              {errorDisplay}
              
              {jobControlButtons}
              
              {checkpointsUI}
            </>
          )}
        </div>

        {/* Main Content Based on Tab */}
        <div className="ams-migration-main">
          {activeTab === 'workflow' ? (
            <div className="workflow-view">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Migration Workflow</h3>
                <div className="flex space-x-4">
                { Object.keys(migrationState.analysis_result).length > 0 && (
                  <button
                    className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium"
                    onClick={() => setShowDataModal('analysis')}
                  >
                    View Analysis
                  </button>
                )}
                { Object.keys(migrationState.migration_plan).length > 0 && (
                  <button
                    className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm font-medium"
                    onClick={() => setActiveTab('code')}
                  >
                    View Documentation
                  </button>
                )}
                { Object.keys(migrationState.migration_plan).length > 0 && (
                  <button
                    className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-sm font-medium"
                    onClick={() => setShowDataModal('plan')}
                  >
                    View Migration Plan
                  </button>
                )}
                <button
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium"
                  onClick={() => setShowStatePanel(!showStatePanel)}
                >
                  {showStatePanel ? 'Hide Current State' : 'Show Current State'}
                </button>
                </div>
              </div>
              
              {showStatePanel && (
                <div className="state-panel mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold mb-2">Current State</h4>
                  <div className="state-content max-h-60 overflow-y-auto text-sm">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(migrationState, null, 2)}</pre>
                  </div>
                </div>
              )}
              
              <WorkflowGraph currentPhase={migrationState.current_phase} endPhase={endPhase} />
              <StatusPanel 
                state={{
                  ...migrationState,
                  progress: migrationState.progress || 0
                }} 
              />
            </div>
          ) : (
            <CodeComparisonView 
              sourceFiles={migrationState.files} 
              generatedFiles={migrationState.generated_files || []} 
              refactoredFiles={migrationState.refactored_files || []}
              sourceInfo={migrationState.analysis_result}
              jobId={jobId}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <PocPageWrapper
      metadata={metadata}
      demoContent={demoContent}
      infoContent={detailsPanelContent}
      setupContent={setupPanelContent}
      dataContent={promptEditorContent}
      fixedContent={jobId && (
        <ChatBubble
          messages={chatMessages.filter(msg => msg.content.trim() !== '' && msg.content.length > 1)}
          inputMessage={inputMessage}
          loading={isChatLoading}
          onInputChange={handleInputChange}
          onSendMessage={handleSendMessage}
          title="Codebase Assistant"
        />
      )}
      modalContent={showDataModal ? (
        <DataModal
          modalType={showDataModal}
          data={showDataModal === 'analysis' ? migrationState.analysis_result : 
               showDataModal === 'plan' ? migrationState.migration_plan : null}
          onClose={() => setShowDataModal('')}
          defaultView={showDataModal === 'plan' ? 'migration-plan' : 'formatted'}
        />
      ) : showHumanReview ? (
        <HumanReviewPanel
          reviewType={reviewType}
          onSubmitFeedback={handleHumanFeedback}
          state={migrationState}
        />
      ) : null}
    />
  )
  
}