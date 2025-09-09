'use client';

import { useState, useEffect, useRef } from 'react';
import MigrationApiClient from './MigrationApiClient';
import './promptEditor.css';

interface PromptTemplateEditorFlatListProps {
  onSave?: (templateName: string, promptText: string) => Promise<void>;
  onError?: (error: Error) => void;
  onDocFormatChange?: (format: 'md' | 'doxy') => void;
  onEndPhaseChange?: (endPhase: EndPhase) => void;
  currentDocFormat?: 'md' | 'doxy';
  currentEndPhase?: EndPhase;
}

// Define documentation format types
type DocFormat = 'markdown' | 'doxygen';

// Map between UI format names and API format values
const formatMapping = {
  'markdown': 'md' as const,
  'doxygen': 'doxy' as const
};

// Define end phase options
type EndPhase = 'embed' | 'analyze' | 'document' | 'plan' | 'execute' | 'refactor' | 'test' | 'finalize';

// Define which prompts are used for each documentation format
const markdownDocPrompts = [
  'technical_documentation_prompt',
  'business_logic_prompt',
  'functional_documentation_prompt',
  'architecture_prompt',
  'process_flow_prompt',
  'codebase_critique_prompt',
];

const doxygenDocPrompts = [
  'technical_documentation_doxy_prompt',
  'functional_documentation_doxy_prompt',
  'summary_doxy_prompt',
  'component_diagram_doxy_prompt',
];

// The common prompt used in both formats
const commonDocPrompt = 'documenter_prompt';

// All documentation-related prompts that will be filtered based on format
const allDocPrompts = [
  ...markdownDocPrompts,
  ...doxygenDocPrompts,
  commonDocPrompt
];

export default function PromptTemplateEditorFlatList({ 
  onSave, 
  onError, 
  onDocFormatChange,
  onEndPhaseChange,
  currentDocFormat = 'md',
  currentEndPhase = 'finalize'
}: PromptTemplateEditorFlatListProps) {
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [originalTemplates, setOriginalTemplates] = useState<Record<string, string>>({});
  const [promptTexts, setPromptTexts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [saveMessages, setSaveMessages] = useState<Record<string, { type: 'success' | 'error', text: string } | null>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Convert API format ('md'/'doxy') to UI format ('markdown'/'doxygen')
  const [docFormat, setDocFormat] = useState<DocFormat>(currentDocFormat === 'doxy' ? 'doxygen' : 'markdown');
  const [endPhase, setEndPhase] = useState<EndPhase>(currentEndPhase);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const apiClient = useRef(new MigrationApiClient());

  // Update internal format when currentDocFormat prop changes
  useEffect(() => {
    setDocFormat(currentDocFormat === 'doxy' ? 'doxygen' : 'markdown');
  }, [currentDocFormat]);

  // Update internal endPhase when currentEndPhase prop changes
  useEffect(() => {
    setEndPhase(currentEndPhase);
  }, [currentEndPhase]);

  // Check for dark mode on component mount and when it changes in parent
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.body.classList.contains('dark-mode-ams');
      setIsDarkMode(isDark);
    };

    // Initial check
    checkDarkMode();

    // Set up mutation observer to watch for class changes on body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.body, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load templates when component mounts
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.current.getDefaultPromptTemplates();
        
        // Store original templates for reference
        setOriginalTemplates(response.prompt_templates);
        setTemplates(response.prompt_templates);
        
        // Initialize promptTexts with all templates
        const initialPromptTexts: Record<string, string> = {};
        Object.entries(response.prompt_templates).forEach(([name, text]) => {
          initialPromptTexts[name] = text;
        });
        setPromptTexts(initialPromptTexts);
        
        // Initialize saving states
        const initialSavingStates: Record<string, boolean> = {};
        Object.keys(response.prompt_templates).forEach(name => {
          initialSavingStates[name] = false;
        });
        setSavingStates(initialSavingStates);
        
        // Initialize save messages
        const initialSaveMessages: Record<string, { type: 'success' | 'error', text: string } | null> = {};
        Object.keys(response.prompt_templates).forEach(name => {
          initialSaveMessages[name] = null;
        });
        setSaveMessages(initialSaveMessages);
        if (onSave) {
          Object.keys(response.prompt_templates).forEach(async name => {
            await onSave(name, response.prompt_templates[name]);
          });
        }
        
      } catch (error) {
        console.error('Failed to load prompt templates:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Handle prompt text changes
  const handlePromptChange = (templateName: string, newText: string) => {
    setPromptTexts(prev => ({
      ...prev,
      [templateName]: newText
    }));
    setSaveMessages(prev => ({
      ...prev,
      [templateName]: null
    }));
  };

  // Save updated prompt template (locally only)
  const handleSave = async (templateName: string) => {
    setSavingStates(prev => ({
      ...prev,
      [templateName]: true
    }));
    setSaveMessages(prev => ({
      ...prev,
      [templateName]: null
    }));
    
    try {
      const promptText = promptTexts[templateName];
      
      // Update local state only - no API call
      setTemplates(prev => ({
        ...prev,
        [templateName]: promptText
      }));
      
      setSaveMessages(prev => ({
        ...prev,
        [templateName]: { type: 'success', text: 'Saved locally!' }
      }));
      
      if (onSave) {
        await onSave(templateName, promptText);
      }
    } catch (error) {
      console.error(`Failed to save prompt template ${templateName}:`, error);
      setSaveMessages(prev => ({
        ...prev,
        [templateName]: { type: 'error', text: 'Failed to save' }
      }));
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setSavingStates(prev => ({
        ...prev,
        [templateName]: false
      }));
      
      // Clear save message after 3 seconds
      setTimeout(() => {
        setSaveMessages(prev => ({
          ...prev,
          [templateName]: null
        }));
      }, 3000);
    }
  };

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle documentation format change
  const handleDocFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormat = e.target.value as DocFormat;
    setDocFormat(newFormat);
    
    // Call the parent's onDocFormatChange handler with the API format
    if (onDocFormatChange) {
      onDocFormatChange(formatMapping[newFormat]);
    }
  };

  // Handle end phase change
  const handleEndPhaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEndPhase = e.target.value as EndPhase;
    setEndPhase(newEndPhase);
    
    // Call the parent's onEndPhaseChange handler
    if (onEndPhaseChange) {
      onEndPhaseChange(newEndPhase);
    }
  };

  // Get active documentation prompts based on selected documentation format
  const getActiveDocPrompts = () => {
    if (docFormat === 'markdown') {
      return [...markdownDocPrompts, commonDocPrompt];
    } else {
      return [...doxygenDocPrompts, commonDocPrompt];
    }
  };

  // Check if a prompt should be displayed based on documentation format
  const shouldDisplayPrompt = (promptName: string) => {
    // If it's not a documentation prompt, always display it
    if (!allDocPrompts.includes(promptName)) {
      return true;
    }
    
    // If it is a documentation prompt, only display if it's in the active list
    return getActiveDocPrompts().includes(promptName);
  };

  // Filter templates based on search query and documentation format
  const filteredTemplateNames = Object.keys(templates).filter(name => {
    // First check if it matches the search query
    const matchesSearch = searchQuery === '' || name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Then check if it should be included based on the doc format filter
    const passesFormatFilter = shouldDisplayPrompt(name);
    
    return matchesSearch && passesFormatFilter;
  });

  // Get count of documentation prompts being displayed
  const displayedDocPromptsCount = filteredTemplateNames.filter(name => 
    allDocPrompts.includes(name)
  ).length;

  // Get total count of documentation prompts for the selected format
  const totalDocPromptsCount = getActiveDocPrompts().length;

  if (isLoading) {
    return <div className="text-center p-4 prompt-editor-loading">Loading prompt templates...</div>;
  }

  return (
    <div className={`prompt-template-editor ${isDarkMode ? 'prompt-editor-dark' : 'prompt-editor-light'}`}>
      <h3 className="text-xl font-semibold mb-4 prompt-editor-title">Prompt Templates</h3>
      <p className="mb-4 prompt-editor-description">
        Edit templates that control agent behavior during code migration.
      </p>

      {/* Configuration options */}
      <div className="mb-6 p-4 rounded-md border prompt-editor-config-panel">
        <h4 className="text-md font-medium mb-3 prompt-editor-section-title">Configuration</h4>
        
        {/* Documentation format selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 prompt-editor-label">
            Documentation Format
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center prompt-editor-radio-label">
              <input
                type="radio"
                className="prompt-editor-radio"
                name="docFormat"
                value="markdown"
                checked={docFormat === 'markdown'}
                onChange={handleDocFormatChange}
              />
              <span className="ml-2">Markdown</span>
            </label>
            <label className="inline-flex items-center prompt-editor-radio-label">
              <input
                type="radio"
                className="prompt-editor-radio"
                name="docFormat"
                value="doxygen"
                checked={docFormat === 'doxygen'}
                onChange={handleDocFormatChange}
              />
              <span className="ml-2">Doxygen</span>
            </label>
          </div>
        </div>
        
        {/* End phase selector */}
        <div>
          <label htmlFor="end-phase" className="block text-sm font-medium mb-1 prompt-editor-label">
            End Phase
          </label>
          <select
            id="end-phase"
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none prompt-editor-select"
            value={endPhase}
            onChange={handleEndPhaseChange}
          >
            <option value="analyze">Analyze</option>
            <option value="document">Document</option>
            <option value="plan">Plan</option>
            {/* <option value="execute">Execute</option> */}
            {/* <option value="refactor">Refactor</option>
            <option value="test">Test</option> */}
            <option value="finalize">Execute & Finalize</option>
          </select>
        </div>
      </div>

      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search templates..."
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none prompt-editor-search"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      
      {/* Template count display */}
      <div className="mb-4 text-sm prompt-editor-count">
        Showing {filteredTemplateNames.length} templates 
      </div>
      
      <div className="space-y-8 mb-4 max-h-[60vh] overflow-y-auto pr-2 prompt-editor-template-list">
        {filteredTemplateNames.length > 0 ? (
          filteredTemplateNames.map(templateName => (
            <div key={templateName} className={`border rounded-md p-4 prompt-editor-template-item ${allDocPrompts.includes(templateName) ? 'prompt-editor-doc-template' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-medium prompt-editor-template-name break-all">{templateName}</h4>
                <div className="flex items-center">
                  {saveMessages[templateName] && (
                    <span className={`mr-3 text-sm ${
                      saveMessages[templateName]?.type === 'success' 
                        ? 'prompt-editor-success' 
                        : 'prompt-editor-error'
                    }`}>
                      {saveMessages[templateName]?.text}
                    </span>
                  )}
                  <button
                    className="px-3 py-1 text-sm rounded hover:bg-blue-700 disabled:bg-blue-300 prompt-editor-save-btn"
                    onClick={() => handleSave(templateName)}
                    disabled={savingStates[templateName]}
                  >
                    {savingStates[templateName] ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
              <textarea
                className="w-full h-40 px-3 py-2 border rounded-md shadow-sm focus:outline-none font-mono text-sm prompt-editor-textarea"
                value={promptTexts[templateName] || ''}
                onChange={(e) => handlePromptChange(templateName, e.target.value)}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-8 prompt-editor-no-results">
            No templates found matching your search.
          </div>
        )}
      </div>
    </div>
  );
} 