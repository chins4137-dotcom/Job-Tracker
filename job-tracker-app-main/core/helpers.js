/**
 * Set CORS headers on response
 * @param {object} res - HTTP response object
 */
export function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Send JSON response
 * @param {object} res - HTTP response object
 * @param {number} statusCode - HTTP status code
 * @param {object} payload - Data to send as JSON
 */
export function sendJSON(res, statusCode, payload) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

/**
 * Parse request body as JSON
 * @param {object} req - HTTP request object
 * @returns {Promise<object>} Parsed JSON data
 */
export function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Extract ID from URL path
 * @param {string} pathname - URL pathname
 * @param {string} prefix - Route prefix (e.g., '/api/jobs')
 * @returns {string|null} Extracted ID or null
 */
export function extractIdFromPath(pathname, prefix) {
  const regex = new RegExp(`^${prefix}/([^/]+)$`);
  const match = pathname.match(regex);
  return match ? match[1] : null;
}
