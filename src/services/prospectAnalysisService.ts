const BASE_URL = 'https://www.valuemomentum.studio/prospect_analysis/api/prospect-analysis';

export interface CreateJobRequest {
  task: string;
  companyName: string;
  companyDomain: string;
  lineOfBusiness: string;
  planOfAction?: string[];
}

export interface JobResponse {
  jobId: string;
  status: 'queued' | 'pending' | 'processing' | 'finalizing' | 'completed' | 'failed';
  progress: number;
  currentTask: string;
  activeAgents: string[];
  completedSteps: string[];
  error?: string;
  startTime: string;
  lastUpdate: string;
  searchContextCount?: number;
  taskDetails?: {
    task: string;
    companyName: string;
    companyDomain: string;
    lineOfBusiness: string;
    customPlan?: string[];
    submittedAt: string;
  };
}

export interface JobsListResponse {
  jobs: JobResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface JobReportResponse {
  content: string;
  format: 'markdown';
}

export type FileState = {
  naicReport: File | null;
  ambestReport: File | null;
  annualReport: File | null;
  otherReports: File[];
};

export const createJob = async (formData: FormData): Promise<{ jobId: string; status: string; estimatedTime: number; createdAt: string }> => {
  const response = await fetch(`${BASE_URL}/jobs`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to create analysis job');
  }

  return response.json();
};

export const getJobStatus = async (jobId: string): Promise<JobResponse> => {
  const response = await fetch(`${BASE_URL}/jobs/${jobId}`);

  if (!response.ok) {
    throw new Error('Failed to get job status');
  }

  return response.json();
};

export const listJobs = async (params?: { status?: string; page?: number; limit?: number }): Promise<JobsListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(`${BASE_URL}/jobs?${queryParams}`);

  if (!response.ok) {
    throw new Error('Failed to list jobs');
  }

  return response.json();
};

export const getJobReport = async (jobId: string): Promise<JobReportResponse> => {
  const response = await fetch(`${BASE_URL}/jobs/${jobId}/report`);

  if (!response.ok) {
    throw new Error('Failed to get job report');
  }

  return response.json();
};

export const removeJobFromQueue = async (jobId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/jobs/${jobId}/queue`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to remove job from queue');
  }
};

export const terminateJob = async (jobId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/jobs/${jobId}/terminate`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to terminate job');
  }
};

export const getQueueStatus = async (): Promise<{ queueLength: number; estimatedWaitTime: number }> => {
  const response = await fetch(`${BASE_URL}/queue`);

  if (!response.ok) {
    throw new Error('Failed to get queue status');
  }

  return response.json();
};