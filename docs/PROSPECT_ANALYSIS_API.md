# Prospect Analysis API Documentation

## Overview
This API provides endpoints for managing prospect analysis jobs. Jobs are processed asynchronously, and status updates include detailed progress information including active agents and completed steps.

## Base URL
```
http://127.0.0.1:11022/api/prospect-analysis
```

## Endpoints

### Create Analysis Job
Start a new prospect analysis job.

```http
POST /jobs
```

#### Request Body
```json
{
  "task": "string",           // Required: Analysis task description
  "companyName": "string",    // Required: Target company name
  "companyDomain": "string",  // Required: Company's primary domain
  "lineOfBusiness": "string", // Specific line of business to focus on
  "planOfAction": [          // Optional: Custom analysis plan steps
    "string"
  ]
}
```


#### Files
The following files should be sent as multipart/form-data:
- naicReport (PDF, optional)
- ambestReport (PDF, optional)
- annualReport (PDF, optional)
- otherReports[] (PDF, optional, multiple files allowed)

#### Response (201 Created)
```json
{
  "jobId": "string",
  "status": "pending",
  "estimatedTime": 30,
  "createdAt": "2024-03-26T10:00:00Z"
}
```

### Get Job Status
Get detailed status of an analysis job.

```http
GET /jobs/{jobId}
```

#### Response (200 OK)
```json
{
  "jobId": "string",
  "status": "pending" | "processing" | "finalizing" | "completed" | "failed",
  "progress": 0-100,
  "currentTask": "string",
  "activeAgents": [
    "finance_analyst_agent",
    "market_analyst_agent"
  ],
  "completedSteps": [
    "Analyzed financial metrics",
    "Researched market position"
  ],
  "error": "string",          // Only present if status is "failed"
  "startTime": "2024-03-26T10:00:00Z",
  "lastUpdate": "2024-03-26T10:05:00Z"
}
```

### List Jobs
Get a paginated list of analysis jobs.

```http
GET /jobs
```

#### Query Parameters
- status: Filter by job status (optional)
- page: Page number (default: 1)
- limit: Items per page (default: 10)

#### Response (200 OK)
```json
{
  "jobs": [{
    "jobId": "string",
    "status": "string",
    "progress": 0-100,
    "currentTask": "string",
    "activeAgents": ["string"],
    "completedSteps": ["string"],
    "startTime": "string",
    "lastUpdate": "string"
  }],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 42
  }
}
```

### Get Job Report
Get the generated report for a completed job.

```http
GET /jobs/{jobId}/report
```

#### Response (200 OK)
```json
{
  "content": "string",    // Markdown formatted report
  "format": "markdown"
}
```

## Error Responses
All endpoints use a consistent error response format:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

Common error codes:
- MISSING_PARAMETERS (400)
- NOT_FOUND (404)
- INTERNAL_ERROR (500)

## Implementation Notes

### Status Updates
- Initial status is "pending"
- Updates about every 5 seconds during processing
- Progress percentage indicates overall task completion
- Active agents list shows which specialists are currently working
- Completed steps track major milestones in the analysis

### Polling Strategy
1. After job creation:
   - Poll status every 5 seconds initially
   - If no update for 3 attempts, increase interval to 10 seconds
   - Maximum interval: 30 seconds
   - Reset to 5 seconds after receiving an update
2. Stop polling when status is "completed" or "failed"

### Testing Tips
- A typical analysis takes 20-30 minutes
- Progress updates include currently active agents
- Monitor completedSteps to track analysis progress
- Final report is available once status is "completed"