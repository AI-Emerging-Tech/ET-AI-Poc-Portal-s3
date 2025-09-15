'use client';

import { useState, useEffect } from 'react';
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';
import { useSession } from 'next-auth/react';
import axios, { AxiosError } from "axios";
import { useAccessControl } from 'hooks/useAccessControl';

interface ClaimDetails {
  claim_number: string;
  line_of_business: string;
  loss_type: string;
  claim_status: string;
}

interface HistoryLog {
  timestamp?: string;
  action?: string;
  user?: string;
  details?: string;
  status?: string;
  notes?: string;
  [key: string]: any;
}

interface ClaimScenario {
  index: number;
  claim_details: ClaimDetails;
  claim_history: HistoryLog[];
  current_action: HistoryLog;
}

interface QaReviewResponse {
  summary_of_actions: string;
  ideal_current_action: string;
  current_action_score: number;
  feedback_comment: string;
  is_action_correct: boolean;
  guideline_sources?: string[];
}

interface WorkflowStepFeedback {
  workflow_step: string;
  // step_number: number;
  feedback: string;
  score: number;
  is_correct: boolean;
}

interface ClaimHandlingAuditResponse {
  workflow_step_feedback: WorkflowStepFeedback[];
}

export default function ClaimsQA() {
  const [scenarios, setScenarios] = useState<ClaimScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<ClaimScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qaAnalysis, setQaAnalysis] = useState<QaReviewResponse | null>(null);
  const [claimAudit, setClaimAudit] = useState<ClaimHandlingAuditResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const [showQaToast, setShowQaToast] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const [showQaModal, setShowQaModal] = useState(false);
  const [excludedHistoryIndices, setExcludedHistoryIndices] = useState<number[]>([]);
  const [isEditingAction, setIsEditingAction] = useState(false);
  const [modifiedCurrentAction, setModifiedCurrentAction] = useState<HistoryLog | null>(null);
  
  const {data: session} = useSession()
  const isDev = session?.user?.role === 'ADMINISTRATOR' || session?.user?.role === 'DEVELOPER'
  // Fetch scenarios on component mount
  useEffect(() => {
    fetchScenarios();
    console.log(scenarios)
  }, []);

  const fetchScenarios = async () => {
    try {
      setIsLoading(true);
      // For demo purposes, we'll simulate the API call with mock data
      const response = await fetch('https://www.valuemomentum.studio/claims_qa/api/claims/scenarios')
      const data = await response.json()
      setScenarios(data?.claim_summaries);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      setError('Failed to load claim scenarios. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScenarioSelect = (scenario: ClaimScenario) => {
    setSelectedScenario(scenario);
    setQaAnalysis(null); // Reset previous analysis
    setClaimAudit(null); // Reset previous audit
    setExcludedHistoryIndices([]); // Reset excluded history when switching scenarios
    setModifiedCurrentAction(null); // Reset modified action
    setIsEditingAction(false); // Exit edit mode
  };

  const runQaAnalysis = async () => {
    if (!selectedScenario) return;
    
    setIsAnalyzing(true);
    setShowQaToast(false);
    setQaAnalysis(null);
    setClaimAudit(null);
    const startTime = Date.now();

    const isClosedClaim = selectedScenario.claim_details.claim_status !== 'Open';

    try {
      // Call the QA Review API
      const response = await fetch('https://www.valuemomentum.studio/claims_qa/api/qa/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim_details: selectedScenario.claim_details,
          history_logs: getFilteredHistory(),
          current_action: getCurrentAction()
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Check if response contains workflow_step_feedback (claim audit) or is single action QA
      if (result.workflow_step_feedback) {
        // Full claim audit response
        setClaimAudit(result as ClaimHandlingAuditResponse);
        setShowQaModal(true); // Show modal immediately for workflow audit
      } else {
        // Single action QA response
        setQaAnalysis(result as QaReviewResponse);
        if (!isClosedClaim) {
          setShowQaToast(true);
          // Auto-hide toast after 15 seconds (longer for QA feedback)
          setTimeout(() => setShowQaToast(false), 15000);
        }
      }
    } catch (error) {
      console.error('Error during QA analysis:', error);
      setError(`QA Analysis failed: ${error}`);
    } finally {
      const endTime = Date.now();
      const timeTaken = (endTime - startTime) / 1000;
      setTimeTaken(timeTaken);
      setIsAnalyzing(false);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-primary/10 text-primary';
      case 'closed': return 'bg-success/10 text-success';
      case 'pending': return 'bg-warning/10 text-warning';
      default: return 'bg-light-gray text-medium-gray';
    }
  };

  const getLossTypeIcon = (lossType: string) => {
    // if (lossType.includes('Rear-End')) return '🚗';
    // if (lossType.includes('Hit-and-Run')) return '🏃‍♂️';
    // if (lossType.includes('Animal')) return '🦌';
    return '📋';
  };

  const sortClaimHistory = (history: HistoryLog[]) => {
    return [...history].sort((a, b) => {
      const dateA = new Date(a.Timestamp || a.timestamp || '');
      const dateB = new Date(b.Timestamp || b.timestamp || '');
      
      if (sortOrder === 'asc') {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // History filtering functions
  const getFilteredHistory = () => {
    if (!selectedScenario) return [];
    return selectedScenario.claim_history.filter((_, index) => !excludedHistoryIndices.includes(index));
  };

  const toggleHistoryItem = (index: number) => {
    setExcludedHistoryIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const selectAllHistory = () => {
    setExcludedHistoryIndices([]);
  };

  const excludeAllHistory = () => {
    if (!selectedScenario) return;
    setExcludedHistoryIndices(selectedScenario.claim_history.map((_, index) => index));
  };

  const getHistoryStats = () => {
    if (!selectedScenario) return { included: 0, total: 0 };
    const total = selectedScenario.claim_history.length;
    const included = total - excludedHistoryIndices.length;
    return { included, total };
  };

  // Current action management
  const getCurrentAction = () => {
    return modifiedCurrentAction || selectedScenario?.current_action;
  };

  const startEditingAction = () => {
    if (selectedScenario) {
      setModifiedCurrentAction({ ...selectedScenario.current_action });
      setIsEditingAction(true);
    }
  };

  const cancelEditingAction = () => {
    setModifiedCurrentAction(null);
    setIsEditingAction(false);
  };

  const resetToOriginalAction = () => {
    setModifiedCurrentAction(null);
    setIsEditingAction(false);
  };

  const updateModifiedAction = (field: keyof HistoryLog, value: string) => {
    if (modifiedCurrentAction) {
      setModifiedCurrentAction({
        ...modifiedCurrentAction,
        [field]: value
      });
    }
  };

  const formatDocName = (name: string) =>
  name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  const getFilename = (p: string) => (p?.split(/[\\/]/).pop() ?? 'document');

const handleDocumentDownload = async (documentPath: string) => {
  try {
    const filename = getFilename(documentPath);
    const url = `https://www.valuemomentum.studio/claims_qa/api/download/${encodeURIComponent(filename)}`;
    const response = await axios.get(url, { responseType: 'blob' });

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = blobUrl;
    a.setAttribute('download', filename); // forces save dialog/name
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download error:', error);
  }
};

  // Content for the Details panel (Business Context)
  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Business Context</h3>
      <p className="text-gray-700 leading-relaxed">
        Claims quality assurance is critical for maintaining accuracy, compliance, and customer satisfaction. 
        Traditional QA processes are manual, time-consuming, and prone to inconsistency. AI-assisted QA can 
        automatically analyze claim patterns, identify potential issues, and ensure consistent review standards.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
        Claims teams need an automated QA system that can analyze claim scenarios in real-time, detect 
        potential fraud indicators, ensure compliance with company policies, and maintain consistent 
        quality standards across all claim types and adjusters.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
        Automated QA reduces the risk of errors, ensures regulatory compliance, improves claim consistency, 
        and frees up QA analysts to focus on complex cases requiring human judgment. This leads to better 
        customer outcomes and reduced operational risk.
      </p>
    </>
  );

  // Content for the Developer Setup panel
  const setupPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Developer Setup</h3>
      <p className="text-gray-700 leading-relaxed">To set up and run this PoC locally, follow these steps:</p>
      <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
        <li>Ensure you have Python 3.11.11 and Quart installed on your system.</li>
        <li>
          Clone the Claims QA repository and install dependencies:
          <pre className="bg-gray-100 p-2 rounded-lg my-2">
            <code>pip install -r src/requirements.txt</code>
          </pre>
        </li>
        <li>
          Start the Flask service with the scenarios API:
          <pre className="bg-gray-100 p-2 rounded-lg my-2">
            <code>python src/app.py</code>
          </pre>
        </li>
        <li>The API endpoint <code>/api/claims/scenarios</code> will provide claim scenarios data.</li>
      </ol>
      <h3 className="text-xl font-semibold mt-6 mb-4">How to Use This PoC</h3>
      <p className="text-gray-700 leading-relaxed">Follow these steps to explore the Claims QA functionality:</p>
      <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
        <li>Browse the available claim scenarios (simulated data) in the main interface.</li>
        <li>Click on a scenario card to view detailed claim information and history.</li>
        <li>Use checkboxes to include/exclude specific historical actions from the analysis.</li>
        <li>Optionally modify the current action (type, description, timestamp) for simulation testing.</li>
        <li>Use the "Audit Action" button to trigger AI-powered quality assessment.</li>
        <li>Review the QA results including compliance status, risk assessment, and recommendations.</li>
      </ol>
    </>
  );

  // Modal content for QA
  const modalContent = showQaModal && (qaAnalysis || claimAudit) ? (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="ai-card max-w-4xl max-h-[80vh] overflow-y-auto m-4 w-full">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold text-dark-gray">
              {claimAudit ? 'Claim Audit Results' : 'QA Feedback'} (took {timeTaken.toFixed(2)}s)
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-medium-gray">
                Claim: {selectedScenario?.claim_details.claim_number}
              </div>
              <button
                onClick={() => setShowQaModal(false)}
                className="text-medium-gray hover:text-dark-gray"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Single Action QA Content */}
          {qaAnalysis && (
            <div className="space-y-6">
              {/* Summary of Actions */}
              <div className="bg-gradient-to-r from-primary/5 to-primary-light/10 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-dark-gray">Summary of Actions</h3>
                <p className="text-dark-gray leading-relaxed">{qaAnalysis.summary_of_actions}</p>
              </div>

              {/* Current Action Score */}
              <div className="bg-light-gray p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-dark-gray">Current Action Assessment</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-medium-gray">Action Score:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary">{qaAnalysis.current_action_score}</span>
                    <span className="text-medium-gray">/ 10</span>
                    <div className={`w-3 h-3 rounded-full ${qaAnalysis.current_action_score > 7 ? 'bg-success' : qaAnalysis.current_action_score <= 7 &&
                                  qaAnalysis.current_action_score > 4 ? 'bg-warning' : 'bg-error'}`}></div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      qaAnalysis.current_action_score > 7 ? 'bg-success' : 
                      qaAnalysis.current_action_score <= 7 &&
                      qaAnalysis.current_action_score > 4 ? 'bg-warning' : 'bg-error'
                    }`}
                    style={{ width: `${qaAnalysis.current_action_score * 10}%` }}
                  ></div>
                </div>
              </div>

              {/* Ideal Current Action */}
              <div className="bg-gradient-to-r from-success/5 to-success/10 p-6 rounded-lg border border-success/20">
                <h3 className="text-lg font-semibold mb-3 text-dark-gray">Recommended Action</h3>

                {(() => {
                  const sources = Array.from(new Set(qaAnalysis.guideline_sources || [])); // de-dupe
                  return (
                    <>
                      {/* Sentence with clickable citation markers */}
                      <p className="text-dark-gray leading-relaxed">{qaAnalysis.ideal_current_action}</p>

                      {/* References list */}
                      {sources.length > 0 && (
                      <div className="mt-4 border-t border-success/20 pt-3">
                        <h4 className="text-sm font-semibold text-dark-gray mb-2">References</h4>
                        <ul className="text-sm text-medium-gray space-y-1">
                          {sources.map((src, i) => {
                            const filename = getFilename(src); // works if src is full path or just a name
                            return (
                              <li key={i} id={`ref-${i + 1}`}>
                                <span className="font-medium text-dark-gray">[{i + 1}]</span>{" "}
                                {/* Use a button styled like a link */}
                                <button
                                  type="button"
                                  onClick={() => handleDocumentDownload(src)}
                                  title={src}
                                  className="text-primary no-underline hover:underline align-baseline p-0 bg-transparent border-0 cursor-pointer"
                                >
                                  {formatDocName(filename)}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    </>
                  );
                })()}
              </div>

              {/* Feedback Comment */}
              <div className="bg-gradient-to-r from-accent-green/5 to-accent-green/10 p-6 rounded-lg border border-accent-green/20">
                <h3 className="text-lg font-semibold mb-3 text-dark-gray">Comment</h3>
                <p className="text-dark-gray leading-relaxed">{qaAnalysis.feedback_comment}</p>
              </div>
            </div>
          )}

          {/* Claim Audit Content */}
          {claimAudit && (
            <div className="space-y-6">
              {/* Overall Summary */}
              <div className="bg-gradient-to-r from-primary/5 to-primary-light/10 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-dark-gray">Workflow Assessment Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {claimAudit.workflow_step_feedback.length}
                    </div>
                    <div className="text-sm text-medium-gray">Steps Reviewed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">
                      {claimAudit.workflow_step_feedback.filter(step => step.is_correct).length}
                    </div>
                    <div className="text-sm text-medium-gray">Steps Correct</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {(claimAudit.workflow_step_feedback.reduce((acc, step) => acc + step.score, 0) / claimAudit.workflow_step_feedback.length).toFixed(1)}
                    </div>
                    <div className="text-sm text-medium-gray">Avg Score</div>
                  </div>
                </div>
              </div>

              {/* Workflow Steps Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-dark-gray">Workflow Step Analysis</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Step
                        </th> */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Workflow Step
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Feedback
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {claimAudit.workflow_step_feedback
                        // .sort((a, b) => a.step_number - b.step_number)
                        .map((step, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {step.step_number}
                          </td> */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <p className="w-1/2 text-wrap text-sm">{step.workflow_step}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <span className={`font-semibold ${
                                step.score > 7 ? 'text-success' : 
                                step.score > 4 ? 'text-warning' : 'text-error'
                              }`}>
                                {step.score}/10
                              </span>
                              <div className={`w-2 h-2 rounded-full ${
                                step.score > 7 ? 'bg-success' : 
                                step.score > 4 ? 'bg-warning' : 'bg-error'
                              }`}></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              step.is_correct 
                                ? 'bg-success/10 text-success' 
                                : 'bg-error/10 text-error'
                            }`}>
                              {step.is_correct ? (
                                <>
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Correct
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Needs Review
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            <div className="" title={step.feedback}>
                              {step.feedback}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  const demoContent = (
    <div className="section bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto max-w-7xl">

        {/* Loading State */}
         {isLoading && (
           <div className="text-center py-12">
             <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 text-medium-gray">Loading claim scenarios...</p>
           </div>
         )}

         {/* Error State */}
         {error && (
           <div className="bg-red-50 border-l-4 border-error p-4 rounded-lg mb-8">
             <p className="text-error">{error}</p>
             <button 
               onClick={fetchScenarios}
               className="mt-2 text-error underline hover:opacity-80"
             >
               Try Again
             </button>
           </div>
         )}

        {/* Main Content */}
        {!isLoading && !error && scenarios && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Scenarios List */}
             <div className="lg:col-span-1 max-h-[600px] overflow-y-auto ai-card ml-4">
               <h3 className="text-xl font-semibold mb-6 text-dark-gray">Claim Scenarios</h3>
               <div className="space-y-4">
                 {scenarios.map((scenario) => (
                   <div
                     key={scenario.index}
                     onClick={() => handleScenarioSelect(scenario)}
                     className={`ai-card cursor-pointer transition-all duration-300 ${
                       selectedScenario?.index === scenario.index
                         ? 'border-primary bg-primary/5 shadow-md'
                         : 'hover:border-primary/20'
                     }`}
                   >
                      {selectedScenario?.index === scenario.index && (
                        <div className="absolute bottom-2 right-2 w-4 h-4 bg-primary-light rounded-full border-4 border-primary-light shadow-md">
                          <div className="w-full h-full bg-primary rounded-full animate-pulse"></div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center space-x-2">
                         <span className="text-2xl">{getLossTypeIcon(scenario.claim_details.loss_type)}</span>
                         <span className="font-semibold text-dark-gray">
                           {scenario.claim_details.claim_number}
                         </span>
                       </div>
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scenario.claim_details.claim_status)}`}>
                         {scenario.claim_details.claim_status}
                       </span>
                     </div>
                     <p className="text-sm text-medium-gray mb-2">{scenario.claim_details.loss_type}</p>
                     <p className="text-xs text-medium-gray">
                       Last Action: {scenario.current_action.Type || scenario.current_action.action}
                     </p>
                  </div>
                ))}
              </div>
            </div>
            {/* Selected Scenario Details */}
             <div className="ai-card lg:col-span-2 mr-4">
               {selectedScenario ? (
                 <div className="max-h-[600px] overflow-y-auto p-4" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--primary) transparent',
                  scrollMarginBlockStart: '100px',
                 }}>
                   <div className="flex items-center justify-between mb-6">
                     <h3 className="text-2xl font-bold text-dark-gray">
                       {selectedScenario.claim_details.claim_number}
                     </h3>
                      <div className="space-y-3">
                       <button
                         onClick={runQaAnalysis}
                         disabled={isAnalyzing}
                         className="btn-ai disabled:opacity-50 disabled:cursor-not-allowed w-full"
                       >
                         {isAnalyzing ? (
                           <>
                             <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                             <span>Analyzing...</span>
                           </>
                         ) : (
                           <>
                             { selectedScenario.claim_details.claim_status === 'Open' ? (
                              <span>🔍  Audit Action</span>
                             ) : (
                              <span>🔍  Audit Claim</span>
                             )}
                             {modifiedCurrentAction && (
                               <span className="ml-2 text-xs opacity-80">
                                 (simulated)
                               </span>
                             )}
                             {excludedHistoryIndices.length > 0 && (
                               <span className="ml-2 text-xs opacity-80">
                                 (with {getHistoryStats().included} actions)
                               </span>
                             )}
                           </>
                         )}
                       </button>
                       
                       {/* Warning when items are excluded */}
                       {excludedHistoryIndices.length > 0 && (
                         <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                           <div className="flex items-center space-x-2">
                             <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                             </svg>
                             <span className="text-sm text-warning font-medium">
                               {excludedHistoryIndices.length} action{excludedHistoryIndices.length > 1 ? 's' : ''} excluded from analysis
                             </span>
                           </div>
                         </div>
                       )}
                     </div>
                  </div>

                  {/* Claim Details */}
                   <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-light-gray rounded-lg">
                     <div>
                       <span className="text-sm text-medium-gray">Line of Business:</span>
                       <p className="font-semibold">{selectedScenario.claim_details.line_of_business}</p>
                     </div>
                     <div>
                       <span className="text-sm text-medium-gray">Loss Type:</span>
                       <p className="font-semibold">{selectedScenario.claim_details.loss_type}</p>
                     </div>
                   </div>

                    {/* Current Action */}
                    { selectedScenario.claim_details.claim_status === 'Open' && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold">Current Simulated Action</h4>
                        <div className="flex space-x-2">
                          {!isEditingAction && selectedScenario.claim_details.claim_status === 'Open' ? (
                            <>
                              <button
                                onClick={startEditingAction}
                                className="text-xs px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                              >
                                ✏️ Edit Action
                              </button>
                              {modifiedCurrentAction && (
                                <button
                                  onClick={resetToOriginalAction}
                                  className="text-xs px-3 py-1 bg-medium-gray/10 text-medium-gray rounded hover:bg-medium-gray/20 transition-colors"
                                >
                                  🔄 Reset
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setIsEditingAction(false)}
                                className="text-xs px-3 py-1 bg-success/10 text-success rounded hover:bg-success/20 transition-colors"
                              >
                                ✅ Save
                              </button>
                              <button
                                onClick={cancelEditingAction}
                                className="text-xs px-3 py-1 bg-medium-gray/10 text-medium-gray rounded hover:bg-medium-gray/20 transition-colors"
                              >
                                ❌ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                          
                      {!isEditingAction && selectedScenario.claim_details.claim_status === 'Open' ? (
                        <div className={`p-3 rounded-lg ${modifiedCurrentAction ? 'bg-primary/5 border border-primary/20' : 'bg-light-gray'}`}>
                          {modifiedCurrentAction && (
                            <div className="text-xs text-primary mb-1 font-medium">✏️ Modified for simulation</div>
                          )}
                          <p className="text-sm text-medium-gray">
                            <strong>{getCurrentAction()?.Type}</strong> at {getCurrentAction()?.Timestamp}: {getCurrentAction()?.Description}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-warning/5 border border-warning/20 p-4 rounded-lg space-y-3">
                          <div className="text-xs text-warning mb-2 font-medium">
                            🎭 Simulation Mode - Changes are temporary
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-dark-gray mb-1">Action Type</label>
                            <input
                              type="text"
                              value={modifiedCurrentAction?.Type || ''}
                              onChange={(e) => updateModifiedAction('Type', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                              placeholder="e.g., Document Review, Investigation, Settlement"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-dark-gray mb-1">Timestamp</label>
                            <input
                              type="text"
                              value={modifiedCurrentAction?.Timestamp || ''}
                              onChange={(e) => updateModifiedAction('Timestamp', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                              placeholder="e.g., 2025-01-15 14:30"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-dark-gray mb-1">Description</label>
                            <textarea
                              value={modifiedCurrentAction?.Description || ''}
                              onChange={(e) => updateModifiedAction('Description', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                              rows={2}
                              placeholder="Detailed description of the action taken..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    )}

                    {/* Claim History */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <h4 className="text-lg font-semibold">Claim History</h4>
                          <div className="text-sm text-medium-gray mb-2">
                            {getHistoryStats().included} of {getHistoryStats().total} included
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={toggleSortOrder}
                            className="flex items-center space-x-2 text-sm text-primary hover:text-primary-dark transition-colors"
                          >
                            <span>Sort by Time</span>
                            <svg className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Filter Controls */}
                      <div className="flex items-center justify-between mb-4 p-3 bg-light-gray rounded-lg">
                        <span className="text-sm text-medium-gray">Filter Actions:</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={selectAllHistory}
                            className="text-xs px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                          >
                            Include All
                          </button>
                          <button
                            onClick={excludeAllHistory}
                            className="text-xs px-3 py-1 bg-medium-gray/10 text-medium-gray rounded hover:bg-medium-gray/20 transition-colors"
                          >
                            Exclude All
                          </button>
                        </div>
                      </div>
                                           <div className="relative">
                        {/* Timeline vertical line */}
                        <div className="absolute left-[100px] top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/50 to-primary opacity-30"></div>
                        
                        <div className="space-y-6">
                          {sortClaimHistory(selectedScenario.claim_history).map((log, displayIndex) => {
                            // Find the original index in the unsorted array
                            const unsortedIndex = selectedScenario.claim_history.findIndex(item => 
                              item.Timestamp === log.Timestamp && 
                              item.Type === log.Type && 
                              item.Description === log.Description
                            );
                            const isExcluded = excludedHistoryIndices.includes(unsortedIndex);
                            
                            // Parse timestamp for timeline display
                            const timestamp = new Date(log.Timestamp);
                            const dateStr = timestamp.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            });
                            const timeStr = timestamp.toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            });
                            
                            return (
                              <div 
                                key={`${unsortedIndex}-${log.Timestamp}`} 
                                className="relative flex items-start space-x-4"
                              >
                                {/* Timeline Date/Time Section */}
                                <div className="w-20 flex flex-col items-end text-right pt-1">
                                  <div className={`text-xs font-semibold ${
                                    isExcluded ? 'text-gray-400' : 'text-dark-gray'
                                  }`}>
                                    {dateStr}
                                  </div>
                                  <div className={`text-xs ${
                                    isExcluded ? 'text-gray-400' : 'text-medium-gray'
                                  }`}>
                                    {timeStr}
                                  </div>
                                </div>
                                
                                {/* Timeline Node */}
                                <div className="relative flex items-center justify-center w-6 h-6 mt-1">
                                  {/* Timeline dot */}
                                  <div className={`w-3 h-3 rounded-full border-2 ${
                                    isExcluded 
                                      ? 'bg-gray-200 border-gray-300' 
                                      : 'bg-white border-primary shadow-sm'
                                  }`}></div>
                                  
                                  {/* Pulse effect for active items */}
                                  {!isExcluded && (
                                    <div className="absolute w-3 h-3 bg-primary rounded-full animate-pulse opacity-20"></div>
                                  )}
                                </div>
                                
                                {/* Timeline Card Content */}
                                <div className={`flex-1 transition-all duration-300 ${
                                  isExcluded ? 'opacity-50' : ''
                                }`}>
                                  <div className={`p-4 rounded-lg border transition-all duration-300 ${
                                    isExcluded 
                                      ? 'bg-gray-50 border-gray-200 border-dashed' 
                                      : 'bg-white border-gray-200 hover:border-primary/30 hover:shadow-sm'
                                  }`}>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        {/* Action Type and Status */}
                                        <div className="flex items-center space-x-3 mb-2">
                                          <h5 className={`font-semibold ${
                                            isExcluded ? 'text-gray-500' : 'text-dark-gray'
                                          }`}>
                                            {log.Type}
                                          </h5>
                                          {isExcluded && (
                                            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-500 rounded-full">
                                              Excluded from Analysis
                                            </span>
                                          )}
                                        </div>
                                        
                                        {/* Description */}
                                        <p className={`text-sm mb-2 leading-relaxed ${
                                          isExcluded ? 'text-gray-400' : 'text-medium-gray'
                                        }`}>
                                          {log.Description}
                                        </p>
                                        
                                        {/* User attribution */}
                                        <div className={`flex items-center space-x-2 text-xs ${
                                          isExcluded ? 'text-gray-400' : 'text-medium-gray'
                                        }`}>
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                          <span>Handled by {log.User}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Checkbox for developers */}
                                      {isDev && (
                                        <div className="ml-4 pt-1">
                                          <input
                                            type="checkbox"
                                            checked={!isExcluded}
                                            onChange={() => toggleHistoryItem(unsortedIndex)}
                                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                                            title={isExcluded ? "Include in analysis" : "Exclude from analysis"}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                     </div>
                   </div>

                   
                   {/* QA Analysis Results - Inline Display */}
                    {(qaAnalysis && !showQaToast) && (
                      <div className="border-t pt-6">
                        <h4 className="text-lg font-semibold mb-4">AI Quality Assurance</h4>
                        <div className="space-y-4">
                          {/* Action Status */}
                          <div className={`p-4 rounded-lg border ${
                            qaAnalysis.current_action_score > 7 
                              ? 'bg-success/10 border-success/20' 
                              : qaAnalysis.current_action_score <= 7 &&
                                qaAnalysis.current_action_score > 4
                                ? 'bg-warning/10 border-warning/20'
                                : 'bg-error/10 border-error/20'
                          }`}>
                            <div className="flex items-center space-x-2 mb-2">
                              {qaAnalysis.current_action_score > 7 ? (
                                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : qaAnalysis.current_action_score <= 7 &&
                                qaAnalysis.current_action_score > 4 ? (
                                <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                              )}
                              <span className={`font-semibold ${qaAnalysis.current_action_score > 7 ? 'text-success' : qaAnalysis.current_action_score <= 7 &&
                                qaAnalysis.current_action_score > 4 ? 'text-warning' : 'text-error'}`}>
                                {qaAnalysis.current_action_score > 7 ? 'Action Approved' : qaAnalysis.current_action_score <= 7 &&
                                qaAnalysis.current_action_score > 4 ? 'Action Needs Review' : 'Action Needs Review'}
                              </span>
                              <span className="text-sm text-medium-gray">({qaAnalysis.current_action_score}/10)</span>
                            </div>
                            <p className="text-dark-gray">{qaAnalysis.feedback_comment}</p>
                          </div>
                          
                          {/* View Full Details Button */}
                          <button
                            onClick={() => setShowQaModal(true)}
                            className=""
                          >
                            View Full Feedback
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Claim Audit Results - Inline Display */}
                    {claimAudit && (
                      <div className="border-t pt-6">
                        <h4 className="text-lg font-semibold mb-4">Claim Audit Results</h4>
                        <div className="space-y-4">
                          {/* Overall Summary */}
                          <div className="grid grid-cols-3 gap-4 p-4 bg-light-gray rounded-lg">
                            <div className="text-center">
                              <div className="text-xl font-bold text-primary">
                                {claimAudit.workflow_step_feedback.length}
                              </div>
                              <div className="text-xs text-medium-gray">Steps Reviewed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-success">
                                {claimAudit.workflow_step_feedback.filter(step => step.is_correct).length}
                              </div>
                              <div className="text-xs text-medium-gray">Steps Correct</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-primary">
                                {(claimAudit.workflow_step_feedback.reduce((acc, step) => acc + step.score, 0) / claimAudit.workflow_step_feedback.length).toFixed(1)}
                              </div>
                              <div className="text-xs text-medium-gray">Avg Score</div>
                            </div>
                          </div>
                          
                          {/* Issues Summary */}
                          {claimAudit.workflow_step_feedback.some(step => !step.is_correct) && (
                            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                              <h5 className="font-semibold text-warning mb-2">Steps Requiring Attention:</h5>
                              <ul className="text-sm text-dark-gray space-y-1">
                                {claimAudit.workflow_step_feedback
                                  .filter(step => !step.is_correct)
                                  .map((step, index) => (
                                    <li key={index} className="flex items-center space-x-2">
                                      <span className="w-2 h-2 bg-warning rounded-full"></span>
                                      <span>{step.workflow_step} (Score: {step.score}/10)</span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* View Full Details Button */}
                          <button
                            onClick={() => setShowQaModal(true)}
                            className=""
                          >
                            View Detailed Analysis
                          </button>
                        </div>
                      </div>
                    )}
                </div>
                             ) : (
                 <div className="ai-card p-12 text-center">
                   <div className="text-6xl mb-4">🎯</div>
                   <h3 className="text-xl font-semibold text-dark-gray mb-2">Select a Claim Scenario</h3>
                   <p className="text-medium-gray">
                     Choose a claim scenario from the left panel to view details and run QA analysis.
                   </p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

     const qaToastContent = (
     showQaToast && qaAnalysis && (
       <div className="fixed bottom-4 right-4 z-50 max-w-md">
        <div className={`border rounded-lg p-4 shadow-lg backdrop-blur-sm ${
          qaAnalysis.is_action_correct 
            ? 'bg-success/10 border-success/20' 
            : 'bg-warning/10 border-warning/20'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {qaAnalysis.current_action_score > 7 ? (
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : qaAnalysis.current_action_score <= 7 &&
                    qaAnalysis.current_action_score > 4 ? (
                  <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h4 className={`text-sm font-semibold ${qaAnalysis.current_action_score > 7 ? 'text-success' : qaAnalysis.current_action_score <= 7 &&
                                qaAnalysis.current_action_score > 4 ? 'text-warning' : 'text-error'}`}>
                  {qaAnalysis.current_action_score > 7 ? 'Action Approved' : qaAnalysis.current_action_score <= 7 &&
                                qaAnalysis.current_action_score > 4 ? 'Action Needs Review' : 'Action Needs Review'}
                </h4>
                <p className="text-xs text-medium-gray mt-1">Score: {qaAnalysis.current_action_score}/10</p>
              </div>
            </div>
            <button
              onClick={() => setShowQaToast(false)}
              className="text-medium-gray hover:text-dark-gray"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3">
            <p className="text-sm text-dark-gray mb-3">{qaAnalysis.feedback_comment}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowQaModal(true);
                  setShowQaToast(false);
                }}
                className="btn-primary text-xs px-3 py-1"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
     )
   );

  return (
    <PocPageWrapper
      metadata={metadata}
      demoContent={demoContent}
      infoContent={detailsPanelContent}
      setupContent={setupPanelContent}
      modalContent={modalContent}
      fixedContent={qaToastContent}
    />
  );
}
