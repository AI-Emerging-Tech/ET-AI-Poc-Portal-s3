'use client';
import { useState } from 'react';
import './styles-addon.css'; // Import your CSS file for styling

// Define types for migration plan data structure
interface MigrationRequirement {
  id: string;
  name: string;
  description: string;
  category: string;
  dependencies: string[];
}

interface UserStory {
  id: string;
  requirement_id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  dependencies: string[];
}

interface DevelopmentTask {
  id: string;
  user_story_id: string;
  title: string;
  description: string;
  steps: string[];
  dependencies: string[];
  files_to_work_on: string[];
  files_to_reference: string[];
}

interface MigrationPlan {
  migration_requirements: MigrationRequirement[];
  migration_user_stories: UserStory[];
  development_tasks: DevelopmentTask[];
}

interface DataModalProps {
  modalType: string;
  data: any;
  onClose: () => void;
  defaultView?: string;
}

export default function DataModal({ 
  modalType,
  data,
  onClose,
  defaultView = 'formatted'
}: DataModalProps) {
  // Set formatted view as default, or use defaultView if provided
  const [activeTab, setActiveTab] = useState<string>(defaultView);
  console.log('DataModal data:', data);
  console.log('DataModal modalType:', modalType);
  const getModalTitle = () => {
    switch (modalType) {
      case 'analysis':
        return 'Code Analysis Results';
      case 'plan':
        return 'Migration Plan';
      default:
        return 'Data View';
    }
  };
  
  const getModalDescription = () => {
    switch (modalType) {
      case 'analysis':
        return 'This is the detailed analysis of the source code structure, dependencies, and complexity.';
      case 'plan':
        return 'This is the proposed migration plan with steps to convert from source language to target language.';
      default:
        return 'Detailed information about the current process.';
    }
  };
  
  // Improved formatData function to properly handle different data types
  const formatData = (data: any): string => {
    if (!data) return 'No data available';
    
    try {
      if (Array.isArray(data)) {
        return data.map((item) => formatData(item)).join('\n\n');
      } else if (typeof data === 'object') {
        return JSON.stringify(data, null, 2);
      } else {
        return String(data);
      }
    } catch (error) {
      console.error('Error formatting data:', error);
      return 'Error formatting data';
    }
  };
  
  // State for tracking collapsed state of nodes
  const [collapsedNodes, setCollapsedNodes] = useState<{[key: string]: boolean}>({});
  
  // Toggle collapsed state of a node
  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };
  
  // Format data in a business-friendly structured way with collapsible sections
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

  // MigrationPlanView component for specialized migration plan visualization
  const MigrationPlanView = ({ data }: { data: any }) => {
    // State for tracking expanded requirements and user stories
    const [expandedRequirements, setExpandedRequirements] = useState<{[key: string]: boolean}>({});
    const [expandedUserStories, setExpandedUserStories] = useState<{[key: string]: boolean}>({});
    
    // Toggle expanded state of a requirement
    const toggleRequirement = (reqId: string) => {
      setExpandedRequirements(prev => ({
        ...prev,
        [reqId]: !prev[reqId]
      }));
    };
    
    // Toggle expanded state of a user story
    const toggleUserStory = (storyId: string) => {
      setExpandedUserStories(prev => ({
        ...prev,
        [storyId]: !prev[storyId]
      }));
    };
    
    // Check if data has the expected structure
    const hasMigrationPlanStructure = data && 
      data.migration_requirements && Array.isArray(data.migration_requirements) &&
      data.migration_user_stories && Array.isArray(data.migration_user_stories) &&
      data.development_tasks && Array.isArray(data.development_tasks);
    
    if (!hasMigrationPlanStructure) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-700">
            This doesn't appear to be a structured migration plan. Using standard view instead.
          </p>
          <div className="mt-4">
            {formatAsTree(data)}
          </div>
        </div>
      );
    }
    
    // Cast data to MigrationPlan type
    const plan = data as MigrationPlan;
    
    // Group user stories by requirement_id
    const userStoriesByRequirement = plan.migration_user_stories.reduce((acc, story) => {
      if (!acc[story.requirement_id]) {
        acc[story.requirement_id] = [];
      }
      acc[story.requirement_id].push(story);
      return acc;
    }, {} as Record<string, UserStory[]>);
    
    // Group development tasks by user_story_id
    const tasksByUserStory = plan.development_tasks.reduce((acc, task) => {
      if (!acc[task.user_story_id]) {
        acc[task.user_story_id] = [];
      }
      acc[task.user_story_id].push(task);
      return acc;
    }, {} as Record<string, DevelopmentTask[]>);
    
    // By default, expand the first requirement
    if (plan.migration_requirements.length > 0 && Object.keys(expandedRequirements).length === 0) {
      setExpandedRequirements({ [plan.migration_requirements[0].id]: true });
    }
    
    return (
      <div className="migration-plan-view bg-gray-50 rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Migration Plan</h3>
          <div className="text-sm text-gray-600">
            {plan.migration_requirements.length} Requirements · 
            {plan.migration_user_stories.length} User Stories · 
            {plan.development_tasks.length} Development Tasks
          </div>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {plan.migration_requirements.map((req) => {
            const isExpanded = expandedRequirements[req.id] || false;
            const userStories = userStoriesByRequirement[req.id] || [];
            
            return (
              <div key={req.id} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className={`p-3 flex items-center justify-between cursor-pointer ${isExpanded ? 'bg-blue-200' : 'bg-gray-50'}`}
                  onClick={() => toggleRequirement(req.id)}
                >
                  <div className="flex items-center">
                    <span className={`inline-block w-6 h-6 rounded-full mr-3 flex items-center justify-center ${isExpanded ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {isExpanded ? '-' : '+'}
                    </span>
                    <div>
                      <span className="text-sm text-gray-500">{req.id}</span>
                      <h4 className="font-semibold text-gray-800">{req.name}</h4>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {userStories.length} User {userStories.length === 1 ? 'Story' : 'Stories'}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-500 block mb-1">Description:</span>
                      <p className="text-gray-700">{req.description}</p>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-500 block mb-1">Category:</span>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{req.category}</span>
                    </div>
                    {req.dependencies.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-500 block mb-1">Dependencies:</span>
                        <div className="flex flex-wrap gap-1">
                          {req.dependencies.map(depId => (
                            <span key={depId} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{depId}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 mb-2">User Stories</h5>
                      {userStories.length === 0 ? (
                        <p className="text-gray-500 italic">No user stories for this requirement</p>
                      ) : (
                        <div className="space-y-3">
                          {userStories.map((story) => {
                            const isStoryExpanded = expandedUserStories[story.id] || false;
                            const tasks = tasksByUserStory[story.id] || [];
                            
                            return (
                              <div key={story.id} className="border border-gray-200 rounded">
                                <div 
                                  className={`p-2 flex items-center justify-between cursor-pointer ${isStoryExpanded ? 'bg-green-50' : 'bg-gray-50'}`}
                                  onClick={() => toggleUserStory(story.id)}
                                >
                                  <div className="flex items-center">
                                    <span className={`inline-block w-5 h-5 rounded-full mr-2 flex items-center justify-center text-xs ${isStoryExpanded ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                      {isStoryExpanded ? '-' : '+'}
                                    </span>
                                    <div>
                                      <span className="text-xs text-gray-500">{story.id}</span>
                                      <h6 className="font-medium text-gray-800">{story.title}</h6>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
                                  </div>
                                </div>
                                
                                {isStoryExpanded && (
                                  <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                                    <div className="mb-2">
                                      <span className="text-xs font-medium text-gray-500 block mb-1">Description:</span>
                                      <p className="text-sm text-gray-700">{story.description}</p>
                                    </div>
                                    
                                    {story.acceptance_criteria.length > 0 && (
                                      <div className="mb-2">
                                        <span className="text-xs font-medium text-gray-500 block mb-1">Acceptance Criteria:</span>
                                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                          {story.acceptance_criteria.map((criteria, idx) => (
                                            <li key={idx}>{criteria}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    
                                    {story.dependencies.length > 0 && (
                                      <div className="mb-2">
                                        <span className="text-xs font-medium text-gray-500 block mb-1">Dependencies:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {story.dependencies.map(depId => (
                                            <span key={depId} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{depId}</span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="mt-3">
                                      <h6 className="text-sm font-medium text-gray-700 mb-1">Development Tasks</h6>
                                      {tasks.length === 0 ? (
                                        <p className="text-gray-500 italic text-xs">No tasks for this user story</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {tasks.map((task) => (
                                            <div key={task.id} className="border border-gray-100 rounded p-2 bg-gray-50">
                                              <div className="flex justify-between mb-1">
                                                <span className="text-xs text-gray-500">{task.id}</span>
                                                <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                                  {task.files_to_work_on.length} {task.files_to_work_on.length === 1 ? 'File' : 'Files'}
                                                </span>
                                              </div>
                                              <h6 className="font-medium text-gray-800 text-sm">{task.title}</h6>
                                              <p className="text-xs text-gray-700 mt-1">{task.description}</p>
                                              
                                              {task.steps.length > 0 && (
                                                <div className="mt-2">
                                                  <span className="text-xs font-medium text-gray-500 block mb-1">Steps:</span>
                                                  <ol className="list-decimal list-inside text-xs text-gray-700 space-y-0.5">
                                                    {task.steps.map((step, idx) => (
                                                      <li key={idx}>{step}</li>
                                                    ))}
                                                  </ol>
                                                </div>
                                              )}
                                              
                                              {task.files_to_work_on.length > 0 && (
                                                <div className="mt-2">
                                                  <span className="text-xs font-medium text-gray-500 block mb-1">Files to Work On:</span>
                                                  <div className="flex flex-wrap gap-1">
                                                    {task.files_to_work_on.map((file, idx) => (
                                                      <span key={idx} className="inline-block bg-purple-50 text-purple-800 text-xs px-1.5 py-0.5 rounded border border-purple-100">{file}</span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              
                                              {task.files_to_reference.length > 0 && (
                                                <div className="mt-2">
                                                  <span className="text-xs font-medium text-gray-500 block mb-1">Files to Reference:</span>
                                                  <div className="flex flex-wrap gap-1">
                                                    {task.files_to_reference.map((file, idx) => (
                                                      <span key={idx} className="inline-block bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded">{file}</span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Determine if we have valid data to display
  const hasData = data && (
    (typeof data === 'object' && Object.keys(data).length > 0) || 
    (Array.isArray(data) && data.length > 0)
  );
  
  // Check if data might be a migration plan
  const isMigrationPlan = modalType === 'plan' && data && 
    typeof data === 'object' && 
    'migration_requirements' in data && 
    'migration_user_stories' in data && 
    'development_tasks' in data;
  
  // Add a third tab for migration plan view
  const shouldShowMigrationPlanTab = isMigrationPlan;
  
  return (
    <div className="data-modal-overlay">
      <div className="data-modal">
        <div className="data-modal-header">
          <h2>{getModalTitle()}</h2>
          <button 
            className="close-button"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        
        <div className="data-modal-content">
          <p className="text-gray-700 mb-4">{getModalDescription()}</p>
          
          {/* View selector tabs */}
          <div className="view-tabs mb-4">
            {shouldShowMigrationPlanTab && (
              <button 
                className={`tab-button ${activeTab === 'migration-plan' ? 'active' : ''}`}
                onClick={() => setActiveTab('migration-plan')}
              >
                Migration Plan View
              </button>
            )}
            <button 
              className={`tab-button ${activeTab === 'formatted' ? 'active' : ''}`}
              onClick={() => setActiveTab('formatted')}
            >
              Formatted View
            </button>
            <button 
              className={`tab-button ${activeTab === 'raw' ? 'active' : ''}`}
              onClick={() => setActiveTab('raw')}
            >
              Raw JSON
            </button>
          </div>
          
          {hasData ? (
            <div className="data-display">
              {activeTab === 'raw' ? (
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                  {formatData(data)}
                </pre>
              ) : activeTab === 'migration-plan' && isMigrationPlan ? (
                <MigrationPlanView data={data} />
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                  {formatAsTree(data)}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No data available to display
            </div>
          )}
        </div>
        
        <div className="data-modal-actions">
          <button
            className="modal-button bg-blue-500 text-white hover:bg-blue-600"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
