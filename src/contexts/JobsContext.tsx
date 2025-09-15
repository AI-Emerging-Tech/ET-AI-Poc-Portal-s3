'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { JobResponse, JobsListResponse, listJobs, getJobStatus, removeJobFromQueue, terminateJob } from 'services/prospectAnalysisService';

interface JobsContextType {
  jobs: JobResponse[];
  runningJobs: JobResponse[];
  loadingJobs: boolean;
  error: string | null;
  refreshJobs: () => Promise<void>;
  addJob: (job: JobResponse) => void;
  updateJobStatus: (jobId: string) => Promise<JobResponse>;
  removeJob: (jobId: string) => Promise<void>;
  terminateRunningJob: (jobId: string) => Promise<void>;
  totalJobs: number;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingIntervals, setPollingIntervals] = useState<{ [key: string]: NodeJS.Timeout }>({});

  const refreshJobs = useCallback(async () => {
    try {
      setLoadingJobs(false);
      const response = await listJobs();
      setJobs(response.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const addJob = useCallback((job: JobResponse) => {
    setJobs(prev => [job, ...prev]);
  }, []);

  const updateJobStatus = useCallback(async (jobId: string) => {
    try {
      const updatedJob = await getJobStatus(jobId);
      setJobs(prev => 
        prev.map(job => job.jobId === jobId ? updatedJob : job)
      );
      return updatedJob;
    } catch (err) {
      console.error('Failed to update job status:', err);
      throw err;
    }
  }, []);

  const removeJob = useCallback(async (jobId: string) => {
    try {
      await removeJobFromQueue(jobId);
      setJobs(prev => prev.filter(job => job.jobId !== jobId));
      return;
    } catch (err) {
      console.error('Failed to remove job:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove job from queue');
      throw err;
    }
  }, []);

  const terminateRunningJob = useCallback(async (jobId: string) => {
    try {
      await terminateJob(jobId);
      // After terminating, update job status
      await updateJobStatus(jobId);
      return;
    } catch (err) {
      console.error('Failed to terminate job:', err);
      setError(err instanceof Error ? err.message : 'Failed to terminate running job');
      throw err;
    }
  }, [updateJobStatus]);

  // Initialize polling for running jobs
  useEffect(() => {
    const pollJob = async (jobId: string) => {
      try {
        const updatedJob = await updateJobStatus(jobId);
        
        // Adjust polling interval based on status
        let newInterval = 5000; // Default 5s
        if (['completed', 'failed', 'terminated'].includes(updatedJob.status)) {
          clearInterval(pollingIntervals[jobId]);
          setPollingIntervals(prev => {
            const newIntervals = { ...prev };
            delete newIntervals[jobId];
            return newIntervals;
          });
          return;
        }

        // Increase interval if no progress
        if (updatedJob.progress === jobs.find(j => j.jobId === jobId)?.progress) {
          newInterval = Math.min((pollingIntervals[jobId] ? (parseInt(pollingIntervals[jobId].toString()) || 5000) : 5000) * 2, 30000);
        }

        // Update polling interval
        setPollingIntervals(prev => ({
          ...prev,
          [jobId]: setInterval(() => pollJob(jobId), newInterval)
        }));

      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error);
      }
    };

    // Start polling for running jobs
    const runningJobIds = jobs
      .filter(job => !['completed', 'failed', 'terminated'].includes(job.status))
      .map(job => job.jobId);

    runningJobIds.forEach(jobId => {
      if (!pollingIntervals[jobId]) {
        const interval = setInterval(() => pollJob(jobId), 5000);
        setPollingIntervals(prev => ({
          ...prev,
          [jobId]: interval
        }));
      }
    });

    // Cleanup intervals on unmount
    return () => {
      Object.values(pollingIntervals).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [jobs, pollingIntervals, updateJobStatus]);

  // Initial jobs fetch
  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  const runningJobs = jobs.filter(
    job => !['completed', 'failed', 'terminated'].includes(job.status)
  );

  const value = {
    jobs,
    runningJobs,
    loadingJobs,
    error,
    refreshJobs,
    addJob,
    updateJobStatus,
    removeJob,
    terminateRunningJob,
    totalJobs: jobs.length
  };

  return (
    <JobsContext.Provider value={value}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
}