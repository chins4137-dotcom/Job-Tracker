import fs from 'fs/promises';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data/jobs.json');

/**
 * Generate unique ID for job
 * @returns {string} Unique job ID
 */
function generateJobId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Read jobs from JSON file with error handling
 * @returns {Promise<Array>} Array of jobs
 */
async function readJobsFile() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const jobs = JSON.parse(data);

    // Validate that it's an array
    if (!Array.isArray(jobs)) {
      console.error('⚠️  jobs.json is corrupted (not an array). Re-initializing to empty array.');
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }

    return jobs;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with empty array
      console.log('📁 jobs.json not found. Creating new file with empty array.');
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    } else if (error instanceof SyntaxError) {
      // JSON parse error - file is corrupted
      console.error('⚠️  jobs.json is corrupted (invalid JSON). Re-initializing to empty array.');
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Write jobs to JSON file
 * @param {Array} jobs - Array of jobs to write
 * @returns {Promise<void>}
 */
async function writeJobsFile(jobs) {
  await fs.writeFile(DATA_FILE, JSON.stringify(jobs, null, 2));
}

/**
 * Validate required job fields
 * @param {object} jobData - Job data to validate
 * @throws {Error} If validation fails
 */
function validateJobData(jobData) {
  if (!jobData.company || typeof jobData.company !== 'string' || jobData.company.trim() === '') {
    throw new Error('Company is required and must be a non-empty string');
  }

  if (!jobData.role || typeof jobData.role !== 'string' || jobData.role.trim() === '') {
    throw new Error('Role is required and must be a non-empty string');
  }

  if (!jobData.status || typeof jobData.status !== 'string') {
    throw new Error('Status is required and must be a string');
  }

  const validStatuses = ['Applied', 'Interviewing', 'Offer', 'Rejected'];
  if (!validStatuses.includes(jobData.status)) {
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }
}

/**
 * Get all jobs
 * @returns {Promise<Array>} Array of all jobs
 */
export async function getAllJobs() {
  return await readJobsFile();
}

/**
 * Get job by ID
 * @param {string} id - Job ID
 * @returns {Promise<object|null>} Job object or null if not found
 */
export async function getJobById(id) {
  const jobs = await readJobsFile();
  const job = jobs.find(job => job.id === id);
  return job || null;
}

/**
 * Create a new job
 * @param {object} jobData - Job data (company, role, status, appliedDate, notes)
 * @returns {Promise<object>} Created job object
 * @throws {Error} If validation fails
 */
export async function createJob(jobData) {
  // Validate required fields
  validateJobData(jobData);

  const jobs = await readJobsFile();

  const newJob = {
    id: generateJobId(),
    company: jobData.company.trim(),
    role: jobData.role.trim(),
    status: jobData.status,
    appliedDate: jobData.appliedDate || new Date().toISOString(),
    notes: jobData.notes || ''
  };

  jobs.push(newJob);
  await writeJobsFile(jobs);

  return newJob;
}

/**
 * Update a job by ID
 * @param {string} id - Job ID
 * @param {object} jobData - Updated job data
 * @returns {Promise<object|null>} Updated job object or null if not found
 * @throws {Error} If validation fails
 */
export async function updateJob(id, jobData) {
  const jobs = await readJobsFile();
  const index = jobs.findIndex(job => job.id === id);

  if (index === -1) {
    return null;
  }

  // If updating status, validate it
  if (jobData.status) {
    const validStatuses = ['Applied', 'Interviewing', 'Offer', 'Rejected'];
    if (!validStatuses.includes(jobData.status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // Merge updated fields, but preserve id
  const updatedJob = {
    ...jobs[index],
    ...jobData,
    id: jobs[index].id // Ensure ID never changes
  };

  // Trim string fields if they exist
  if (updatedJob.company) updatedJob.company = updatedJob.company.trim();
  if (updatedJob.role) updatedJob.role = updatedJob.role.trim();

  jobs[index] = updatedJob;
  await writeJobsFile(jobs);

  return updatedJob;
}

/**
 * Delete a job by ID
 * @param {string} id - Job ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function deleteJob(id) {
  const jobs = await readJobsFile();
  const initialLength = jobs.length;
  const filteredJobs = jobs.filter(job => job.id !== id);

  if (filteredJobs.length === initialLength) {
    return false; // Job not found
  }

  await writeJobsFile(filteredJobs);
  return true;
}

// Default export for backwards compatibility
export default {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};
