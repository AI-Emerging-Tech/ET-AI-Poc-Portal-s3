'use client';

export interface MigrationJob {
  job_id: string;
  status: string;
  current_phase: string;
  progress: number;
  created_at: string;
  updated_at: string;
  source_lang: string;
  target_lang: string;
}

export interface MigrationState {
  job_id?: string;
  status: string;
  current_phase: string;
  files?: any[];
  analysis_result?: Record<string, any>;
  detailed_analysis?: Record<string, any>;
  source_info?: any;
  generated_files?: any[];
  refactored_files?: any[];
  embedding_ready?: boolean;
  errors?: any[];
  migration_plan?: any[];
}

export interface MigrationOptions {
  preserveComments?: boolean;
  generateTests?: boolean;
  modernizeArchitecture?: boolean;
  additionalConfig?: Record<string, any>;
  documentation_format?: 'md' | 'doxy';
  prompt_templates?: Record<string, string>;
  end_phase?: string;
}

class MigrationApiClient {
  private baseUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeoutMs: number = 3000;

  constructor(baseUrl = 'https://www.valuemomentum.studio/sdlc/api/migration/jobs') {
    this.baseUrl = baseUrl;
  }

  /**
   * List all migration jobs
   * @returns Promise containing list of jobs
   */
  async listJobs(): Promise<MigrationJob[]> {
    const response = await fetch(this.baseUrl);

    if (!response.ok) {
      throw new Error(`Failed to list jobs: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get detailed information about a specific job
   * @param jobId Job identifier
   * @returns Promise containing detailed job information
   */
  async getJobDetails(jobId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${jobId}`);

    if (!response.ok) {
      throw new Error(`Failed to get job details: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Start a new migration job
   * @param file Zip file containing source code
   * @param sourceLanguage Source programming language
   * @param targetLanguage Target programming language
   * @param options Additional migration options
   * @param documentationFormat Documentation format ('md' or 'doxy')
   * @param promptTemplates Custom prompt templates
   * @param endPhase End phase for the migration
   * @returns Promise containing job ID and status
   */
  async startMigration(
    file: File,
    sourceLanguage: string,
    targetLanguage: string,
    options: MigrationOptions = {},
    documentationFormat: 'md' | 'doxy' = 'md',
    promptTemplates?: Record<string, string>,
    endPhase: string = 'finalize'
  ): Promise<{ job: {job_id: string; status: string }}> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_lang', sourceLanguage);
    formData.append('target_lang', targetLanguage);
    formData.append('documentation_format', documentationFormat);
    
    // Add documentation format to options
    options.documentation_format = documentationFormat;
    options.end_phase = endPhase;
    
    // Add prompt templates if provided
    if (promptTemplates && Object.keys(promptTemplates).length > 0) {
      options.prompt_templates = promptTemplates;
      formData.append('prompt_templates', JSON.stringify(promptTemplates));
    }
    formData.append('end_phase', endPhase)
      
    // formData.append('options', JSON.stringify(options));
    console.log('formData', formData);
    
    // Uncomment the actual API call and remove the mock return
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to start migration: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get the current status of a migration job
   * @param jobId Job identifier
   * @returns Promise containing job status information
   */
  async getMigrationStatus(jobId: string): Promise<MigrationJob> {
    const response = await fetch(`${this.baseUrl}/${jobId}/status`);

    if (!response.ok) {
      throw new Error(`Failed to get migration status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get all checkpoints for a job
   * @param jobId Job identifier
   * @returns Promise containing list of checkpoints
   */
  async getJobCheckpoints(jobId: string): Promise<{checkpoints: any[]}> {
    const response = await fetch(`${this.baseUrl}/${jobId}/checkpoints`);

    if (!response.ok) {
      throw new Error(`Failed to get checkpoints: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Pause a running job
   * @param jobId Job identifier
   * @returns Promise containing response
   */
  async pauseJob(jobId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${jobId}/pause`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to pause job: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Resume a paused job
   * @param jobId Job identifier
   * @param checkpointId Optional checkpoint to resume from
   * @param documentationFormat Documentation format ('md' or 'doxy')
   * @param promptTemplates Custom prompt templates
   * @param endPhase End phase for the migration
   * @returns Promise containing response
   */
  async resumeJob(
    jobId: string, 
    checkpointId?: string,
    documentationFormat: 'md' | 'doxy' = 'md',
    promptTemplates?: Record<string, string>,
    endPhase: string = 'finalize'
  ): Promise<any> {
    const body: any = {
      documentation_format: documentationFormat,
      end_phase: endPhase
    };
    
    if (checkpointId) {
      body.checkpoint_id = checkpointId;
    }
    
    // Add prompt templates if provided
    if (promptTemplates && Object.keys(promptTemplates).length > 0) {
      body.prompt_templates = promptTemplates;
    }
    
    console.log('body', body);
    
    // Uncomment the actual API call and remove the mock return
    const response = await fetch(`${this.baseUrl}/${jobId}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to resume job: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Terminate a running job
   * @param jobId Job identifier
   * @returns Promise containing response
   */
  async terminateJob(jobId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${jobId}/terminate`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to terminate job: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a job and all associated files
   * @param jobId Job identifier
   * @returns Promise containing response
  */
  async deleteJob(jobId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${jobId}/delete`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete job: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Subscribe to server-sent events for real-time migration updates
   * @param jobId Job identifier
   * @param onUpdate Callback function for status updates
   * @param onMessage Callback function for log messages
   * @param onHumanReview Callback function for human review requests
   * @param onCompleted Callback function for job completion
   * @param onError Callback function for errors
   * @returns EventSource object that can be closed to stop listening
   */
  subscribeToEvents(
    jobId: string,
    onUpdate: (data: MigrationState) => void,
    onMessage: (data: any) => void,
    onHumanReview: (data: any) => void,
    onCompleted: (data: any) => void,
    onError: (error: any) => void
  ): EventSource {
    // Reset reconnect attempts
    this.reconnectAttempts = 0;
    
    // Create the event source
    const eventSource = this.createEventSource(
      jobId,
      onUpdate,
      onMessage,
      onHumanReview,
      onCompleted,
      onError
    );

    return eventSource;
  }

  /**
   * Create an event source with reconnection logic
   * Internal helper method
   */
  private createEventSource(
    jobId: string,
    onUpdate: (data: MigrationState) => void,
    onMessage: (data: any) => void,
    onHumanReview: (data: any) => void,
    onCompleted: (data: any) => void,
    onError: (error: any) => void
  ): EventSource {
    const eventSource = new EventSource(`${this.baseUrl}/${jobId}/events`);
    
    // Handle direct event types from the server
    eventSource.addEventListener('update', (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
        if (data.event === "feedback_request") {
          onHumanReview(data);
        }
      } catch (err) {
        console.error('Error parsing update event:', err);
      }
    });

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message event1:', data);
        onMessage(data);
      } catch (err) {
        console.error('Error parsing message event:', err);
      }
    });

    eventSource.addEventListener('feedback_request', (event) => {
      try {
        const data = JSON.parse(event.data);
        onHumanReview(data);
      } catch (err) {
        console.error('Error parsing feedback request event:', err);
      }
    });

    eventSource.addEventListener('completed', (event) => {
      try {
        const data = JSON.parse(event.data);
        onCompleted(data);
        eventSource.close();
      } catch (err) {
        console.error('Error parsing completed event:', err);
      }
    });

    // Handle the default message event (fallback)
    eventSource.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data);
        console.log('Received message event:', eventData);
        // If the event has an event property, process accordingly
        if (eventData.event) {
          switch (eventData.event) {
            case 'update':
              onUpdate(eventData.data);
              break;
            case 'message':
              onMessage(eventData.data);
              break;
            case 'feedback_request':
              onHumanReview(eventData.data);
              break;
            case 'completed':
              onCompleted(eventData.data);
              eventSource.close();
              break;
            default:
              console.log('Unknown event type:', eventData.event);
              onMessage(eventData.data);
          }
        } else {
          // If no event property, treat as a regular message
          console.log('Received message without event2:', eventData);
          onMessage(eventData);
        }
      } catch (err) {
        console.error('Error processing message event:', err);
      }
    };

    // Error handling with reconnection logic
    eventSource.onerror = (error) => {
      // If connection is closed (readyState === 2)
      if (eventSource.readyState === 2) {
        // Check if we should try to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Reconnecting... Attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);
          
          // Attempt to reconnect after a timeout
          setTimeout(() => {
            const newEventSource = this.createEventSource(
              jobId,
              onUpdate,
              onMessage,
              onHumanReview,
              onCompleted,
              onError
            );
            
            // Replace methods on the original event source to forward to the new one
            eventSource.close = () => {
              newEventSource.close();
              return;
            };
          }, this.reconnectTimeoutMs * this.reconnectAttempts);
        } else {
          // We've exceeded max reconnect attempts
          // onError({
          //   type: 'reconnect_failed',
          //   message: `Failed to reconnect after ${this.maxReconnectAttempts} attempts`
          // });
        }
      } else {
        // For other errors, just notify
        // onError(error);
      }
    };

    return eventSource;
  }

  /**
   * Submit human feedback during the migration process
   * @param jobId Job identifier
   * @param decision Decision (approved, refine, reject)
   * @param feedback Optional feedback text
   * @returns Promise containing updated job status
   */
  async submitFeedback(
    jobId: string,
    decision: 'approved' | 'refine' | 'reject',
    feedback?: string
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${jobId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedback: decision,
        additional_comments: feedback,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a list of all generated files for a completed job
   * @param jobId Job identifier
   * @returns Promise containing list of files
   */
  async getGeneratedFiles(jobId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/${jobId}/files`);

    if (!response.ok) {
      throw new Error(`Failed to get generated files: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Download the generated files for a completed migration job as a ZIP archive
   * @param jobId Job identifier
   * @returns Promise containing a Blob that can be saved as a zip file
   */
  async downloadGeneratedFiles(jobId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/${jobId}/download`);

    if (!response.ok) {
      throw new Error(`Failed to download files: ${response.statusText}`);
    }

    return await response.blob();
  }

  /**
   * Get default prompt templates
   * @returns Promise containing prompt templates
   */
  async getDefaultPromptTemplates(): Promise<{prompt_templates: Record<string, string>}> {
    const response = await fetch(`${this.baseUrl.replace('/jobs', '')}/get_default_prompt_templates`);

    if (!response.ok) {
      throw new Error(`Failed to get prompt templates: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update a prompt template
   * @param templateName Name of the template to update
   * @param promptText New prompt text
   * @returns Promise containing response
   */
  async updatePromptTemplate(templateName: string, promptText: string): Promise<any> {
    const response = await fetch(`${this.baseUrl.replace('/jobs', '')}/update_prompt_template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_name: templateName,
        prompt_text: promptText
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update prompt template: ${response.statusText}`);
    }

    return await response.json();
  }
}

export default MigrationApiClient;
