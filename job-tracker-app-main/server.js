import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import { handleJobsRoute } from './routes/jobs.js';
import { setCORSHeaders, sendJSON } from './core/helpers.js';

const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

/**
 * Serve static files from /public directory
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {string} filePath - Full path to file
 */
async function serveStaticFile(req, res, filePath) {
  try {
    // Read the file
    const data = await fs.readFile(filePath);

    // Determine content type from file extension
    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    // Send successful response
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File not found - send 404
      console.log(`404 - File not found: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>404 - Not Found</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
              }
              h1 { font-size: 4rem; margin: 0; }
              p { font-size: 1.5rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>404</h1>
              <p>Page Not Found</p>
              <p><a href="/" style="color: white;">Go Home</a></p>
            </div>
          </body>
        </html>
      `);
    } else {
      // Other file system errors
      console.error(`Error serving file ${filePath}:`, error);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>500 - Server Error</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
              }
              h1 { font-size: 4rem; margin: 0; }
              p { font-size: 1.5rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>500</h1>
              <p>Internal Server Error</p>
            </div>
          </body>
        </html>
      `);
    }
  }
}

// Main request handler
const server = http.createServer(async (req, res) => {
  // Set CORS headers for all requests
  setCORSHeaders(res);

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    // Parse URL with query parameters
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const queryParams = parsedUrl.query;

    // API routes - Route all paths starting with "/api" to appropriate handlers
    if (pathname.startsWith('/api/jobs')) {
      await handleJobsRoute(req, res, pathname, queryParams);
      return;
    }

    // Static file serving from /public
    // Map "/" to "/public/index.html"
    // Map any other path like "/styles.css" to "/public/styles.css"
    let filePath;
    if (pathname === '/') {
      filePath = path.join(__dirname, 'public', 'index.html');
    } else {
      filePath = path.join(__dirname, 'public', pathname);
    }

    await serveStaticFile(req, res, filePath);
  } catch (error) {
    // Centralized error handling for unexpected errors
    console.error('Unexpected server error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
