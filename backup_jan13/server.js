const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, 'data.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
let clients = [];
let settings = {
  agencyEmails: [],
  emailTemplate: {
    subject: 'Keyword Match Found - {{platform}}',
    message: 'Hello,\n\nWe found a target result in {{platform}}\'s search suggestions!\n\nCompany: {{companyName}}\nBase Keyword: {{baseKeyword}}\nTarget Result: {{targetResult}}\nFirst Found: {{foundDate}}\n\nBest regards,\nKeyword Verification System'
  }
};

// Load data from file
async function loadData() {
  try {
    await fs.access(DATA_FILE);
    const data = await fs.readFile(DATA_FILE, 'utf8');
    clients = JSON.parse(data);
    console.log('Data loaded:', clients);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No existing data file, creating new one');
      await fs.writeFile(DATA_FILE, '[]');
      clients = [];
    } else {
      console.error('Error loading data:', error);
      throw error;
    }
  }
}

// Save data to file
async function saveData() {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(clients, null, 2));
    console.log('Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
}

// Load settings from file
async function loadSettings() {
  try {
    await fs.access(SETTINGS_FILE);
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No existing settings file, creating new one');
      const defaultSettings = {
        agencyEmails: [''],
        emailTemplate: {
          subject: 'Keyword Match Found - {{platform}}',
          message: 'Hello,\n\nWe found a target result in {{platform}}\'s search suggestions!\n\nCompany: {{companyName}}\nBase Keyword: {{baseKeyword}}\nTarget Result: {{targetResult}}\nFirst Found: {{foundDate}}\n\nBest regards,\nKeyword Verification System'
        }
      };
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    } else {
      console.error('Error loading settings:', error);
      throw error;
    }
  }
}

// Save settings to file
async function saveSettings(settings) {
  try {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

// Function to normalize text for comparison
function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Replace & with 'and'
    .replace(/&/g, 'and')
    // Remove special characters but keep alphanumeric and spaces
    .replace(/[^a-z0-9\s-]/g, '')
    // Remove extra spaces around dashes
    .replace(/\s*-\s*/g, '-')
    // Trim again in case we have leading/trailing spaces
    .trim();
}

// Function to check if a suggestion matches the target result
function isExactMatch(suggestion, targetResult) {
  // Normalize both strings
  const normalizedSuggestion = normalizeText(suggestion);
  const normalizedTarget = normalizeText(targetResult);
  
  console.log('Comparing suggestion:', {
    original: suggestion,
    normalized: normalizedSuggestion
  });
  console.log('With target:', {
    original: targetResult,
    normalized: normalizedTarget
  });
  
  // Try different matching strategies
  const exactMatch = normalizedSuggestion === normalizedTarget;
  const containsMatch = normalizedSuggestion.includes(normalizedTarget) || 
                       normalizedTarget.includes(normalizedSuggestion);
  
  // Split into words and check if all target words are present in sequence
  const targetWords = normalizedTarget.split(' ');
  const suggestionWords = normalizedSuggestion.split(' ');
  
  // Check for sequential word matches
  let sequentialMatch = false;
  for (let i = 0; i <= suggestionWords.length - targetWords.length; i++) {
    const slice = suggestionWords.slice(i, i + targetWords.length);
    if (slice.join(' ') === targetWords.join(' ')) {
      sequentialMatch = true;
      break;
    }
  }
  
  const matches = exactMatch || containsMatch || sequentialMatch;
  console.log('Match analysis:', {
    exactMatch,
    containsMatch,
    sequentialMatch,
    finalResult: matches
  });
  
  return matches;
}

// Function to check Google autosuggest
async function checkGoogleAutosuggest(tracking) {
  console.log('Checking Google autosuggest for:', tracking.baseKeyword);
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set a desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent to appear as a desktop browser
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Navigating to Google...');
    await page.goto('https://www.google.com', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for and click the search box (handle both possible selectors)
    await page.waitForSelector('input[name="q"], textarea[name="q"]', { visible: true });
    const searchInput = await page.$('input[name="q"]') || await page.$('textarea[name="q"]');
    
    if (!searchInput) {
      throw new Error('Could not find search input');
    }
    
    console.log('Typing search query...');
    await searchInput.click();
    await searchInput.type(tracking.baseKeyword, { delay: 100 });
    
    // Wait for suggestions to appear
    console.log('Waiting for suggestions...');
    await page.waitForSelector('ul[role="listbox"]', { timeout: 5000 });
    
    // Wait a bit longer for all suggestions to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract suggestions
    const suggestions = await page.evaluate(() => {
      const elements = document.querySelectorAll('li.sbct');
      return Array.from(elements).map(el => {
        const suggestionEl = el.querySelector('div[role="option"] div:first-child');
        return suggestionEl ? suggestionEl.textContent : '';
      });
    });
    
    console.log('Google Suggestions:', suggestions);
    
    await browser.close();
    return suggestions;
  } catch (error) {
    console.error('Error in Google autosuggest:', error);
    await browser.close();
    return [];
  }
}

// Function to check Bing autosuggest
async function checkBingAutosuggest(tracking) {
  console.log('Checking Bing autosuggest for:', tracking.baseKeyword);
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('https://www.bing.com');
    await page.type('#sb_form_q', tracking.baseKeyword);
    
    // Wait for suggestions to appear
    await page.waitForSelector('.sa_sg', { timeout: 5000 });
    
    const suggestions = await page.evaluate(() => {
      const elements = document.querySelectorAll('.sa_sg');
      return Array.from(elements).map(el => el.textContent);
    });
    
    console.log('Bing Suggestions:', suggestions);
    
    await browser.close();
    return suggestions;
  } catch (error) {
    console.error('Error in Bing autosuggest:', error);
    await browser.close();
    return [];
  }
}

// Function to check YouTube autosuggest
async function checkYouTubeAutosuggest(tracking) {
  console.log('Checking YouTube autosuggest for:', tracking.baseKeyword);
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('https://www.youtube.com');
    await page.type('input#search', tracking.baseKeyword);
    
    // Wait for suggestions to appear
    await page.waitForSelector('ytd-search-suggestion-renderer', { timeout: 5000 });
    
    const suggestions = await page.evaluate(() => {
      const elements = document.querySelectorAll('ytd-search-suggestion-renderer');
      return Array.from(elements).map(el => el.textContent.trim());
    });
    
    console.log('YouTube Suggestions:', suggestions);
    
    await browser.close();
    return suggestions;
  } catch (error) {
    console.error('Error in YouTube autosuggest:', error);
    await browser.close();
    return [];
  }
}

// Function to send notification email
async function sendNotificationEmail(client, tracking, platform) {
  const templateData = {
    platform,
    companyName: client.companyName,
    baseKeyword: tracking.baseKeyword,
    targetResult: tracking.targetResult,
    foundDate: new Date().toLocaleString()
  };

  // Replace placeholders in template
  let subject = settings.emailTemplate.subject;
  let message = settings.emailTemplate.message;
  
  Object.entries(templateData).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(placeholder, value);
    message = message.replace(placeholder, value);
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Send to agency emails
  if (settings.agencyEmails.length > 0) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: settings.agencyEmails.join(', '),
        subject,
        html: message
      });
      console.log('Agency notification sent successfully');
    } catch (error) {
      console.error('Error sending agency notification:', error);
    }
  }

  // Send to client if enabled
  if (client.notifyClient && client.emails && client.emails.length > 0) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: client.emails.join(', '),
        subject,
        html: message
      });
      console.log('Client notification sent successfully');
    } catch (error) {
      console.error('Error sending client notification:', error);
    }
  }
}

// Helper function to check keywords for a single client
async function checkKeywordsForClient(client) {
  for (const tracking of client.keywordTracking) {
    // Simulate checking each platform
    tracking.status = {
      google: Math.random() < 0.5,
      bing: Math.random() < 0.5,
      youtube: Math.random() < 0.5
    };
    
    // Update first appearance dates
    for (const platform of ['google', 'bing', 'youtube']) {
      if (tracking.status[platform] && !tracking.firstAppearance[platform]) {
        tracking.firstAppearance[platform] = new Date().toISOString();
      }
    }
    
    tracking.lastChecked = new Date().toISOString();
  }
  return client;
}

// Function to check keywords for all clients
async function checkAllKeywords() {
  console.log('Starting keyword check...');
  let updated = false;

  try {
    for (let i = 0; i < clients.length; i++) {
      const updatedClient = await checkKeywordsForClient(clients[i]);
      clients[i] = updatedClient;
      updated = true;
    }

    if (updated) {
      await saveData();
      console.log('All keywords checked and data saved');
    }
  } catch (error) {
    console.error('Error checking keywords:', error);
  }
}

// API Routes
app.get('/api/clients', async (req, res) => {
  try {
    await loadData();
    res.json(clients);
  } catch (error) {
    console.error('Error getting clients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const newClient = {
      ...req.body,
      id: Date.now().toString(),
      keywordTracking: req.body.keywordTracking || []
    };
    clients.push(newClient);
    await saveData();
    res.json(newClient);
  } catch (error) {
    console.error('Error adding client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedClient = req.body;
    const index = clients.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    clients[index] = updatedClient;
    await saveData();
    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    clients = clients.filter(c => c.id !== id);
    await saveData();
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/clients/:id/check-keywords', async (req, res) => {
  try {
    const { id } = req.params;
    const client = clients.find(c => c.id === id);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const updatedClient = await checkKeywordsForClient(client);
    const index = clients.findIndex(c => c.id === id);
    clients[index] = updatedClient;
    await saveData();
    
    res.json(updatedClient);
  } catch (error) {
    console.error('Error checking keywords:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const newSettings = req.body;
    await saveSettings(newSettings);
    settings = newSettings; // Update the in-memory settings
    res.json(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize and start server
async function start() {
  try {
    await loadData();
    settings = await loadSettings();
    
    // Schedule keyword check every hour
    cron.schedule('0 * * * *', () => {
      checkAllKeywords();
    });
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();
