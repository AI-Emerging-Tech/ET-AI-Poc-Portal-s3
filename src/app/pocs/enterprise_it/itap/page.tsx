'use client';

import { useState, useEffect } from 'react';
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface AreaPath {
  id: string;
  name: string;
  path: string;
  identifier?: string;
  structureType?: number;
  hasChildren?: boolean;
}

interface IterationPath {
  id: string;
  name: string;
  path: string;
  identifier?: string;
  structureType?: number;
  hasChildren?: boolean;
}

interface UserStory {
  id: string;
  title: string;
  description: string;
  state: string;
  acceptanceCriteria?: string;
  attachments?: Array<{
    fileName: string;
    attachmentUrl?: string;
    contentBase64?: string;
  }>;
}

interface WorkItemRelation {
  rel: string;
  url: string;
  attributes?: Record<string, any>;
}

interface BugReportForm {
  projectName: string;
  title: string;
  description: string;
  reproduceSteps: string;
  priority: number;
  assignedTo: string;
  areaPath: string;
  iterationPath: string;
  userStoryId: number;
  snapshot?: File;
}

interface ScriptExecutionResponse {
  execution_id: string;
  user_story_id: string;
  overall_status: 'passed' | 'failed' | 'pending';
  total_duration: number;
  passed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  step_results: Array<{
    step_name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error_message: string | null;
    screenshot_path: string | null;
    logs: string[];
  }>;
  execution_logs: string[];
  error_details: string | null;
  artifacts: Record<string, any>;
}

interface ScriptExecutionAnalysis {
  is_bug_found: boolean;
  bug_type: string;
  bug_location: string;
  bug_description: string;
}


interface BrowserConfig {
  headless: boolean;
  viewport?: {
    width: number;
    height: number;
  };
}

interface TestCaseForm {
  projectName: string;
  parentUserStoryId: number;
  areaPath: string;
  iterationPath: string;
  testCaseTitle: string;
  testCaseDescription: string;
}

export default function AzureDevOpsIntegration() {
  // State management
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [areaPaths, setAreaPaths] = useState<AreaPath[]>([]);
  const [iterationPaths, setIterationPaths] = useState<IterationPath[]>([]);
  const [selectedAreaPath, setSelectedAreaPath] = useState<string>('');
  const [selectedIterationPath, setSelectedIterationPath] = useState<string>('');
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [selectedUserStory, setSelectedUserStory] = useState<UserStory | null>(null);
  const [workItemRelations, setWorkItemRelations] = useState<WorkItemRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showUserStoryPopup, setShowUserStoryPopup] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [playwrightScript, setPlaywrightScript] = useState<string>('');
  const [generatingScript, setGeneratingScript] = useState<boolean>(false);
  const [scriptStatus, setScriptStatus] = useState<string>('');
  const [streamProgress, setStreamProgress] = useState<number>(0);
  const [streamStatus, setStreamStatus] = useState<string>('');
  const [executingScript, setExecutingScript] = useState(false);
  const [executionResult, setExecutionResult] = useState<ScriptExecutionResponse | null>(null);
  const [browserConfig, setBrowserConfig] = useState<BrowserConfig>({
    headless: true,
    viewport: { width: 1280, height: 720 }
  });
  const [executionTimeout, setExecutionTimeout] = useState<number>(300);

  // Feedback states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'scenarios' | 'step_definitions' | null>(null);
  const [feedbackContent, setFeedbackContent] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [iteratingContent, setIteratingContent] = useState(false);
  const [iterateProgress, setIterateProgress] = useState<number>(0);
  const [iterateStatus, setIterateStatus] = useState<string>('');
  
  // Diff viewer states
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [proposedContent, setProposedContent] = useState<string>('');
  const [diffType, setDiffType] = useState<'scenarios' | 'step_definitions' | null>(null);
  
  // Manual user story form states
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualStoryForm, setManualStoryForm] = useState({
    id: '',
    title: '',
    description: '',
    acceptanceCriteria: '',
    discussions: [] as string[],
    priority: '',
    storyPoints: 0,
    attachments: [] as File[]
  });
  const [newDiscussion, setNewDiscussion] = useState('');

  // Form states
  const [bugForm, setBugForm] = useState<BugReportForm>({
    projectName: '',
    title: '',
    description: '',
    reproduceSteps: '',
    priority: 2,
    assignedTo: '',
    areaPath: '',
    iterationPath: '',
    userStoryId: 0,
  });

  const [testCaseForm, setTestCaseForm] = useState<TestCaseForm>({
    projectName: '',
    parentUserStoryId: 0,
    areaPath: '',
    iterationPath: '',
    testCaseTitle: '',
    testCaseDescription: '',
  });

  const [generatedBDD, setGeneratedBDD] = useState<string>('');
  const [coverageAnalysis, setCoverageAnalysis] = useState<object>({});
  const [popupBDD, setPopupBDD] = useState<string>('');
  
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      setError('');

      try {
        const response = await fetch('https://www.valuemomentum.studio/itap/GenTestAI/api/AzureApi/projects');

        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
        }

        const projectNames: string[] = await response.json();

        // Convert string array to Project objects
        const projectObjects: Project[] = projectNames.map((name, index) => ({
          id: (index + 1).toString(),
          name: name,
          description: `Project: ${name}`
        }));

        setProjects(projectObjects);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch projects from Azure DevOps');
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Handlers for API calls
  const handleProjectSelect = async (projectName: string) => {
    setSelectedProject(projectName);
    setLoading(true);
    setError('');

    try {
      // Fetch area paths from API
      const areaPathsResponse = await fetch(`https://www.valuemomentum.studio/itap/GenTestAI/api/AzureApi/Asset Migration - Cognitive/areaPaths`);

      if (!areaPathsResponse.ok) {
        throw new Error(`Failed to fetch area paths: ${areaPathsResponse.status} ${areaPathsResponse.statusText}`);
      }

      const areaPathsData = await areaPathsResponse.json();

      const areaPathObjects: AreaPath[] = areaPathsData.map((area: any) => ({
        id: area.id?.toString() || area.identifier,
        name: area.name,
        path: area.path,
        identifier: area.identifier,
        structureType: area.structureType,
        hasChildren: area.hasChildren
      }));

      setAreaPaths(areaPathObjects);

      // Fetch iteration paths from API
      const iterationPathsResponse = await fetch(`https://www.valuemomentum.studio/itap/GenTestAI/api/AzureApi/Asset Migration - Cognitive/iterationPaths`);

      if (!iterationPathsResponse.ok) {
        throw new Error(`Failed to fetch iteration paths: ${iterationPathsResponse.status} ${iterationPathsResponse.statusText}`);
      }

      const iterationPathsData = await iterationPathsResponse.json();

      const iterationPathObjects: IterationPath[] = iterationPathsData.map((iteration: any) => ({
        id: iteration.id?.toString() || iteration.identifier,
        name: iteration.name,
        path: iteration.path,
        identifier: iteration.identifier,
        structureType: iteration.structureType,
        hasChildren: iteration.hasChildren
      }));

      setIterationPaths(iterationPathObjects);

    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch project configuration');

      setAreaPaths([]);
      setIterationPaths([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchUserStories = async () => {
    if (!selectedProject || !selectedAreaPath || !selectedIterationPath) {
      setError('Please select both area path and iteration path');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedArea = areaPaths.find(area => area.path === selectedAreaPath);
      const selectedIteration = iterationPaths.find(iteration => iteration.path === selectedIterationPath);

      if (!selectedArea || !selectedIteration) {
        throw new Error('Selected area path or iteration path not found');
      }

      const areaPathParam = `${selectedProject}\\\\${selectedArea.name}`;
      const iterationPathParam = `${selectedProject}\\\\${selectedIteration.name}`;

      const userStoriesUrl = `https://www.valuemomentum.studio/itap/GenTestAI/api/AzureApi/${encodeURIComponent(selectedProject)}/userStoriesByPaths?areaPath=${encodeURIComponent(areaPathParam)}&iterationPath=${encodeURIComponent(iterationPathParam)}`;

      const response = await fetch(userStoriesUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch user stories: ${response.status} ${response.statusText}`);
      }

      const userStoriesData = await response.json();

      const userStoryObjects: UserStory[] = userStoriesData.map((story: any) => ({
        id: story.id,
        title: story.title,
        description: story.description,
        state: story.state,
        acceptanceCriteria: story.acceptanceCriteria,
        attachments: story.attachments || []
      }));

      setUserStories(userStoryObjects);
      setSuccess(`Fetched ${userStoryObjects.length} user stories successfully!`);
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error fetching user stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user stories');
      setUserStories([]);
    } finally {
      setLoading(false);
    }
  };

  // Shared SSE streaming helper used by Generate & Regenerate
// Shared SSE streaming helper used by Generate & Regenerate
const streamScenarios = async () => {
  if (!selectedUserStory) return;

  // reset UI
  setLoading(true);
  setGeneratedBDD('');
  setCoverageAnalysis({});
  setPopupBDD('');
  setStreamProgress(0);
  setStreamStatus('Starting…');
  setError('');

  try {
    // Prepare request body with proper handling of optional fields
    const requestBody: any = {
      id: String(selectedUserStory.id ?? ''),
      title: selectedUserStory.title ?? '',
      description: selectedUserStory.description ?? '',
      acceptanceCriteria: selectedUserStory.acceptanceCriteria ?? '',
    };

    // Add attachments if they exist
    if (selectedUserStory.attachments && selectedUserStory.attachments.length > 0) {
      requestBody.attachments = selectedUserStory.attachments.map(a => ({
        fileName: a.fileName,
        attachmentUrl: a.attachmentUrl,
        // contentBase64: a.contentBase64 ?? undefined, // only if you have it
      }));
    }

    // Add discussions if this is a manual user story with discussions
    if (selectedUserStory.id.startsWith('MANUAL-') && manualStoryForm.discussions.length > 0) {
      requestBody.discussions = manualStoryForm.discussions;
    }

    // Add priority and story points for manual stories
    if (selectedUserStory.id.startsWith('MANUAL-')) {
      if (manualStoryForm.priority) {
        requestBody.priority = manualStoryForm.priority;
      }
      if (manualStoryForm.storyPoints > 0) {
        requestBody.story_points = manualStoryForm.storyPoints;
      }
    }

    const res = await fetch('https://www.valuemomentum.studio/itap/api/v1/scenarios/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${msg || res.statusText}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE frames (blank line separated)
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);

        if (!frame.startsWith('data:')) continue;
        const json = frame.slice(5).trim();

        try {
          const evt = JSON.parse(json); // { progress, message, data }
          if (typeof evt.progress === 'number') setStreamProgress(evt.progress);
          if (evt.message) setStreamStatus(evt.message);
          if (evt?.data?.bdd_scenarios) {
            const text = String(evt.data.bdd_scenarios);
            setGeneratedBDD(text);
            setPopupBDD(text);
          }
          if (evt?.data?.coverage_analysis) {
            setCoverageAnalysis(evt.data.coverage_analysis);
          }
        } catch {
          // ignore partial frames
        }
      }
    }

    setStreamProgress(100);
    setStreamStatus('Done');
    setSuccess('BDD scenario generated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  } catch (e: any) {
    setError(e?.message || 'Failed to fetch');
    setStreamStatus('Failed');
  } finally {
    setLoading(false);
  }
};

// Iterate content using the /api/v1/iterate/stream endpoint
const handleIterateContent = async (
  content: string,
  iterationType: 'scenarios' | 'step_definitions',
  feedback?: string
) => {
  setIteratingContent(true);
  setIterateProgress(0);
  setIterateStatus('Starting iteration...');
  setError('');
  
  // Store original content for diff comparison
  setOriginalContent(content);
  setDiffType(iterationType);

  try {
    const requestBody: any = {
      content,
      iteration_type: iterationType,
      feedback: feedback || undefined,
    };

    // Add required fields based on iteration type
    if (iterationType === 'scenarios' && selectedUserStory) {
      requestBody.user_story = {
        id: String(selectedUserStory.id ?? ''),
        title: selectedUserStory.title ?? '',
        description: selectedUserStory.description ?? '',
        acceptanceCriteria: selectedUserStory.acceptanceCriteria ?? '',
      };

      // Add attachments if they exist
      if (selectedUserStory.attachments && selectedUserStory.attachments.length > 0) {
        requestBody.user_story.attachments = selectedUserStory.attachments.map(a => ({
          fileName: a.fileName,
          attachmentUrl: a.attachmentUrl,
        }));
      }

      // Add discussions and other manual story fields if this is a manual user story
      if (selectedUserStory.id.startsWith('MANUAL-')) {
        if (manualStoryForm.discussions.length > 0) {
          requestBody.user_story.discussions = manualStoryForm.discussions;
        }
        if (manualStoryForm.priority) {
          requestBody.user_story.priority = manualStoryForm.priority;
        }
        if (manualStoryForm.storyPoints > 0) {
          requestBody.user_story.story_points = manualStoryForm.storyPoints;
        }
      }
    } else if (iterationType === 'step_definitions' && selectedUserStory) {
      requestBody.bdd_scenarios = {
        bdd_scenarios: generatedBDD,
        acceptance_criteria: selectedUserStory.acceptanceCriteria ?? '',
        attachments: (selectedUserStory.attachments ?? []).map(a => ({
          fileName: a.fileName,
          attachmentUrl: a.attachmentUrl,
        }))
      };
    }

    const res = await fetch('https://www.valuemomentum.studio/itap/api/v1/iterate/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${msg || res.statusText}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalProposedContent = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);

        if (!frame.startsWith('data:')) continue;
        const json = frame.slice(5).trim();

        try {
          const evt = JSON.parse(json);
          if (typeof evt.progress === 'number') setIterateProgress(evt.progress);
          if (evt.message) setIterateStatus(evt.message);
          
          if (iterationType === 'scenarios' && evt?.data?.bdd_scenarios) {
            finalProposedContent = String(evt.data.bdd_scenarios);
          } else if (iterationType === 'step_definitions' && evt?.data?.playwright_script) {
            finalProposedContent = String(evt.data.playwright_script);
          }

          if (evt?.data?.coverage_analysis) {
            setCoverageAnalysis(evt.data.coverage_analysis);
          }
        } catch {
          // ignore partial frames
        }
      }
    }

    setIterateProgress(100);
    setIterateStatus('Done');
    
    // Show diff modal instead of applying changes immediately
    if (finalProposedContent && finalProposedContent !== content) {
      setProposedContent(finalProposedContent);
      setShowDiffModal(true);
    } else {
      setSuccess('No changes were suggested.');
      setTimeout(() => setSuccess(''), 3000);
    }
  } catch (e: any) {
    setError(e?.message || 'Failed to iterate content');
    setIterateStatus('Failed');
  } finally {
    setIteratingContent(false);
  }
};

// Open feedback modal
const openFeedbackModal = (type: 'scenarios' | 'step_definitions', content: string) => {
  setFeedbackType(type);
  setFeedbackContent(content);
  setFeedbackMessage('');
  setShowFeedbackModal(true);
};

// Submit feedback
const submitFeedback = async () => {
  if (!feedbackType || !feedbackContent || !feedbackMessage.trim()) {
    setError('Please provide feedback message');
    return;
  }

  setShowFeedbackModal(false);
  await handleIterateContent(feedbackContent, feedbackType, feedbackMessage);
  
  // Reset feedback state
  setFeedbackType(null);
  setFeedbackContent('');
  setFeedbackMessage('');
};

// Fix failed execution
const handleFixExecution = async () => {
  if (!executionResult || !playwrightScript || !selectedUserStory) return;

  const failureLogs = executionResult.execution_logs?.join('\n') || '';
  const errorDetails = executionResult.error_details || '';
  const failedSteps = executionResult.step_results?.filter(step => step.status === 'failed') || [];
  
  const fixPrompt = `The Playwright script execution failed. Please analyze the following logs and errors, then fix the script:

FAILED STEPS:
${failedSteps.map(step => `- ${step.step_name}: ${step.error_message}`).join('\n')}

EXECUTION LOGS:
${failureLogs}

ERROR DETAILS:
${errorDetails}

Please fix the script to handle these issues and make it more robust.`;

  // await handleIterateContent(playwrightScript, 'step_definitions', fixPrompt);
  setFeedbackContent(playwrightScript);
  setFeedbackMessage(fixPrompt);
  setFeedbackType('step_definitions');
  setShowFeedbackModal(true);
};

// Accept proposed changes
const acceptChanges = () => {
  if (!proposedContent || !diffType) return;
  
  if (diffType === 'scenarios') {
    setGeneratedBDD(proposedContent);
    setPopupBDD(proposedContent);
  } else if (diffType === 'step_definitions') {
    setPlaywrightScript(proposedContent);
  }
  
  setShowDiffModal(false);
  setSuccess(`${diffType === 'scenarios' ? 'BDD scenarios' : 'Playwright script'} updated successfully!`);
  setTimeout(() => setSuccess(''), 3000);
  
  // Clear diff state
  setOriginalContent('');
  setProposedContent('');
  setDiffType(null);
};

// Reject proposed changes
const rejectChanges = () => {
  setShowDiffModal(false);
  
  // Clear diff state
  setOriginalContent('');
  setProposedContent('');
  setDiffType(null);
};

// Create unified diff similar to GitHub PR review
const createUnifiedDiff = (original: string, proposed: string) => {
  const originalLines = original.split('\n');
  const proposedLines = proposed.split('\n');
  
  // Simple LCS algorithm to find differences
  const diff = [];
  let originalIndex = 0;
  let proposedIndex = 0;
  
  while (originalIndex < originalLines.length || proposedIndex < proposedLines.length) {
    const originalLine = originalLines[originalIndex];
    const proposedLine = proposedLines[proposedIndex];
    
    if (originalIndex >= originalLines.length) {
      // Only proposed lines left - all additions
      diff.push({
        type: 'added',
        content: proposedLine,
        originalLineNumber: null,
        proposedLineNumber: proposedIndex + 1
      });
      proposedIndex++;
    } else if (proposedIndex >= proposedLines.length) {
      // Only original lines left - all deletions
      diff.push({
        type: 'removed',
        content: originalLine,
        originalLineNumber: originalIndex + 1,
        proposedLineNumber: null
      });
      originalIndex++;
    } else if (originalLine === proposedLine) {
      // Lines are identical
      diff.push({
        type: 'unchanged',
        content: originalLine,
        originalLineNumber: originalIndex + 1,
        proposedLineNumber: proposedIndex + 1
      });
      originalIndex++;
      proposedIndex++;
    } else {
      // Lines are different - check if it's a modification or insertion/deletion
      // Look ahead to see if the proposed line appears later in original
      const proposedInOriginal = originalLines.slice(originalIndex + 1).indexOf(proposedLine);
      const originalInProposed = proposedLines.slice(proposedIndex + 1).indexOf(originalLine);
      
      if (proposedInOriginal === -1 && originalInProposed === -1) {
        // This is a modification
        diff.push({
          type: 'removed',
          content: originalLine,
          originalLineNumber: originalIndex + 1,
          proposedLineNumber: null
        });
        diff.push({
          type: 'added',
          content: proposedLine,
          originalLineNumber: null,
          proposedLineNumber: proposedIndex + 1
        });
        originalIndex++;
        proposedIndex++;
      } else if (proposedInOriginal !== -1 && (originalInProposed === -1 || proposedInOriginal < originalInProposed)) {
        // Original line was deleted
        diff.push({
          type: 'removed',
          content: originalLine,
          originalLineNumber: originalIndex + 1,
          proposedLineNumber: null
        });
        originalIndex++;
      } else {
        // New line was added
        diff.push({
          type: 'added',
          content: proposedLine,
          originalLineNumber: null,
          proposedLineNumber: proposedIndex + 1
        });
        proposedIndex++;
      }
    }
  }
  
  return diff;
};

// Group diff lines into hunks for better readability
const createDiffHunks = (diffLines: any[], contextLines = 3) => {
  const hunks = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentHunk: any[] = [];
  let lastChangeIndex = -1;
  
  diffLines.forEach((line, index) => {
    const isChange = line.type === 'added' || line.type === 'removed';
    
    if (isChange) {
      // Include context lines before the change
      const contextStart = Math.max(0, lastChangeIndex + 1, index - contextLines);
      for (let i = Math.max(currentHunk.length ? 0 : contextStart, contextStart); i < index; i++) {
        if (diffLines[i] && !currentHunk.some(h => h.index === i)) {
          currentHunk.push({ ...diffLines[i], index: i });
        }
      }
      
      // Add the change
      currentHunk.push({ ...line, index });
      lastChangeIndex = index;
    } else if (lastChangeIndex !== -1 && index - lastChangeIndex <= contextLines) {
      // Add context lines after changes
      currentHunk.push({ ...line, index });
    } else if (lastChangeIndex !== -1 && index - lastChangeIndex > contextLines) {
      // End current hunk and start a new one if needed
      if (currentHunk.length > 0) {
        hunks.push([...currentHunk]);
        currentHunk = [];
      }
      lastChangeIndex = -1;
    }
  });
  
  // Add final hunk if it exists
  if (currentHunk.length > 0) {
    hunks.push(currentHunk);
  }
  
  return hunks.length > 0 ? hunks : [diffLines]; // Return all lines if no changes
};

// Handle manual user story form
const handleManualFormSubmit = async () => {
  // Clear any previous errors
  setError('');
  
  // Validate required fields
  if (!manualStoryForm.title?.trim() || !manualStoryForm.description?.trim()) {
    setError('Please fill in required fields (Title and Description)');
    return;
  }

  // Validate title length
  if (manualStoryForm.title.trim().length < 5) {
    setError('Title must be at least 5 characters long');
    return;
  }

  // Validate description length
  if (manualStoryForm.description.trim().length < 10) {
    setError('Description must be at least 10 characters long');
    return;
  }

  setLoading(true);

  try {
    // Convert form data to UserStory format with proper handling of optional fields
    const processAttachments = async () => {
      if (manualStoryForm.attachments.length === 0) return undefined;
      
      const processedAttachments = [];
      for (const file of manualStoryForm.attachments) {
        const contentBase64 = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
          reader.readAsDataURL(file);
        });
        
        processedAttachments.push({
          fileName: file.name,
          contentBase64
        });
      }
      return processedAttachments;
    };
    
    // Process attachments first, then create the user story
    const attachments = await processAttachments();
    
    const manualUserStory: UserStory = {
      id: manualStoryForm.id?.trim() || `MANUAL-${Date.now()}`,
      title: manualStoryForm.title.trim(),
      description: manualStoryForm.description.trim(),
      state: 'New',
      acceptanceCriteria: manualStoryForm.acceptanceCriteria?.trim() || undefined,
      attachments
    };

    // Set as selected user story and close form
    setSelectedUserStory(manualUserStory);
    setShowManualForm(false);
    // setSuccess('Generating BDD scenarios...');
    
    // Switch to BDD tab
    setActiveTab('bdd');
    
    // Automatically generate BDD scenarios for the manual user story
    setShowUserStoryPopup(true);
    // await streamScenarios();
    // setSuccess('BDD scenarios generated successfully for manual user story!');
    // setTimeout(() => setSuccess(''), 5000);
    
    // Reset the form for next use
    resetManualForm();
    
  } catch (error) {
    setError('Failed to generate BDD scenarios. You can try regenerating them manually from the BDD tab.');
    console.error('BDD generation error:', error);
  } finally {
    setLoading(false);
  }
};

const addDiscussion = () => {
  if (newDiscussion.trim()) {
    setManualStoryForm(prev => ({
      ...prev,
      discussions: [...prev.discussions, newDiscussion.trim()]
    }));
    setNewDiscussion('');
  }
};

const removeDiscussion = (index: number) => {
  setManualStoryForm(prev => ({
    ...prev,
    discussions: prev.discussions.filter((_, i) => i !== index)
  }));
};

const handleFileUpload = (files: FileList | null) => {
  if (files) {
    const newFiles = Array.from(files);
    setManualStoryForm(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles]
    }));
  }
};

const removeAttachment = (index: number) => {
  setManualStoryForm(prev => ({
    ...prev,
    attachments: prev.attachments.filter((_, i) => i !== index)
  }));
};

const resetManualForm = () => {
  setManualStoryForm({
    id: '',
    title: '',
    description: '',
    acceptanceCriteria: '',
    discussions: [],
    priority: '',
    storyPoints: 0,
    attachments: []
  });
  setNewDiscussion('');
};

  const handleGenerateBDD = async () => {
    await streamScenarios();
    // close the popup and jump to the BDD tab when finished
    setShowUserStoryPopup(false);
    setActiveTab('bdd');
  };

const handleRegenerateBDD = async () => {
  if (!selectedUserStory) return;
  setIsRegenerating(true);
  setShowUserStoryPopup(true);   // open the same modal
  await streamScenarios();       // stream INSIDE the modal
  setIsRegenerating(false);
  setShowUserStoryPopup(false);  // close it on completion
  setActiveTab('bdd');           // stay on BDD tab after close
};


  const handleSaveBDD = async () => {
    if (!popupBDD || !selectedUserStory) {
      setError('No BDD scenario to save');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('BDD scenario saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  // Generate Playwright (TypeScript) from current BDD
const handleGeneratePlaywright = async () => {
  if (!generatedBDD || !selectedUserStory) {
    setError('Please generate BDD scenarios first.');
    return;
  }

  setGeneratingScript(true);
  setScriptStatus('Generating Playwright script…');
  setPlaywrightScript('');
  setError('');

  try {
    const res = await fetch('https://www.valuemomentum.studio/itap/api/v1/step-definitions/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bdd_scenarios: generatedBDD,
        acceptance_criteria: selectedUserStory.acceptanceCriteria ?? '',
        attachments: (selectedUserStory.attachments ?? []).map(a => ({
          fileName: a.fileName,
          attachmentUrl: a.attachmentUrl,
        })),
      }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${msg || res.statusText}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let script = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);
        if (!frame.startsWith('data:')) continue;
        const json = frame.slice(5).trim();
        try {
          const evt = JSON.parse(json); // { progress, message, data }
          if (evt?.data?.playwright_script) {
            script = String(evt.data.playwright_script);
            setPlaywrightScript(script);
          }
          if (evt.message) setScriptStatus(evt.message);
        } catch {
          // ignore partial frames
        }
      }
    }

    setScriptStatus('Done');
    setSuccess('Playwright script generated!');
    setTimeout(() => setSuccess(''), 3000);
  } catch (e: any) {
    setError(e?.message || 'Failed to generate Playwright script');
    setScriptStatus('Failed');
  } finally {
    setGeneratingScript(false);
  }
};

// Execute Playwright script using the new ITAP API
const handleExecutePlaywright = async () => {
  if (!playwrightScript || !selectedUserStory) return;
  setExecutingScript(true);
  setExecutionResult(null);
  setScriptStatus('Executing Playwright script…');
  setError('');
  
  try {
    const requestBody = {
      user_story_id: selectedUserStory.id,
      bdd_scenarios: generatedBDD || `Feature: ${selectedUserStory.title}\n  Scenario: Execute generated script\n    Given the script is ready\n    When the script runs\n    Then it should complete successfully`,
      playwright_script: playwrightScript,
      execution_timeout: executionTimeout,
      browser_config: browserConfig
    };

    const res = await fetch('https://www.valuemomentum.studio/itap/api/v1/scripts/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    // Set up streaming response handling
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Failed to get response reader');
    
    setScriptStatus('Executing script and waiting for results...');
    
    // Process the stream
    let buffer = '';
    let executionData: ScriptExecutionResponse | null = null;
    let executionAnalysis: ScriptExecutionAnalysis | null = null;
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Convert bytes to string and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE frames (data: prefix)
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);
        
        if (!frame.startsWith('data:')) continue;
        const json = frame.slice(5).trim();
        
        if (!json) continue;
        
        try {
          const data = JSON.parse(json);
          
          // Handle keepalive empty objects
          if (Object.keys(data).length === 0) {
            setScriptStatus('Still executing... please wait');
            continue;
          }
          
          // Handle actual execution response
          if (data.execution_response) {
            executionData = data.execution_response;
            setScriptStatus('Analyzing output...');
          }
          if (data.execution_analysis) {
            executionAnalysis = data.execution_analysis;
            setScriptStatus('Finished.');
            break;
          }
        } catch (e) {
          // Ignore parsing errors for incomplete chunks
          console.warn('Error parsing SSE data:', e);
        }
      }
      
      if (executionData && executionAnalysis) break;
    }
    
    // Use the execution data if we got it from the stream
    if (executionData && executionAnalysis) {
      setExecutionResult(executionData);


      if (executionData.overall_status === 'passed') {
        setScriptStatus('Execution completed successfully');
        setSuccess(`Script executed successfully! ${executionData.passed_steps} steps passed in ${(executionData.total_duration / 1000).toFixed(2)}s`);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setScriptStatus('Execution completed with failures');
        if (executionAnalysis.is_bug_found) {
          setError(`Script execution failed. ${executionData.failed_steps} steps failed. Bug found: ${executionAnalysis.bug_type} bug in ${executionAnalysis.bug_location}: ${executionAnalysis.bug_description}`);
        }
        else {
          setError(`Script execution failed. ${executionData.failed_steps} steps failed. Check execution details below.`);
        }
      }
      return;
    }
    

    const data: ScriptExecutionResponse = await res.json();
    setExecutionResult(data);
    
    if (data.overall_status === 'passed') {
      setScriptStatus('Execution completed successfully');
      setSuccess(`Script executed successfully! ${data.passed_steps} steps passed in ${(data.total_duration / 1000).toFixed(2)}s`);
      setTimeout(() => setSuccess(''), 5000);
    } else {
      setScriptStatus('Execution completed with failures');
      setError(`Script execution failed. ${data.failed_steps} steps failed. Check execution details below.`);
    }
  } catch (e: any) {
    setError(e?.message || 'Failed to execute Playwright script');
    setScriptStatus('Execution failed');
  } finally {
    setExecutingScript(false);
  }
};

// Download script as .cs file
const downloadScript = () => {
  if (!playwrightScript) return;
  const blob = new Blob([playwrightScript], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Playwright_${selectedUserStory?.id ?? 'script'}.ts`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
};

const downloadFeatureFile = () => {
  if (!selectedUserStory) return;
  const blob = new Blob([generatedBDD], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `BDD_${selectedUserStory?.id ?? 'script'}.feature`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
};

  const handleCreateTestCase = async () => {
    if (!testCaseForm.testCaseTitle || !testCaseForm.testCaseDescription) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('Test case created successfully!');
      setTestCaseForm({
        projectName: '',
        parentUserStoryId: 0,
        areaPath: '',
        iterationPath: '',
        testCaseTitle: '',
        testCaseDescription: '',
      });
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  const handleCreateBug = async () => {
    if (!bugForm.title || !bugForm.description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('Bug report created successfully!');
      setBugForm({
        projectName: '',
        title: '',
        description: '',
        reproduceSteps: '',
        priority: 2,
        assignedTo: '',
        areaPath: '',
        iterationPath: '',
        userStoryId: 0,
      });
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  const handleGetWorkItemRelations = async (workItemId: string) => {
    setLoading(true);
    setTimeout(() => {
      setWorkItemRelations([
        { rel: 'Child', url: 'https://dev.azure.com/org/project/_workitems/edit/12348' },
        { rel: 'Related', url: 'https://dev.azure.com/org/project/_workitems/edit/12349' },
        { rel: 'Parent', url: 'https://dev.azure.com/org/project/_workitems/edit/12344' },
      ]);
      setLoading(false);
    }, 500);
  };

  const handleUserStoryClick = (story: UserStory) => {
    setSelectedUserStory(story);
    setShowUserStoryPopup(true);
  };

  const closeUserStoryPopup = () => {
    setShowUserStoryPopup(false);
  };

  // Content for the Details panel
  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Azure DevOps Integration</h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        This tool provides comprehensive integration with Azure DevOps Services, enabling teams to streamline
        their development workflow through automated test generation, work item management, and BDD scenario creation.
      </p>

      <h4 className="text-lg font-semibold mb-3">Key Features</h4>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li>Project and work item discovery</li>
        <li>User story and acceptance criteria management</li>
        <li>Automated BDD scenario generation</li>
        <li>Test case creation and linking</li>
        <li>Bug report submission with attachments</li>
        <li>Work item relationship tracking</li>
      </ul>

      <h4 className="text-lg font-semibold mb-3">Benefits</h4>
      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        <li>Reduced manual effort in test case creation</li>
        <li>Consistent BDD scenario formatting</li>
        <li>Improved traceability between requirements and tests</li>
        <li>Streamlined bug reporting process</li>
        <li>Enhanced team collaboration and visibility</li>
      </ul>
    </>
  );

  // Content for the Setup panel
  const setupPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Setup Instructions</h3>

      <h4 className="text-lg font-semibold mb-3">Prerequisites</h4>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li>Azure DevOps organization and project access</li>
        <li>Personal Access Token (PAT) with appropriate permissions</li>
        <li>Project contributor or higher role</li>
      </ul>

      <h4 className="text-lg font-semibold mb-3">Configuration Steps</h4>
      <ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
        <li>Navigate to Azure DevOps → User Settings → Personal Access Tokens</li>
        <li>Create a new token with the following scopes:
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Work Items (Read &amp; Write)</li>
            <li>Project and Team (Read)</li>
            <li>Test Management (Read &amp; Write)</li>
          </ul>
        </li>
        <li>Configure the API base URL and authentication headers</li>
        <li>Test the connection using the project listing endpoint</li>
      </ol>

      <h4 className="text-lg font-semibold mb-3">API Endpoints</h4>
      <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono">
        <div className="mb-2"><strong>Base URL:</strong> https://dev.azure.com/{'{organization}'}/{'{project}'}/_apis/</div>
        <div className="mb-2"><strong>Projects:</strong> GET /projects</div>
        <div className="mb-2"><strong>Work Items:</strong> GET /wit/workitems</div>
        {/* <div><strong>Test Cases:</strong> POST /test/testcases</div> */}
      </div>
    </>
  );

  const demoContent = (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="ai-card mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-primary text-white rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">AI-Powered Testing — Faster, Smarter, Automated</h1>
              <p className="text-medium-gray">Streamline your development workflow with AI-powered test generation</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {[
              { id: 'projects', label: 'Projects & Stories' },
              { id: 'bdd', label: 'BDD Generation' },
              { id: 'playwrightscripts', label: 'Playwright Scripts' },
              // { id: 'testcase', label: 'Test Cases' },
              // { id: 'bugs', label: 'Bug Reports' },
              // { id: 'relations', label: 'Work Item Relations' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all duration-normal ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-medium-gray hover:bg-gray-200'
                }`}
              >
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 border-l-4 border-error text-error p-4 mb-6 rounded shadow animate-[fadeIn_0.3s_ease-in] flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
            <button onClick={() => setError('')} className="ml-auto">×</button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-success text-success p-4 mb-6 rounded shadow animate-[fadeIn_0.3s_ease-in] flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
            <button onClick={() => setSuccess('')} className="ml-auto">×</button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Projects Selection */}
            <div className="ai-card">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>📋</span> Projects
              </h3>

              {loadingProjects ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-medium-gray">Loading projects from Azure DevOps...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-medium-gray">
                  <div className="text-4xl mb-2">📋</div>
                  <p>No projects available or failed to load projects</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 text-primary hover:text-primary-dark text-sm underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-gray mb-2">Select Project</label>
                    <select
                      value={selectedProject}
                      onChange={(e) => handleProjectSelect(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Choose a project...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.name}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {selectedProject && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold mb-3">Fetch User Stories</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <select
                      value={selectedAreaPath}
                      onChange={(e) => setSelectedAreaPath(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select Area Path</option>
                      {areaPaths.map((area) => (
                        <option key={area.id} value={area.path}>{area.name}</option>
                      ))}
                    </select>

                    <select
                      value={selectedIterationPath}
                      onChange={(e) => setSelectedIterationPath(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select Iteration Path</option>
                      {iterationPaths.map((iteration) => (
                        <option key={iteration.id} value={iteration.path}>{iteration.name}</option>
                      ))}
                    </select>

                    <button
                      onClick={handleFetchUserStories}
                      disabled={loading || !selectedAreaPath || !selectedIterationPath}
                      className="btn-ai w-full"
                    >
                      {loading ? 'Loading...' : 'Fetch User Stories'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Stories */}
            <div className="ai-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                <span>📝</span> User Stories
              </h3>
                <button
                  onClick={() => {
                    resetManualForm();
                    setShowManualForm(true);
                  }}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  ➕ Manual Entry
                </button>
              </div>

              {userStories.length === 0 ? (
                <div className="text-center py-8 text-medium-gray">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="mb-3">Select a project and fetch user stories to get started</p>
                  <p className="text-sm">
                    Or use <strong>Manual Entry</strong> to create a user story from scratch with custom attachments
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {userStories.map((story) => (
                    <div
                      key={story.id}
                      onClick={() => handleUserStoryClick(story)}
                      className="p-4 border rounded-lg cursor-pointer transition-all duration-normal border-gray-200 hover:border-primary/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-primary">#{story.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          story.state === 'Active' ? 'bg-green-100 text-green-800' :
                          story.state === 'New' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {story.state}
                        </span>
                      </div>
                      <h4 className="font-semibold text-dark-gray mb-2">{story.title}</h4>
                      <p className="text-sm text-medium-gray line-clamp-2">{story.description}</p>

                      {story.attachments && story.attachments.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-medium-gray">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {story.attachments.length} attachment(s)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bdd' && (
          <div className="ai-card">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>🤖</span> BDD Scenario Generation
            </h3>

            {selectedUserStory && generatedBDD ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left column: Selected User Story (with bottom progress bar) */}
                <div className="space-y-4 relative">
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-dark-gray">Selected User Story</h4>
                      {selectedUserStory.id.startsWith('MANUAL-') && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Manual Entry
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-primary">#{selectedUserStory.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedUserStory.state === 'Active' ? 'bg-green-100 text-green-800' :
                        selectedUserStory.state === 'New' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUserStory.state}
                      </span>
                    </div>
                    <h5 className="font-medium text-dark-gray mb-1">{selectedUserStory.title}</h5>
                    <p className="text-sm text-medium-gray">{selectedUserStory.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedUserStory(null);
                      setGeneratedBDD('');
                      setCoverageAnalysis({});
                      setStreamProgress(0);
                      setStreamStatus('');
                    }}
                    className="btn-secondary w-full"
                  >
                    Clear and Select Another Story
                  </button>

                  { /* Coverage Analysis */}
                  {/* {Object.keys(coverageAnalysis).length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-dark-gray mb-2">Coverage Analysis</h4>
                      <div>
                        <b>Scenario Mapping</b>
                        <p>{(coverageAnalysis as any)?.scenario_mapping || 'NA'}</p>
                      </div>
                      <div className="mt-2">
                        <b>Coverage Percentage</b>
                        <p>{(coverageAnalysis as any)?.coverage_percentage || 'NA'}</p>
                      </div>
                      <div className="mt-2">
                        <b>Criteria Covered</b>
                        <p>{(coverageAnalysis as any)?.criteria_covered || 'NA'}</p>
                      </div>
                    </div>
                  )} */}

                  {/* Bottom-left progress bar */}
                  {(loading || (streamProgress > 0 && streamProgress < 100) || (iteratingContent && feedbackType === 'scenarios')) && (
                    <div className="absolute left-0 right-0 bottom-0 px-2 pb-3">
                      <div className="bg-gray-200 rounded h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded transition-all duration-300"
                          style={{ width: `${Math.min(iteratingContent && feedbackType === 'scenarios' ? iterateProgress : streamProgress, 100)}%` }}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={iteratingContent && feedbackType === 'scenarios' ? iterateProgress : streamProgress}
                          role="progressbar"
                        />
                      </div>
                      <div className="mt-1 text-xs text-medium-gray flex justify-between">
                        <span className="truncate">
                          {iteratingContent && feedbackType === 'scenarios' 
                            ? iterateStatus 
                            : (streamStatus || (loading ? 'Working…' : ''))
                          }
                        </span>
                        <span>{Math.floor(iteratingContent && feedbackType === 'scenarios' ? iterateProgress : streamProgress)}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column: Generated BDD Scenarios */}
                <div>
                  <h4 className="font-semibold text-dark-gray mb-3">Generated BDD Scenarios</h4>
                  <textarea
                    value={generatedBDD}
                    onChange={(e) => setGeneratedBDD(e.target.value)}
                    className="w-full h-96 p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm text-dark-gray resize-none"
                    placeholder="Generated BDD scenarios will appear here and can be edited..."
                  />

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        setActiveTab('playwrightscripts');
                        // kick off generation on the new screen
                        setTimeout(() => handleGeneratePlaywright(), 0);
                      }}
                      disabled={loading || !generatedBDD}
                      className="btn-ai flex-1"
                    >
                      {generatingScript ? 'Generating scripts…' : 'Generate Playwright Scripts'}
                    </button>
                    <button
                      onClick={handleRegenerateBDD}
                      disabled={loading}
                      className="btn-ai flex-1"
                    >
                      {loading ? 'Regenerating...' : 'Regenerate Scenarios'}
                    </button>
                  </div>
                  
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => openFeedbackModal('scenarios', generatedBDD)}
                      disabled={loading || iteratingContent || !generatedBDD}
                      className="btn-secondary flex-1"
                    >
                      {iteratingContent && feedbackType === 'scenarios' ? 'Improving...' : 'Improve with Feedback'}
                    </button>
                  </div>
                  
                    <div className="mt-3 text-sm text-medium-gray space-y-1">
                      <p>
                        <strong>Note:</strong> Regenerate will completely regenerate the BDD scenarios based on the user story.
                      To update existing scenarios, edit them directly in the text area.
                    </p>
                      <p>
                        <strong>Improve with Feedback:</strong> Use this to iteratively refine scenarios by providing specific improvement suggestions.
                      </p>
                    </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-medium text-medium-gray mb-2">Click on a User Story</h3>
                <p className="text-medium-gray">Please select a user story from the Projects tab to generate BDD scenarios</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'playwrightscripts' && (
          <div className="ai-card">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>🧪</span> Playwright Scripts
            </h3>

            {!selectedUserStory || !generatedBDD ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-medium text-medium-gray mb-2">Generate BDD scenarios first</h3>
                <p className="text-medium-gray">Go to the BDD tab, generate scenarios, then return here.</p>
                <button className="btn-ai mt-6" onClick={() => setActiveTab('bdd')}>
                  Go to BDD Generation
                </button>
              </div>
            ) : (
              <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left column: Selected user story + BDD (read-only) */}
                <div className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-dark-gray mb-2">Selected User Story</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-primary">#{selectedUserStory.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedUserStory.state === 'Active' ? 'bg-green-100 text-green-800' :
                        selectedUserStory.state === 'New' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUserStory.state}
                      </span>
                    </div>
                    <h5 className="font-medium text-dark-gray mb-1">{selectedUserStory.title}</h5>
                    <p className="text-sm text-medium-gray">{selectedUserStory.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-dark-gray mb-2">BDD Scenarios (read-only)</h4>
                    <textarea
                      value={generatedBDD}
                      readOnly
                      className="w-full h-60 p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm text-dark-gray resize-none"
                    />
                    <div className="mt-3 flex gap-3 items-center">
                      {/* Smaller primary so both fit; no wrapping */}
                      <button
                        onClick={handleGeneratePlaywright}
                        disabled={generatingScript}
                        className="btn-ai basis-2/3 md:basis-3/4 text-sm md:text-[15px] py-2 px-4 whitespace-nowrap"
                      >
                        {generatingScript ? 'Generating…' : 'Generate Playwright'}
                      </button>

                      {/* Same font sizing as primary; sized to fit */}
                      <button
                        onClick={() => setActiveTab('bdd')}
                        className="btn-secondary basis-1/3 md:basis-1/4 text-sm md:text-[15px] py-2 px-4 whitespace-nowrap font-medium"
                      >
                        Edit BDD
                      </button>
                      <button
                        onClick={() => downloadFeatureFile()}
                        className="btn-secondary basis-1/3 md:basis-1/4 text-sm md:text-[15px] py-2 px-4 whitespace-nowrap font-medium"
                      >
                        .feature
                      </button>
                    </div>


                    {(generatingScript || scriptStatus) && (
                      <div className="mt-2 text-xs text-medium-gray">
                        {scriptStatus}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: Playwright script editor */}
                <div>
                  <h4 className="font-semibold text-dark-gray mb-3">Playwright Script (TypeScript)</h4>
                  <textarea
                    value={playwrightScript}
                    onChange={(e) => setPlaywrightScript(e.target.value)}
                    className="w-full h-96 p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm text-dark-gray resize-none"
                    placeholder="Your Playwright script will appear here…"
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(playwrightScript)}
                      disabled={!playwrightScript}
                      className="btn-secondary flex-1"
                    >
                      Copy
                    </button>
                    <button
                      onClick={downloadScript}
                      disabled={!playwrightScript}
                      className="btn-ai flex-1"
                    >
                      Download .ts
                    </button>
                    <button
                      onClick={handleExecutePlaywright}
                      disabled={!playwrightScript || executingScript || !selectedUserStory}
                      className="btn-ai flex-1"
                    >
                      {executingScript ? 'Running…' : 'Run Script'}
                    </button>
                  </div>
                  
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => openFeedbackModal('step_definitions', playwrightScript)}
                      disabled={iteratingContent || !playwrightScript}
                      className="btn-secondary flex-1"
                    >
                      {iteratingContent && feedbackType === 'step_definitions' ? 'Improving...' : 'Improve with Feedback'}
                    </button>
                  </div>
                  
                  {(iteratingContent && feedbackType === 'step_definitions') && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                      <div className="bg-gray-200 rounded h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded transition-all duration-300"
                          style={{ width: `${Math.min(iterateProgress, 100)}%` }}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={iterateProgress}
                          role="progressbar"
                        />
                      </div>
                      <div className="mt-2 text-xs text-medium-gray flex justify-between">
                        <span className="truncate">{iterateStatus}</span>
                        <span>{Math.floor(iterateProgress)}%</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 text-sm text-medium-gray">
                    <p>
                      <strong>💡 Tip:</strong> Use "Improve with Feedback" to refine the script, or "AI Fix" on failed executions to automatically resolve issues.
                    </p>
                  </div>

                  {/* Browser Configuration */}
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h5 className="font-semibold text-dark-gray mb-3">Execution Settings</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-gray mb-2">Timeout (seconds)</label>
                        <input
                          type="number"
                          min="30"
                          max="600"
                          value={executionTimeout}
                          onChange={(e) => setExecutionTimeout(parseInt(e.target.value) || 300)}
                          className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-gray mb-2">Browser Mode</label>
                        <select
                          value={browserConfig.headless ? 'headless' : 'headed'}
                          onChange={(e) => setBrowserConfig({...browserConfig, headless: e.target.value === 'headless'})}
                          className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="headless">Headless (faster)</option>
                          <option value="headed">Headed (visible)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-gray mb-2">Viewport Width</label>
                        <input
                          type="number"
                          min="800"
                          max="1920"
                          value={browserConfig.viewport?.width || 1280}
                          onChange={(e) => setBrowserConfig({
                            ...browserConfig, 
                            viewport: {
                              ...browserConfig.viewport,
                              width: parseInt(e.target.value) || 1280,
                              height: browserConfig.viewport?.height || 720
                            }
                          })}
                          className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-gray mb-2">Viewport Height</label>
                        <input
                          type="number"
                          min="600"
                          max="1080"
                          value={browserConfig.viewport?.height || 720}
                          onChange={(e) => setBrowserConfig({
                            ...browserConfig, 
                            viewport: {
                              width: browserConfig.viewport?.width || 1280,
                              height: parseInt(e.target.value) || 720
                            }
                          })}
                          className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {executionResult && (
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-dark-gray">Execution Results</h5>
                    <div className="flex items-center gap-3">
                      {executionResult.overall_status === 'failed' && (
                        <button
                          onClick={handleFixExecution}
                          disabled={iteratingContent}
                          className="btn-secondary text-sm px-3 py-1"
                        >
                          {iteratingContent && feedbackType === 'step_definitions' ? 'Fixing...' : 'AI Fix'}
                        </button>
                      )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      executionResult.overall_status === 'passed' 
                        ? 'bg-green-100 text-green-800' 
                        : executionResult.overall_status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {executionResult.overall_status.toUpperCase()}
                    </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{executionResult.passed_steps}</div>
                      <div className="text-sm text-green-600">Passed</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{executionResult.failed_steps}</div>
                      <div className="text-sm text-red-600">Failed</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{executionResult.skipped_steps}</div>
                      <div className="text-sm text-yellow-600">Skipped</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{(executionResult.total_duration / 1000).toFixed(2)}s</div>
                      <div className="text-sm text-blue-600">Duration</div>
                    </div>
                  </div>

                  {/* Step Results */}
                  {executionResult.step_results && executionResult.step_results.length > 0 && (
                    <div className="mb-4">
                      <h6 className="font-medium text-dark-gray mb-2">Step Details</h6>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {executionResult.step_results.map((step, index) => (
                          <div key={index} className={`p-3 rounded border-l-4 ${
                            step.status === 'passed' 
                              ? 'bg-green-50 border-green-400' 
                              : step.status === 'failed'
                              ? 'bg-red-50 border-red-400'
                              : 'bg-yellow-50 border-yellow-400'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{step.step_name}</span>
                              <span className="text-xs text-gray-500">{(step.duration / 1000).toFixed(2)}s</span>
                            </div>
                            {step.error_message && (
                              <div className="text-xs text-red-600 font-mono mt-1">{step.error_message}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Execution Logs */}
                  {executionResult.execution_logs && executionResult.execution_logs.length > 0 && (
                    <div>
                      <h6 className="font-medium text-dark-gray mb-2">Execution Logs</h6>
                      <div className="p-3 bg-gray-100 border border-gray-200 rounded text-sm font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {executionResult.execution_logs.join('\n')}
                      </div>
                    </div>
                  )}

                  {/* Error Details */}
                  {executionResult.error_details && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <h6 className="font-medium text-red-800 mb-2">Error Details</h6>
                      <div className="text-sm text-red-700 font-mono">{executionResult.error_details}</div>
                    </div>
                  )}
                </div>
              )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'testcase' && (
          <div className="ai-card">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>✅</span> Create Test Case
            </h3>

            <div className="max-w-2xl mx-auto">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateTestCase(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-gray mb-2">Project Name *</label>
                    <select
                      value={testCaseForm.projectName}
                      onChange={(e) => setTestCaseForm({...testCaseForm, projectName: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.name}>{project.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-gray mb-2">Parent User Story ID *</label>
                    <input
                      type="number"
                      value={testCaseForm.parentUserStoryId || ''}
                      onChange={(e) => setTestCaseForm({...testCaseForm, parentUserStoryId: parseInt(e.target.value) || 0})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="12345"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-gray mb-2">Area Path *</label>
                    <select
                      value={testCaseForm.areaPath}
                      onChange={(e) => setTestCaseForm({...testCaseForm, areaPath: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    >
                      <option value="">Select Area Path</option>
                      {areaPaths.map((area) => (
                        <option key={area.id} value={area.path}>{area.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-gray mb-2">Iteration Path *</label>
                    <select
                      value={testCaseForm.iterationPath}
                      onChange={(e) => setTestCaseForm({...testCaseForm, iterationPath: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    >
                      <option value="">Select Iteration Path</option>
                      {iterationPaths.map((iteration) => (
                        <option key={iteration.id} value={iteration.path}>{iteration.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">Test Case Title *</label>
                  <input
                    type="text"
                    value={testCaseForm.testCaseTitle}
                    onChange={(e) => setTestCaseForm({...testCaseForm, testCaseTitle: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Verify user login functionality"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">Test Case Description *</label>
                  <textarea
                    value={testCaseForm.testCaseDescription}
                    onChange={(e) => setTestCaseForm({...testCaseForm, testCaseDescription: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary h-32"
                    placeholder="Detailed test case steps and expected results..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-ai w-full"
                >
                  {loading ? 'Creating Test Case...' : 'Create Test Case'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'bugs' && (
          <div className="ai-card">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>🐛</span> Report Bug
            </h3>

            <div className="max-w-2xl mx-auto">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateBug(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-gray mb-2">Project Name *</label>
                    <select
                      value={bugForm.projectName}
                      onChange={(e) => setBugForm({...bugForm, projectName: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.name}>{project.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-gray mb-2">Priority</label>
                    <select
                      value={bugForm.priority}
                      onChange={(e) => setBugForm({...bugForm, priority: parseInt(e.target.value)})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value={1}>1 - Critical</option>
                      <option value={2}>2 - High</option>
                      <option value={3}>3 - Medium</option>
                      <option value={4}>4 - Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">Bug Title *</label>
                  <input
                    type="text"
                    value={bugForm.title}
                    onChange={(e) => setBugForm({...bugForm, title: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Brief description of the bug"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">Description *</label>
                  <textarea
                    value={bugForm.description}
                    onChange={(e) => setBugForm({...bugForm, description: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary h-24"
                    placeholder="Detailed description of the bug"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">Steps to Reproduce</label>
                  <textarea
                    value={bugForm.reproduceSteps}
                    onChange={(e) => setBugForm({...bugForm, reproduceSteps: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary h-24"
                    placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Observe..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-gray mb-2">Assigned To</label>
                    <input
                      type="email"
                      value={bugForm.assignedTo}
                      onChange={(e) => setBugForm({...bugForm, assignedTo: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="developer@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-gray mb-2">User Story ID</label>
                    <input
                      type="number"
                      value={bugForm.userStoryId || ''}
                      onChange={(e) => setBugForm({...bugForm, userStoryId: parseInt(e.target.value) || 0})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">Screenshot (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBugForm({...bugForm, snapshot: e.target.files?.[0]})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-ai w-full"
                >
                  {loading ? 'Creating Bug Report...' : 'Create Bug Report'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'relations' && (
          <div className="ai-card">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>🔗</span> Work Item Relations
            </h3>

            <div className="max-w-xl mx-auto">
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-gray mb-2">Work Item ID</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter work item ID (e.g., 12345)"
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        handleGetWorkItemRelations(target.value);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="work item ID"]') as HTMLInputElement;
                      handleGetWorkItemRelations(input.value);
                    }}
                    disabled={loading}
                    className="btn-ai px-6"
                  >
                    {loading ? 'Loading...' : 'Get Relations'}
                  </button>
                </div>
              </div>

              {workItemRelations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-dark-gray">Related Work Items</h4>
                  {workItemRelations.map((relation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          relation.rel === 'Parent' ? 'bg-blue-100 text-blue-800' :
                          relation.rel === 'Child' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {relation.rel}
                        </span>
                        <span className="text-sm font-mono text-primary">
                          #{relation.url.split('/').pop()}
                        </span>
                      </div>
                      <button className="text-primary hover:text-primary-dark text-sm">
                        View →
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {workItemRelations.length === 0 && !loading && (
                <div className="text-center py-8 text-medium-gray">
                  <div className="text-4xl mb-2">🔗</div>
                  <p>Enter a work item ID to view its relations</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const modalContent = selectedUserStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-dark-gray">User Story Details</h3>
              <button
                onClick={closeUserStoryPopup}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Single-column content that spans full modal width */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6 w-full">
                {/* User Story Details (full width) */}
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-primary">#{selectedUserStory.id}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedUserStory.state === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : selectedUserStory.state === 'New'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedUserStory.state}
                    </span>
                  </div>

                  <h4 className="font-semibold text-dark-gray mb-2">{selectedUserStory.title}</h4>
                  <p className="text-sm text-medium-gray mb-3">{selectedUserStory.description}</p>

                  {selectedUserStory.acceptanceCriteria && (
                    <div className="mb-4">
                      <h5 className="font-medium text-dark-gray mb-2">Acceptance Criteria:</h5>
                      <div className="text-sm text-medium-gray bg-white p-3 rounded border">
                        {selectedUserStory.acceptanceCriteria.split("&nbsp;").map((line, index) => (
                          <div key={index} className="mb-1">
                            {line.trim() ? line.trim() : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUserStory.attachments && selectedUserStory.attachments.length > 0 && (
                    <div>
                      <h5 className="font-medium text-dark-gray mb-2">Attachments:</h5>
                      <div className="space-y-2">
                        {selectedUserStory.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                              />
                            </svg>
                            <a
                              href={attachment.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:text-primary-dark underline"
                            >
                              {attachment.fileName}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                
                  {(loading || (streamProgress > 0 && streamProgress < 100)) && (
                    <div className="bg-white p-3 rounded border">
                      <div className="bg-gray-200 rounded h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded transition-all duration-300"
                          style={{ width: `${Math.min(streamProgress, 100)}%` }}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={streamProgress}
                          role="progressbar"
                        />
                      </div>
                      <div className="mt-1 text-xs text-medium-gray flex justify-between">
                        <span className="truncate">{streamStatus || (loading ? 'Working…' : '')}</span>
                        <span>{Math.floor(streamProgress)}%</span>
                      </div>
                    </div>
                  )}

                {/* Actions + (optional) progress */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <button onClick={handleGenerateBDD} disabled={loading} className="btn-ai w-full">
                      {loading ? 'Generating BDD Scenarios...' : 'Generate BDD Scenarios'}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
  );

  // Feedback Modal
  const feedbackModal = showFeedbackModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-dark-gray">
            {feedbackType === 'scenarios' ? 'Improve BDD Scenarios' : 'Improve Playwright Script'}
          </h3>
          <button
            onClick={() => setShowFeedbackModal(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-gray mb-2">
                Current {feedbackType === 'scenarios' ? 'BDD Scenarios' : 'Playwright Script'}:
              </label>
              <textarea className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none" value={feedbackContent} readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-gray mb-2">
                What would you like to improve? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                placeholder={feedbackType === 'scenarios' 
                  ? "e.g., Add more edge cases, improve scenario clarity, add negative test cases..."
                  : "e.g., Make selectors more robust, add better error handling, improve wait strategies..."
                }
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                disabled={!feedbackMessage.trim()}
                className="btn-ai flex-1"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Diff Modal with GitHub-style unified diff
  const diffModal = showDiffModal && originalContent && proposedContent && (() => {
    const diffLines = createUnifiedDiff(originalContent, proposedContent);
    const hunks = createDiffHunks(diffLines);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-semibold text-dark-gray">
                Review Proposed Changes
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {diffType === 'scenarios' ? 'BDD Scenarios' : 'Playwright Script'}
              </p>
            </div>
            <button
              onClick={rejectChanges}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Diff Statistics */}
            <div className="mb-4 flex items-center gap-4 text-sm">
              <span className="text-green-600 font-medium">
                +{diffLines.filter(line => line.type === 'added').length} additions
              </span>
              <span className="text-red-600 font-medium">
                -{diffLines.filter(line => line.type === 'removed').length} deletions
              </span>
            </div>

            {/* Unified Diff View */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {hunks.map((hunk, hunkIndex) => (
                <div key={hunkIndex} className="border-b border-gray-200 last:border-b-0">
                  {/* Hunk Header */}
                  <div className="bg-blue-50 px-4 py-2 text-sm text-blue-800 font-mono border-b border-blue-200">
                    @@ Hunk {hunkIndex + 1} @@
                  </div>
                  
                  {/* Diff Lines */}
                  <div className="bg-gray-50">
                    {hunk.map((line, lineIndex) => (
                      <div
                        key={lineIndex}
                        className={`flex items-start text-sm font-mono ${
                          line.type === 'added' 
                            ? 'bg-green-50 text-green-800' 
                            : line.type === 'removed'
                            ? 'bg-red-50 text-red-800'
                            : 'bg-white text-gray-800'
                        }`}
                      >
                        {/* Line Numbers */}
                        <div className={`flex-shrink-0 w-20 px-2 py-1 text-xs text-gray-500 border-r select-none ${
                          line.type === 'added' ? 'bg-green-100' : line.type === 'removed' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          <span className="inline-block w-8 text-right">
                            {line.originalLineNumber || ''}
                          </span>
                          <span className="inline-block w-8 text-right ml-1">
                            {line.proposedLineNumber || ''}
                          </span>
                        </div>
                        
                        {/* Change Indicator */}
                        <div className={`flex-shrink-0 w-6 px-1 py-1 text-center select-none ${
                          line.type === 'added' 
                            ? 'bg-green-100 text-green-600' 
                            : line.type === 'removed'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                        </div>
                        
                        {/* Line Content */}
                        <div className="flex-1 px-2 py-1 whitespace-pre-wrap break-all">
                          {line.content || ' '}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* No changes message */}
            {diffLines.every(line => line.type === 'unchanged') && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✓</div>
                <p>No changes detected between the original and proposed content.</p>
              </div>
            )}

            {/* Summary */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-semibold text-blue-800 mb-2">Review Summary</h5>
              <p className="text-blue-700 text-sm">
                The AI has suggested improvements to your {diffType === 'scenarios' ? 'BDD scenarios' : 'Playwright script'}. 
                Green lines show additions, red lines show deletions. Please review the changes and choose to accept or reject them.
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex gap-4 justify-end">
              <button
                onClick={rejectChanges}
                className="btn-secondary px-6 flex items-center gap-2"
              >
                <span>❌</span>
                Reject Changes
              </button>
              <button
                onClick={acceptChanges}
                className="btn-ai px-6 flex items-center gap-2"
              >
                <span>✅</span>
                Accept Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })();

  // Manual User Story Form Modal
  const manualFormModal = showManualForm && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-dark-gray">Manual User Story Entry</h3>
          <button
            onClick={() => setShowManualForm(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={(e) => { e.preventDefault(); handleManualFormSubmit(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">
                    User Story ID <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={manualStoryForm.id}
                    onChange={(e) => setManualStoryForm(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="e.g., US-123 (auto-generated if empty)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualStoryForm.title}
                    onChange={(e) => setManualStoryForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="As a user, I want to..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={manualStoryForm.description}
                    onChange={(e) => setManualStoryForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    placeholder="Detailed description of the user story..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-gray mb-2">Priority</label>
                    <select
                      value={manualStoryForm.priority}
                      onChange={(e) => setManualStoryForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select Priority</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-gray mb-2">Story Points</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={manualStoryForm.storyPoints || ''}
                      onChange={(e) => setManualStoryForm(prev => ({ ...prev, storyPoints: parseInt(e.target.value) || 0 }))}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">
                    Acceptance Criteria
                  </label>
                  <textarea
                    value={manualStoryForm.acceptanceCriteria}
                    onChange={(e) => setManualStoryForm(prev => ({ ...prev, acceptanceCriteria: e.target.value }))}
                    className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    placeholder="List of acceptance criteria..."
                  />
                </div>

                {/* Discussions */}
                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">Discussions</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDiscussion}
                        onChange={(e) => setNewDiscussion(e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Add discussion point..."
                        onKeyPress={(e) => e.key === 'Enter' && addDiscussion()}
                      />
                      <button
                        type="button"
                        onClick={addDiscussion}
                        className="btn-secondary px-3 py-2 text-sm"
                      >
                        Add
                      </button>
                    </div>
                    
                    {manualStoryForm.discussions.length > 0 && (
                      <div className="max-h-24 overflow-y-auto space-y-1">
                        {manualStoryForm.discussions.map((discussion, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span className="flex-1">{discussion}</span>
                            <button
                              type="button"
                              onClick={() => removeDiscussion(index)}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* File Attachments */}
                <div>
                  <label className="block text-sm font-medium text-dark-gray mb-2">Attachments</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
                    />
                    
                    {manualStoryForm.attachments.length > 0 && (
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {manualStoryForm.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="flex-1">{file.name}</span>
                              <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-ai flex-1"
              >
                {loading ? 'Creating' : 'Create'}
              </button>
            </div>
          </form>
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
      modalContent={
        (showUserStoryPopup && selectedUserStory ? modalContent : null) ||
        (showFeedbackModal ? feedbackModal : null) ||
        (showDiffModal ? diffModal : null) ||
        (showManualForm ? manualFormModal : null)
      }
    />
  );
}
