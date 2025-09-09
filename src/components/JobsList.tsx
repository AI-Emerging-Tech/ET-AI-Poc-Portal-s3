import React, { useState, useEffect } from 'react';
import { useJobs } from '../contexts/JobsContext';
import { getJobReport } from '../services/prospectAnalysisService';
import { formatInTimeZone } from 'date-fns-tz';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { FaTimes, FaSpinner, FaCheck, FaExclamationTriangle, FaSync, FaChevronDown, FaChevronUp, FaTrash, FaStop, FaPause, FaClock, FaPrint } from 'react-icons/fa';

interface JobsListProps {
  isOpen: boolean;
  onClose: () => void;
}

// Utility function to format dates in local timezone
const formatLocalTime = (dateString: string, formatStr: string = 'PPp') => {
  const date = new Date(dateString + 'Z'); // Append 'Z' to treat it as UTC
  // Get the browser's timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(date, timezone, formatStr);
};

export default function JobsList({ isOpen, onClose }: JobsListProps) {
  const { jobs, loadingJobs, refreshJobs, removeJob, terminateRunningJob } = useJobs();
  const [selectedReport, setSelectedReport] = useState<{ jobId: string; content: string } | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [nextRefresh, setNextRefresh] = useState(30);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<{ [key: string]: string }>({});

  // Set up auto-refresh and countdown
  useEffect(() => {
    if (!isOpen) return;

    // Reset countdown when opening
    setNextRefresh(30);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setNextRefresh(prev => {
        if (prev <= 1) {
          return 30; // Reset to 30 when reaching 0
        }
        return prev - 1;
      });
    }, 1000);

    // Refresh data every 30 seconds
    const refreshInterval = setInterval(() => {
      refreshJobs();
    }, 30000);

    // Clean up intervals on unmount or when modal closes
    return () => {
      clearInterval(countdownInterval);
      clearInterval(refreshInterval);
    };
  }, [isOpen, refreshJobs]);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await refreshJobs();
    setIsManualRefreshing(false);
    setNextRefresh(30); // Reset countdown after manual refresh
  };

  const handleViewReport = async (jobId: string) => {
    try {
      setLoadingReport(true);
      const report = await getJobReport(jobId);
      setSelectedReport({ jobId, content: report.content });
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoadingReport(false);
    }
  };

  const toggleJobExpand = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  if (!isOpen) return null;

  const statusColors = {
    queued: 'bg-purple-200',
    pending: 'bg-gray-200',
    processing: 'bg-blue-200',
    finalizing: 'bg-yellow-200',
    completed: 'bg-green-200',
    failed: 'bg-red-200',
    terminated: 'bg-orange-200'
  };

  const statusIcons = {
    queued: <FaClock className="text-purple-600" />,
    pending: <FaSpinner className="animate-spin text-gray-600" />,
    processing: <FaSpinner className="animate-spin text-blue-600" />,
    finalizing: <FaSpinner className="animate-spin text-yellow-600" />,
    completed: <FaCheck className="text-green-600" />,
    failed: <FaExclamationTriangle className="text-red-600" />,
    terminated: <FaPause className="text-orange-600" />
  };

  const handleRemoveJob = async (jobId: string) => {
    if (confirm('Are you sure you want to remove this job from the queue?')) {
      try {
        setActionLoading(prev => ({ ...prev, [jobId]: 'removing' }));
        await removeJob(jobId);
        setNextRefresh(30); // Reset countdown after action
      } catch (error) {
        console.error('Error removing job:', error);
      } finally {
        setActionLoading(prev => {
          const newState = { ...prev };
          delete newState[jobId];
          return newState;
        });
      }
    }
  };

  const handleTerminateJob = async (jobId: string) => {
    if (confirm('Are you sure you want to terminate this job? This will stop the currently running analysis.')) {
      try {
        setActionLoading(prev => ({ ...prev, [jobId]: 'terminating' }));
        await terminateRunningJob(jobId);
        setNextRefresh(30); // Reset countdown after action
      } catch (error) {
        console.error('Error terminating job:', error);
      } finally {
        setActionLoading(prev => {
          const newState = { ...prev };
          delete newState[jobId];
          return newState;
        });
      }
    }
  };

  const handleDownloadReport = async () => {
    if (selectedReport) {
      const blob = new Blob([selectedReport.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${selectedReport.jobId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Analysis Jobs</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span>Next refresh in: {nextRefresh}s</span>
              <button
                onClick={handleManualRefresh}
                disabled={isManualRefreshing}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded-full hover:bg-blue-50 transition-colors"
                title="Refresh now"
              >
                <FaSync className={isManualRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loadingJobs ? (
            <div className="flex items-center justify-center h-32">
              <FaSpinner className="animate-spin text-2xl text-blue-600" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-center text-gray-500">No jobs found</p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.jobId}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${statusColors[job.status] || 'bg-gray-200'}`} />
                        <b>Status:</b> {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        {statusIcons[job.status]}
                      </div>
                      <div className="text-sm text-gray-500">
                        Started: {formatLocalTime(job.startTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleJobExpand(job.jobId)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                        title={expandedJobs.has(job.jobId) ? "Show less" : "Show more"}
                      >
                        {expandedJobs.has(job.jobId) ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                      
                      {(job.status === 'pending' || job.status === 'queued') && (
                        <button
                          onClick={() => handleRemoveJob(job.jobId)}
                          disabled={actionLoading[job.jobId] === 'removing'}
                          className="bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                          title="Remove from queue"
                        >
                          {actionLoading[job.jobId] === 'removing' ? (
                            <><FaSpinner className="animate-spin" /> Removing...</>
                          ) : (
                            <><FaTrash /> Remove</>
                          )}
                        </button>
                      )}
                      
                      {(job.status === 'processing' || job.status === 'finalizing') && (
                        <button
                          onClick={() => handleTerminateJob(job.jobId)}
                          disabled={actionLoading[job.jobId] === 'terminating'}
                          className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded hover:bg-yellow-200 transition-colors flex items-center gap-1"
                          title="Terminate job"
                        >
                          {actionLoading[job.jobId] === 'terminating' ? (
                            <><FaSpinner className="animate-spin" /> Terminating...</>
                          ) : (
                            <><FaStop /> Terminate</>
                          )}
                        </button>
                      )}
                      
                      {job.status === 'completed' && (
                        <button
                          onClick={() => handleViewReport(job.jobId)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        >
                          View Report
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task Details */}
                  {expandedJobs.has(job.jobId) && job.taskDetails && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2">
                      <div>
                        <span className="font-bold">Task:</span>
                        <p className="text-sm text-gray-700 mt-1">{job.taskDetails.task}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-bold">Company:</span>
                          <p className="text-sm text-gray-700">{job.taskDetails.companyName}</p>
                        </div>
                        <div>
                          <span className="font-bold">Domain:</span>
                          <p className="text-sm text-gray-700">{job.taskDetails.companyDomain}</p>
                        </div>
                        <div>
                          <span className="font-bold">Line of Business:</span>
                          <p className="text-sm text-gray-700">{job.taskDetails.lineOfBusiness}</p>
                        </div>
                        <div>
                          <span className="font-bold">Submitted:</span>
                          <p className="text-sm text-gray-700">
                            {formatLocalTime(job.taskDetails.submittedAt)}
                          </p>
                        </div>
                      </div>
                      {/* {job.taskDetails.customPlan && job.taskDetails.customPlan.length > 0 && (
                        <div>
                          <span className="font-medium">Custom Plan:</span>
                          <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                            {job.taskDetails.customPlan.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )} */}
                    </div>
                  )}

                  {job.status !== 'completed' && job.status !== 'failed' && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {job.currentTask}
                      </div>
                    </div>
                  )}

                  {job.status === 'failed' && job.error && (
                    <div className="mt-2 text-red-600 text-sm">
                      Error: {job.error}
                    </div>
                  )}

                  {job.completedSteps.length > 1 && (
                    <div className="mt-2">
                      <div className="text-sm text-gray-600">Completed sub tasks:</div>
                      <ul className="list-disc list-inside text-sm text-gray-500 mt-1">
                        {job.completedSteps.slice(0,-1).map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.searchContextCount && (
                    <div className="mt-2">
                      <div className="text-sm text-gray-600">Found</div>
                      <div className="text-sm text-gray-500">{job.searchContextCount} sources</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col m-4">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold">Analysis Report</h3>
                <button
                 onClick={handleDownloadReport}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaPrint />
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                {loadingReport ? (
                  <div className="flex items-center justify-center h-32">
                    <FaSpinner className="animate-spin text-2xl text-blue-600" />
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                      {selectedReport.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}