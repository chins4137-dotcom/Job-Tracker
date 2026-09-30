import { sendJSON, parseRequestBody } from '../core/helpers.js';
import { getAllJobs, getJobById, createJob, updateJob, deleteJob } from '../models/Job.js';

/**
 * Main route handler for /api/jobs
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {string} pathname - URL pathname
 * @param {object} queryParams - Parsed query parameters
 */
export async function handleJobsRoute(req, res, pathname, queryParams) {
  const method = req.method;

  try {
    // GET /api/jobs - Get all jobs
    if (method === 'GET' && pathname === '/api/jobs' && !queryParams.id) {
      const jobs = await getAllJobs();
      sendJSON(res, 200, { jobs });
      return;
    }

    // GET /api/jobs?id=JOB_ID - Get single job
    if (method === 'GET' && pathname === '/api/jobs' && queryParams.id) {
      const job = await getJobById(queryParams.id);

      if (!job) {
        sendJSON(res, 404, { error: 'Job not found' });
        return;
      }

      sendJSON(res, 200, { job });
      return;
    }

    // POST /api/jobs - Create new job
    if (method === 'POST' && pathname === '/api/jobs') {
      const body = await parseRequestBody(req);

      try {
        const newJob = await createJob(body);
        sendJSON(res, 201, { job: newJob });
      } catch (validationError) {
        // Validation errors from Job model
        sendJSON(res, 400, { error: validationError.message });
      }
      return;
    }

    // PUT /api/jobs?id=JOB_ID - Update job
    if (method === 'PUT' && pathname === '/api/jobs' && queryParams.id) {
      const body = await parseRequestBody(req);

      try {
        const updatedJob = await updateJob(queryParams.id, body);

        if (!updatedJob) {
          sendJSON(res, 404, { error: 'Job not found' });
          return;
        }

        sendJSON(res, 200, { job: updatedJob });
      } catch (validationError) {
        // Validation errors from Job model
        sendJSON(res, 400, { error: validationError.message });
      }
      return;
    }

    // DELETE /api/jobs?id=JOB_ID - Delete job
    if (method === 'DELETE' && pathname === '/api/jobs' && queryParams.id) {
      const deleted = await deleteJob(queryParams.id);

      if (!deleted) {
        sendJSON(res, 404, { error: 'Job not found' });
        return;
      }

      sendJSON(res, 200, { success: true });
      return;
    }

    // Route not found or missing required query params
    if (method === 'PUT' && pathname === '/api/jobs' && !queryParams.id) {
      sendJSON(res, 400, { error: 'Missing required query parameter: id' });
      return;
    }

    if (method === 'DELETE' && pathname === '/api/jobs' && !queryParams.id) {
      sendJSON(res, 400, { error: 'Missing required query parameter: id' });
      return;
    }

    // Method not allowed or route not found
    sendJSON(res, 404, { error: 'Route not found' });
  } catch (error) {
    console.error('Error in handleJobsRoute:', error);
    sendJSON(res, 500, { error: error.message || 'Internal server error' });
  }
}
