'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MigrationJob } from './MigrationApiClient';
import { formatInTimeZone } from 'date-fns-tz';

interface JobHistoryProps {
  onSelectJob: (jobId: string) => void;
  currentJobId: string;
}

export default function JobHistory({ onSelectJob, currentJobId }: JobHistoryProps) {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<MigrationJob[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const baseUrl = 'https://www.valuemomentum.studio/sdlc/api/migration/jobs';

  // Fetch jobs on component mount and every 30 seconds
  useEffect(() => {
    fetchJobs();
    
    const interval = setInterval(() => {
      fetchJobs();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(baseUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      // sort jobs by created_at in descending order
      setJobs(data.jobs.sort((a: MigrationJob, b: MigrationJob) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }));
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load job history');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!session?.user?.role || session.user.role !== 'ADMINISTRATOR') {
      setError('Only administrators can delete jobs');
      return;
    }

    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    setDeletingJobId(jobId);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/${jobId}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // Remove the job from the local state
      setJobs(prevJobs => prevJobs.filter(job => job.job_id !== jobId));
      
      // If the deleted job was the current job, reset to new job
      if (jobId === currentJobId) {
        onSelectJob('new');
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('Failed to delete job');
    } finally {
      setDeletingJobId(null);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const formatLocalTime = (dateString: string, formatStr: string = 'PPp') => {
    const date = new Date(dateString + 'Z'); // Append 'Z' to treat it as UTC
    // Get the browser's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return formatInTimeZone(date, timezone, formatStr);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isExpanded) {
    return (
      <div className="job-history-collapsed">
        <button 
          className="expand-history-btn"
          onClick={toggleExpand}
        >
          Show Job History ({jobs.length})
        </button>
      </div>
    );
  }

  return (
    <div className="job-history">
      <div className="job-history-header">
        <h3>Job History</h3>
        <button 
          className="collapse-history-btn"
          onClick={toggleExpand}
        >
          Hide
        </button>
      </div>
      
      {isLoading && <div className="loading">Loading job history...</div>}
      
      {error && <div className="error">{error}</div>}
      
      {!isLoading && !error && jobs.length === 0 && (
        <div className="no-jobs">No previous jobs found</div>
      )}
      
      {!isLoading && !error && jobs.length > 0 && (
        <div className="jobs-list">
          <div className="jobs-list-header">
            <div className="job-id">Migration Job</div>
            <div className="job-status">Status</div>
            <div className="job-phase">Phase</div>
            <div className="job-date">Created</div>
            <div className="job-actions">Actions</div>
          </div>
          
          {jobs.map(job => (
            <div 
              key={job.job_id} 
              className={`job-item ${job.job_id === currentJobId ? 'current-job' : ''}`}
            >
              <div className="job-id" title={job.job_id}>
                {`${job.source_lang} to ${job.target_lang} (${job.job_id})`}
              </div>
              <div className="job-status">
                <span className={`status-badge ${getStatusBadgeClass(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="job-phase">
                {job.current_phase || 'N/A'}
              </div>
              <div className="job-date">
                {formatLocalTime(job.created_at)}
              </div>
              <div className="job-actions">
                <button 
                  className="view-job-btn"
                  onClick={() => {
                    onSelectJob(job.job_id)
                    setIsExpanded(false);
                  }}
                  disabled={job.job_id === currentJobId}
                >
                  {job.job_id === currentJobId ? 'Current' : 'View'}
                </button>
                {session?.user?.role === 'ADMINISTRATOR' && (
                <button 
                  className="delete-job-btn"
                  onClick={() => deleteJob(job.job_id)}
                  disabled={deletingJobId === job.job_id || isLoading}
                  title="Delete"
                >
                  {deletingJobId === job.job_id ? 'Deleting...' : 'Delete'}
                </button>
                )}
              </div>
              
            </div>
          ))}
        </div>
      )}
      
      <div className="refresh-jobs">
        <button 
          className="refresh-btn"
          onClick={fetchJobs}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
        <button 
          className="refresh-btn"
          onClick={() => onSelectJob('new')}
          disabled={isLoading}
        >
          {'New Job'}
        </button>
      </div>
    </div>
  );
} 