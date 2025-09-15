'use client';
import { useState } from 'react';

interface StatusPanelProps {
  state: {
    status: string;
    analysis_result: object;
    detailed_analysis?: object;
    current_phase: string;
    files: string[];
    generated_files: any[];
    migration_plan: any[];
    refactored_files: any[];
    embedding_ready: boolean;
    errors: any[];
    progress?: number;
  };
}

export default function StatusPanel({ state }: StatusPanelProps) {
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const getStatusBadgeClass = () => {
    switch (state.status) {
      case 'processing':
        return 'status-processing';
      case 'completed':
        return 'status-completed';
      case 'error':
        return 'status-error';
      case 'paused':
        return 'status-paused';
      default:
        return 'status-idle';
    }
  };

  const formatPhaseDisplay = (phase: string) => {
    if (!phase) return 'Not Started';
    
    // Convert snake_case to Title Case
    return phase
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate progress percentage
  const progressPercentage = state.progress !== undefined 
    ? `${state.progress}%`
    : state.status === 'completed' 
      ? '100%' 
      : state.status === 'processing' 
        ? '50%' 
        : '0%';

  const toggleDetailedAnalysis = () => {
    setShowDetailedAnalysis(!showDetailedAnalysis);
  };

  const toggleErrors = () => {
    setShowErrors(!showErrors);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (isCollapsed) {
    return (
      <div className="status-panel-collapsed">
        <div className="status-header" onClick={toggleCollapse}>
          <h3>Status Panel</h3>
          <div className="flex items-center gap-2">
            <span className={`status-badge ${getStatusBadgeClass()}`}>
              {state.status.toUpperCase()}
            </span>
            <button className="expand-btn">▼</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="status-panel">
      <div className="status-header" onClick={toggleCollapse}>
        <h3>Status Panel</h3>
        <button className="collapse-btn">▲</button>
      </div>

      <div className="status-section status-and-progress">
        <div className="status-info">
          <h3>Migration Status</h3>
          <div className="flex items-center gap-2">
            <span className={`status-badge ${getStatusBadgeClass()}`}>
              {state.status.toUpperCase()}
            </span>
            {state.current_phase && (
              <span className="text-sm text-gray-500">
                Current phase: {formatPhaseDisplay(state.current_phase)}
              </span>
            )}
          </div>
        </div>

        <div className="progress-info">
          <h3>Migration Progress</h3>
          <div className="progress-status-bar-container">
            <div className="progress-status-bar">
              <div 
                className="progress-status-bar-fill" 
                style={{ 
                  width: progressPercentage
                }}
              />
            </div>
            <div className="progress-status-text">
              {progressPercentage}
            </div>
          </div>
        </div>
      </div>

      {state.errors && state.errors.length > 0 && (
        <div className="status-section">
          <div 
            className="errors-header flex items-center justify-between cursor-pointer" 
            onClick={toggleErrors}
          >
            <h3>Errors <span className="error-count">({state.errors.length})</span></h3>
            <span className="error-toggle">{showErrors ? '▲' : '▼'}</span>
          </div>
          
          {showErrors && (
            <ul className="error-list">
              {state.errors.map((error, index) => (
                <li key={index} className="text-red-500">
                  {error.message || error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
