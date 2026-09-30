// ===================================
// Job Application Tracker - Main JS
// ===================================

// API Base URL
const API_BASE = '/api/jobs';

// State
let allJobs = [];
let currentEditId = null;
let currentFilter = 'All';

// DOM Elements
const jobForm = document.getElementById('job-form');
const jobIdInput = document.getElementById('job-id');
const companyInput = document.getElementById('company');
const roleInput = document.getElementById('role');
const statusInput = document.getElementById('status');
const appliedDateInput = document.getElementById('appliedDate');
const notesInput = document.getElementById('notes');
const formTitle = document.getElementById('form-title');
const saveBtnText = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const filterStatusSelect = document.getElementById('filter-status');
const jobsTableBody = document.getElementById('jobs-table-body');
const emptyState = document.getElementById('empty-state');
const tableContainer = document.getElementById('table-container');
const totalCountSpan = document.getElementById('total-count');
const filteredCountSpan = document.getElementById('filtered-count');

// ===================================
// Initialize App
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // Set default date to today
  setDefaultDate();

  // Load jobs from API
  loadJobs();

  // Setup event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Form submission
  jobForm.addEventListener('submit', handleFormSubmit);

  // Reset button
  resetBtn.addEventListener('click', handleReset);

  // Filter dropdown
  filterStatusSelect.addEventListener('change', handleFilterChange);
}

// ===================================
// API Functions
// ===================================

/**
 * Fetch all jobs from API
 */
async function loadJobs() {
  try {
    const response = await fetch(API_BASE);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    allJobs = data.jobs || [];

    renderJobs();
    updateCounts();
  } catch (error) {
    console.error('Error loading jobs:', error);
    alert('Failed to load jobs. Please refresh the page.');
  }
}

/**
 * Create a new job
 */
async function createJob(jobData) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create job');
    }

    const data = await response.json();
    return data.job;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
}

/**
 * Update an existing job
 */
async function updateJob(jobId, jobData) {
  try {
    const response = await fetch(`${API_BASE}?id=${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update job');
    }

    const data = await response.json();
    return data.job;
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
}

/**
 * Delete a job
 */
async function deleteJob(jobId) {
  try {
    const response = await fetch(`${API_BASE}?id=${jobId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete job');
    }

    return true;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
}

// ===================================
// Form Handling
// ===================================

/**
 * Handle form submission (Create or Update)
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  // Disable submit button to prevent double submission
  const saveBtn = saveBtnText;
  saveBtn.disabled = true;
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Saving...';

  try {
    // Get form data
    const jobData = {
      company: companyInput.value.trim(),
      role: roleInput.value.trim(),
      status: statusInput.value,
      appliedDate: appliedDateInput.value || new Date().toISOString(),
      notes: notesInput.value.trim(),
    };

    if (currentEditId) {
      // Update existing job
      await updateJob(currentEditId, jobData);
    } else {
      // Create new job
      await createJob(jobData);
    }

    // Success! Reload jobs and reset form
    await loadJobs();
    handleReset();
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    // Re-enable submit button
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

/**
 * Reset form and exit edit mode
 */
function handleReset() {
  jobForm.reset();
  currentEditId = null;
  jobIdInput.value = '';
  formTitle.textContent = 'Add New Job';
  saveBtnText.textContent = 'Save Job';
  setDefaultDate();
}

/**
 * Populate form for editing
 */
function editJob(job) {
  currentEditId = job.id;
  jobIdInput.value = job.id;
  companyInput.value = job.company;
  roleInput.value = job.role;
  statusInput.value = job.status;
  appliedDateInput.value = job.appliedDate ? job.appliedDate.split('T')[0] : '';
  notesInput.value = job.notes || '';

  // Update form title and button text
  formTitle.textContent = 'Edit Job';
  saveBtnText.textContent = 'Update Job';

  // Scroll to form
  jobForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Set default date to today
 */
function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  appliedDateInput.value = today;
}

// ===================================
// Delete Handling
// ===================================

/**
 * Handle job deletion
 */
async function handleDelete(jobId, companyName) {
  // Confirm deletion
  const confirmed = window.confirm(
    `Are you sure you want to delete the application for ${companyName}?`
  );

  if (!confirmed) {
    return;
  }

  try {
    await deleteJob(jobId);

    // If we're editing this job, reset the form
    if (currentEditId === jobId) {
      handleReset();
    }

    // Reload jobs
    await loadJobs();
  } catch (error) {
    alert(`Error deleting job: ${error.message}`);
  }
}

// ===================================
// Filter Handling
// ===================================

/**
 * Handle filter change
 */
function handleFilterChange(event) {
  currentFilter = event.target.value;
  renderJobs();
  updateCounts();
}

/**
 * Get filtered jobs based on current filter
 */
function getFilteredJobs() {
  if (currentFilter === 'All') {
    return allJobs;
  }
  return allJobs.filter((job) => job.status === currentFilter);
}

// ===================================
// Rendering Functions
// ===================================

/**
 * Render all jobs to the table
 */
function renderJobs() {
  const filteredJobs = getFilteredJobs();

  // Clear table body
  jobsTableBody.innerHTML = '';

  // Show/hide empty state and table
  if (allJobs.length === 0) {
    emptyState.style.display = 'block';
    tableContainer.style.display = 'none';
    return;
  } else {
    emptyState.style.display = 'none';
    tableContainer.style.display = 'block';
  }

  // If no jobs match filter, show message in table
  if (filteredJobs.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="6" class="text-center text-muted">
        No jobs found with status "${currentFilter}"
      </td>
    `;
    jobsTableBody.appendChild(tr);
    return;
  }

  // Render each job
  filteredJobs.forEach((job) => {
    const tr = createJobRow(job);
    jobsTableBody.appendChild(tr);
  });
}

/**
 * Create a table row for a job
 */
function createJobRow(job) {
  const tr = document.createElement('tr');

  // Format date
  const formattedDate = formatDate(job.appliedDate);

  // Truncate notes if too long
  const displayNotes = job.notes
    ? job.notes.length > 50
      ? job.notes.substring(0, 50) + '...'
      : job.notes
    : '-';

  tr.innerHTML = `
    <td>${escapeHtml(job.company)}</td>
    <td>${escapeHtml(job.role)}</td>
    <td>
      <span class="status-badge ${job.status}">${job.status}</span>
    </td>
    <td>${formattedDate}</td>
    <td title="${escapeHtml(job.notes || '')}">${escapeHtml(displayNotes)}</td>
    <td>
      <div class="actions-cell">
        <button
          class="btn btn-secondary btn-small edit-btn"
          data-job-id="${job.id}"
          aria-label="Edit ${escapeHtml(job.company)}"
        >
          Edit
        </button>
        <button
          class="btn btn-danger btn-small delete-btn"
          data-job-id="${job.id}"
          data-company="${escapeHtml(job.company)}"
          aria-label="Delete ${escapeHtml(job.company)}"
        >
          Delete
        </button>
      </div>
    </td>
  `;

  // Add event listeners to buttons
  const editBtn = tr.querySelector('.edit-btn');
  const deleteBtn = tr.querySelector('.delete-btn');

  editBtn.addEventListener('click', () => editJob(job));
  deleteBtn.addEventListener('click', () => handleDelete(job.id, job.company));

  return tr;
}

/**
 * Update job counts
 */
function updateCounts() {
  totalCountSpan.textContent = allJobs.length;
  filteredCountSpan.textContent = getFilteredJobs().length;
}

// ===================================
// Utility Functions
// ===================================

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===================================
// Export for testing (optional)
// ===================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadJobs,
    createJob,
    updateJob,
    deleteJob,
    formatDate,
    escapeHtml,
  };
}
