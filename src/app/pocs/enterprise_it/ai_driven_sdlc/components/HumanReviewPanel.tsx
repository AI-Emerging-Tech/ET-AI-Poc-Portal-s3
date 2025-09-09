'use client';
import { useState } from 'react';
import './styles-addon.css'

interface HumanReviewPanelProps {
  reviewType: string;
  onSubmitFeedback: (decision: 'approved' | 'refine' | 'reject' | 'cancel', feedback?: string) => void;
  state: any;
}

export default function HumanReviewPanel({ 
  reviewType,
  onSubmitFeedback,
  state
}: HumanReviewPanelProps) {
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<'approved' | 'refine' | 'reject' | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<{[key: string]: boolean}>({});
  
  const getReviewTitle = () => {
    switch (reviewType) {
      case 'human_review_analysis':
        return 'Review Code Analysis';
      case 'human_review_plan':
        return 'Review Migration Plan';
      case 'human_review_implementation':
        return 'Review Implementation';
      default:
        return 'Review';
    }
  };
  
  const getReviewDescription = () => {
    switch (reviewType) {
      case 'human_review_analysis':
        return 'Please review the code analysis and structure detection results. You can approve to continue with the migration plan or request refinements.';
      case 'human_review_plan':
        return 'Please review the proposed migration plan including technology choices and implementation strategy. You can approve to continue with code generation or request refinements.';
      case 'human_review_implementation':
        return 'Please review the code implementation. You can approve to proceed with testing or request refinements to the generated code.';
      default:
        return 'Please review the current step and provide feedback.';
    }
  };

  
  let currentSample;

  if (reviewType === 'human_review_analysis') {
    currentSample = state.analysis_result
  }
  else if (reviewType === 'human_review_plan') {
    currentSample = state.migration_plan;
  } else if (reviewType === 'human_review_implementation') {
    currentSample = state.generated_files;
  } else {
    return null; // or handle other cases
  }
  
  const handleSubmitFeedback = () => {
    if (!selectedDecision) {
      alert('Please select a decision (Approve or Refine)');
      return;
    }
    
    onSubmitFeedback(selectedDecision, feedbackText);
  };
  
  // Toggle collapsed state of a node
  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const formatAsTree = (data: any, level = 0, path = ''): JSX.Element => {
    // Handle null, undefined or empty values
    if (data === null || data === undefined) {
      return <div className="ml-4 text-gray-500 italic">No data available</div>;
    }
    
    try {
      // Handle arrays with special formatting
      if (Array.isArray(data)) {
        if (data.length === 0) {
          return <div className="ml-4 text-gray-500 italic">Empty list</div>;
        }
        
        // Create a unique ID for this array node
        const nodeId = `array-${path}-${level}`;
        const isCollapsed = collapsedNodes[nodeId] || false;
        
        // Get a preview of the array contents
        const arrayPreview = `${data.length} item${data.length > 1 ? 's' : ''}`;
        
        return (
          <div className="ml-4">
            {level > 0 && (
              <div 
                className="collapsible-header flex items-center cursor-pointer py-1 hover:bg-gray-50 rounded" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(nodeId);
                }}
              >
                <span className="mr-2 text-gray-500 transform transition-transform duration-200" style={{ display: 'inline-block', width: '12px' }}>
                  {isCollapsed ? '▶' : '▼'}
                </span>
                <span className="text-blue-600 font-medium">{arrayPreview}</span>
              </div>
            )}
            
            {!isCollapsed && data.map((item, index) => (
              <div key={index} className="mt-3 pb-2 border-b border-gray-100">
                <div className="font-medium text-blue-800 flex items-center gap-2">
                  <span className="inline-block w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center">{index + 1}</span>
                  <span>{typeof item === 'object' && item !== null ? (item.name || item.title || item.id || `Item ${index + 1}`) : `Item ${index + 1}`}</span>
                </div>
                {formatAsTree(item, level + 1, `${path}-${index}`)}
              </div>
            ))}
          </div>
        );
      } 
      // Handle objects with enhanced formatting
      else if (typeof data === 'object') {
        const entries = Object.entries(data);
        if (entries.length === 0) {
          return <div className="ml-4 text-gray-500 italic">Empty object</div>;
        }
        
        // Format the key name (to uppercase and remove special characters)
        const formatKey = (key: string): string => {
          return key
            .replace(/_/g, ' ') // Replace underscores with spaces
            .toUpperCase(); // Convert to uppercase
        };
        
        // Create a node ID for the object
        const nodeId = `object-${path}-${level}`;
        
        // Create a simplified view of object properties without grouping
        return (
          <div className="ml-4">
            {level > 0 && entries.length > 3 && (
              <div 
                className="collapsible-header flex items-center cursor-pointer py-1 hover:bg-gray-50 rounded" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(nodeId);
                }}
              >
                <span className="mr-2 text-gray-500 transform transition-transform duration-200" style={{ display: 'inline-block', width: '12px' }}>
                  {collapsedNodes[nodeId] ? '▶' : '▼'}
                </span>
                <span className="text-blue-600 font-medium">{entries.length} properties</span>
              </div>
            )}
            
            {!collapsedNodes[nodeId] && entries.map(([key, value], index) => {
              const isObject = typeof value === 'object' && value !== null;
              const fieldId = `${nodeId}-${key}`;
              const isFieldCollapsed = collapsedNodes[fieldId] || false;
              
              return (
                <div key={key} className="mt-2 mb-2">
                  <div className="font-semibold text-gray-700 flex items-center">
                    {formatKey(key)}:
                    
                    {/* Only show collapse toggle for objects */}
                    {isObject && (
                      <button
                        className="ml-2 text-xs text-gray-500 hover:text-gray-700 focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapse(fieldId);
                        }}
                      >
                        <span className="transform transition-transform duration-200" style={{ display: 'inline-block', width: '12px' }}>
                          {isFieldCollapsed ? '▶' : '▼'}
                        </span>
                      </button>
                    )}
                  </div>
                  
                  {!isFieldCollapsed && (
                    <div className={`pl-4 ${isObject ? 'pt-1' : ''}`}>
                      {formatAsTree(value, level + 1, `${path}-${key}`)}
                    </div>
                  )}
                  
                  {index < entries.length - 1 && <div className="border-b border-gray-100 mt-2"></div>}
                </div>
              );
            })}
          </div>
        );
      } 
      // Handle primitive values with appropriate formatting
      else {
        const val = String(data);
        if (val === '') {
          return <div className="ml-4 text-gray-500 italic">Empty string</div>;
        }

        // Format different types of values
        if (typeof data === 'string') {
          // Check if it's a date string
          const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
          if (dateRegex.test(val)) {
            try {
              const date = new Date(val);
              return <div className="ml-4 text-indigo-700">{date.toLocaleString()}</div>;
            } catch {
              return <div className="ml-4 text-gray-700">"{val}"</div>;
            }
          }
          
          // Check if it's a URL
          const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
          if (urlRegex.test(val)) {
            return (
              <div className="ml-4">
                <a href={val} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800 underline">
                  {val}
                </a>
              </div>
            );
          }
          
          return <div className="ml-4 text-gray-700">"{val}"</div>;
        } 
        else if (typeof data === 'number') {
          return <div className="ml-4 text-green-700 font-mono">{val}</div>;
        } 
        else if (typeof data === 'boolean') {
          return (
            <div className="ml-4">
              <span className={`px-2 py-1 rounded-full text-xs ${data ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {val}
              </span>
            </div>
          );
        } 
        else {
          return <div className="ml-4 text-gray-700">{val}</div>;
        }
      }
    } catch (error) {
      console.error('Error formatting tree data:', error);
      return <div className="text-red-500">Error formatting data: {String(error)}</div>;
    }
  };
  
  return (
    <div className="human-review-overlay">
      <div className="human-review-panel">
        <div className="review-header">
          <h2>{getReviewTitle()}</h2>
        </div>
        
        <div className="review-content">
          <p className="text-gray-700 mb-4">{getReviewDescription()}</p>
          
          {currentSample && (
            <div className="review-difference">
              {/* <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">{currentSample.title}</h3>
                <p className="text-gray-600">{currentSample.description}</p>
              </div> */}
              <div className="p-4">
                <pre className="whitespace-pre-wrap text-sm">
                  <div className="bg-gray-300 p-4 rounded-lg overflow-auto max-h-96">
                    {formatAsTree(currentSample)}
                  </div>
                </pre>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">Your Decision</h4>
            <div className="flex gap-4 mb-4">
              <button 
                className={`review-button ${selectedDecision === 'approved' ? 'bg-green-500' : 'bg-green-900'}`}
                onClick={() => setSelectedDecision('approved')}
              >
                <span>
                  Approve
                </span>
              </button>
              {/* <button 
                className={`review-button ${selectedDecision === 'reject' ? 'bg-red-600' : 'bg-red-900'}`}
                onClick={() => setSelectedDecision('reject')}
              >
                Reject
              </button> */}
              <button 
                className={`review-button ${selectedDecision === 'refine' ? 'bg-yellow-600' : 'bg-yellow-900'}`}
                onClick={() => setSelectedDecision('refine')}
              >
                Request Refinements
              </button>
            </div>
            
            {selectedDecision && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (required for Refinements)
                </label>
                <textarea
                  className="feedback-input"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={selectedDecision === 'refine' 
                    ? "Please provide specific feedback on what needs to be refined..."
                    : "Additional comments (optional)"}
                  required={selectedDecision === 'refine'}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="review-actions">
          <button
            className="review-button bg-gray-300 text-gray-700 hover:bg-gray-400"
            onClick={() => onSubmitFeedback('cancel')}
          >
            Cancel
          </button>
          <button
            className="review-button bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleSubmitFeedback}
            disabled={selectedDecision === 'refine' && !feedbackText.trim()}
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
