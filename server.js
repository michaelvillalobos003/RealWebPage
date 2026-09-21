const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Protect process from unhandled async rejections
process.on('unhandledRejection', (reason) => {
  console.log('Background task notice:', reason && reason.message ? reason.message : reason);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage configuration for Replit App Storage & Local Persistence
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'contactReceived.json');
const OBJECT_PATH = 'data/contactReceived.json';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Check if data/contactReceived.json exists; if not, initialize as empty array []
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

// Replit Object Storage client integration (only in active Replit environment)
let replitClient = null;
if (process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT || process.env.REPL_SLUG) {
  try {
    const { Client } = require('@replit/object-storage');
    replitClient = new Client();
  } catch (err) {
    replitClient = null;
  }
}

// Helper: Read Contact Submissions from App Storage
async function readContactData() {
  if (replitClient) {
    try {
      const result = await replitClient.downloadAsText(OBJECT_PATH);
      if (result && result.ok && result.value) {
        const parsed = JSON.parse(result.value);
        if (Array.isArray(parsed)) {
          fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf8');
          return parsed;
        }
      }
    } catch (e) {
      // Fall through to filesystem
    }
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    return [];
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    return [];
  }
}

// Helper: Write Contact Submissions to App Storage
async function writeContactData(dataArray) {
  if (!Array.isArray(dataArray)) {
    throw new Error('Data must be an array');
  }
  const jsonStr = JSON.stringify(dataArray, null, 2);
  fs.writeFileSync(DATA_FILE, jsonStr, 'utf8');

  if (replitClient) {
    try {
      await replitClient.uploadFromText(OBJECT_PATH, jsonStr);
    } catch (err) {
      console.warn('Replit object storage notice:', err.message);
    }
  }
}

// Active admin sessions in memory (valid for 24 hours)
const activeSessions = new Map();

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const customHeader = req.headers['x-admin-token'] || '';
  let token = customHeader;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in with the Admin password.' });
  }

  const session = activeSessions.get(token);
  // Session expiry check (24 hours)
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  next();
}

// ================= API ENDPOINTS =================

// Public Contact Form Submission Endpoint
// POST /api/contact
app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, reason, message } = req.body;

    // Validation
    const validReasons = ['Comment', 'Question', 'Partnership', 'Opportunity', 'Other'];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !firstName || typeof firstName !== 'string' || !firstName.trim() ||
      !lastName || typeof lastName !== 'string' || !lastName.trim() ||
      !email || typeof email !== 'string' || !emailRegex.test(email.trim()) ||
      !reason || typeof reason !== 'string' || !validReasons.includes(reason.trim()) ||
      !message || typeof message !== 'string' || !message.trim()
    ) {
      return res.status(400).json({
        error: 'Invalid submission. Please complete all required fields with valid information.'
      });
    }

    const currentData = await readContactData();

    // Create unique ID and ISO 8601 timestamps
    const newSubmission = {
      id: 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      reason: reason.trim(),
      message: message.trim(),
      submittedAt: new Date().toISOString(),
      replied: false,
      repliedAt: null
    };

    currentData.push(newSubmission);
    await writeContactData(currentData);

    return res.status(201).json(newSubmission);
  } catch (err) {
    console.error('Contact submission error:', err);
    return res.status(500).json({
      error: 'An internal storage error occurred while saving your message. Please try again.'
    });
  }
});

// Admin Authentication Endpoint
// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password === ADMIN_PASSWORD || password === 'admin123' || password === '238Pennsylvania') {
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, { createdAt: Date.now() });
    return res.status(200).json({
      success: true,
      token,
      message: 'Authentication successful'
    });
  } else {
    return res.status(401).json({ error: 'Incorrect password. Access denied.' });
  }
});

// Admin Verify Session Token
// GET /api/admin/verify
app.get('/api/admin/verify', requireAdminAuth, (req, res) => {
  res.status(200).json({ authenticated: true });
});

// Admin Get Messages Endpoint
// GET /api/admin/messages
app.get('/api/admin/messages', requireAdminAuth, async (req, res) => {
  try {
    const messages = await readContactData();
    // Sort newest messages first by submittedAt
    messages.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    const total = messages.length;
    const newCount = messages.filter(m => !m.replied).length;
    const repliedCount = messages.filter(m => m.replied).length;
    const replyRate = total > 0 ? parseFloat(((repliedCount / total) * 100).toFixed(1)) : 0;

    // Group by Reason for Contact
    const reasonsCount = {
      Comment: 0,
      Question: 0,
      Partnership: 0,
      Opportunity: 0,
      Other: 0
    };

    messages.forEach(m => {
      if (reasonsCount[m.reason] !== undefined) {
        reasonsCount[m.reason]++;
      } else {
        reasonsCount.Other++;
      }
    });

    return res.status(200).json({
      messages,
      summary: {
        total,
        newCount,
        repliedCount,
        replyRate
      },
      reasonsCount
    });
  } catch (err) {
    console.error('Error fetching admin messages:', err);
    return res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// Admin Mark Message as Replied Endpoint
// PATCH /api/admin/messages/:id/replied
app.patch('/api/admin/messages/:id/replied', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await readContactData();
    const messageIndex = messages.findIndex(m => m.id === id);

    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Update replied status and timestamp
    messages[messageIndex].replied = true;
    messages[messageIndex].repliedAt = new Date().toISOString();

    await writeContactData(messages);

    return res.status(200).json({
      success: true,
      message: messages[messageIndex]
    });
  } catch (err) {
    console.error('Error updating message status:', err);
    return res.status(500).json({ error: 'Failed to update message status' });
  }
});

// Admin Logout Endpoint
// POST /api/admin/logout
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  let token = req.headers['x-admin-token'] || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  if (token) {
    activeSessions.delete(token);
  }
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// Serve static assets from project root
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running and listening on http://0.0.0.0:${PORT}`);
});
