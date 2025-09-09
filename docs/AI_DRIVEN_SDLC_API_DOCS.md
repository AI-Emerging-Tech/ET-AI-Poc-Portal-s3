
## API Endpoints

### List Jobs

```
GET /api/migration/jobs
```

Returns a list of all migration jobs in the system.

### Get Job Details

```
GET /api/migration/jobs/<job_id>
```

Returns detailed information about a specific job.

### Start Migration Job

```
POST /api/migration/jobs
```

Start a new migration job. Requires a ZIP file upload and source/target language specification.

**Request:**
- `file`: ZIP file containing source code (required)
- `source_lang`: Source programming language (default: "Python")
- `target_lang`: Target programming language (default: "JavaScript")

### Get Job Status

```
GET /api/migration/jobs/<job_id>/status
```

Returns the current status of a migration job.

### Get Job Checkpoints

```
GET /api/migration/jobs/<job_id>/checkpoints
```

Returns a list of all checkpoints for a job, which can be used for resuming.

### Pause Job

```
POST /api/migration/jobs/<job_id>/pause
```

Pauses a running job.

### Resume Job

```
POST /api/migration/jobs/<job_id>/resume
```

Resumes a paused job.

**Request:**
- `checkpoint_id`: Specific checkpoint to resume from (optional)

### Terminate Job

```
POST /api/migration/jobs/<job_id>/terminate
```

Terminates a running job.

### Delete Job

```
DELETE /api/migration/jobs/<job_id>/delete
```

Deletes a job and all associated files.

### Get Job Events

```
GET /api/migration/jobs/<job_id>/events
```

Returns a Server-Sent Events (SSE) stream of real-time job updates.

### Provide Human Feedback

```
POST /api/migration/jobs/<job_id>/feedback
```

Provides human feedback for jobs that request it.

**Request:**
- `feedback`: One of "approved", "refine", or "reject"

### Get Generated Files

```
GET /api/migration/jobs/<job_id>/files
```

Returns a list of all generated files for a completed job.

### Download Files

```
GET /api/migration/jobs/<job_id>/download
```

Downloads all generated files as a ZIP archive.

## Job Status Values

- `initializing`: Job is being set up
- `processing`: Job is actively running
- `paused`: Job has been paused
- `completed`: Job has finished successfully
- `failed`: Job has encountered an error
- `terminated`: Job was manually terminated

## Human-in-the-Loop Process

The system uses human feedback at various stages of the migration process:

1. Analysis Review: Validate the analysis of the source code
2. Plan Review: Approve or refine the migration plan
3. Implementation Review: Review the generated code

When human input is required, the system pauses and sends a `feedback_request` event through the events stream. The caller should then provide feedback through the feedback endpoint.

## Error Handling

All API endpoints return appropriate HTTP status codes:
- 200/202: Success
- 400: Bad request or invalid parameters
- 404: Resource not found
- 500: Server error 


### File Management APIs

#### List Files

```
GET /api/migration/jobs/<job_id>/files/list
```

Returns a tree structure of all files in the job's source and output directories.

**Query Parameters:**
- `type`: Filter by file type ("source", "output", or "both" - default: "both")
- `path`: Specify a sub-directory to list (default: root directory)

#### Get File Content

```
GET /api/migration/jobs/<job_id>/files/content
```

Returns the content of a specific file.

**Query Parameters:**
- `path`: Path to the file within the source or output directory (required)
- `type`: File type ("source" or "output" - default: "source")

#### Update File

```
POST /api/migration/jobs/<job_id>/files/update
```

Updates the content of an existing file.

**Request Body:**
```json
{
  "path": "path/to/file.txt",
  "type": "source",
  "content": "New file content",
  "is_binary": false
}
```

For binary files, set `is_binary` to true and provide Base64-encoded content.

#### Create File

```
POST /api/migration/jobs/<job_id>/files/create
```

Creates a new file in the job.

**Request Body:**
```json
{
  "path": "path/to/new_file.txt",
  "type": "source",
  "content": "File content"
}
```

#### Delete File

```
DELETE /api/migration/jobs/<job_id>/files/delete
```

Deletes a file from the job.

**Query Parameters:**
- `path`: Path to the file within the source or output directory (required)
- `type`: File type ("source" or "output" - required)

#### Compare Files

```
GET /api/migration/jobs/<job_id>/files/compare
```

Compares source and output versions of a file and returns a diff.

**Query Parameters:**
- `path`: Path to the file to compare (required)