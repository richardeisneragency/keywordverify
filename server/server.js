const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer-core');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: ['https://keywordverify.com', 'https://www.keywordverify.com', 'http://localhost:3000'],
  credentials: true
}));
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

// Chrome executable paths for different environments
const CHROME_PATHS = {
  LINUX: '/usr/bin/google-chrome',  // Render's Linux environment
  MAC: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  WIN: 'C:\\Program Files\\Google Chrome\\Application\\chrome.exe'
};

async function initBrowser() {
  try {
    return await puppeteer.launch({
      executablePath: CHROME_PATHS.LINUX,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ],
      headless: 'new'
    });
  } catch (error) {
    console.error('Failed to launch browser:', error);
    throw error;
  }
}

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
  
  const browser = await initBrowser();
  
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
    
    // Get suggestions with more detailed scraping
    const suggestions = await page.evaluate(() => {
      const elements = document.querySelectorAll('ul[role="listbox"] li');
      const suggestionSet = new Set();
      
      elements.forEach(el => {
        // Get text content from spans and divs
        const spans = Array.from(el.querySelectorAll('span')).map(span => span.textContent.trim());
        const divs = Array.from(el.querySelectorAll('div')).map(div => div.textContent.trim());
        
        // Get direct text content
        const directText = el.childNodes[0]?.textContent?.trim();
        
        // Add all valid text content to the set
        [directText, ...spans, ...divs]
          .filter(text => text && text.length > 0)
          .forEach(text => suggestionSet.add(text));
      });
      
      return Array.from(suggestionSet);
    });
    
    // Clean suggestions
    const cleanedSuggestions = suggestions
      .filter(s => s && typeof s === 'string' && s.length > 0)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .filter(s => !s.includes('http') && !s.includes('www.'))
      .filter(s => s.length >= tracking.baseKeyword.length / 2); // Filter out very short suggestions
    
    console.log('Google Suggestions:', cleanedSuggestions);
    
    await browser.close();
    return [...new Set(cleanedSuggestions)]; // Final deduplication
  } catch (error) {
    console.error('Error in Google autosuggest:', error);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }
    return [];
  }
}

// Function to check Bing autosuggest
async function checkBingAutosuggest(tracking) {
  console.log('Checking Bing autosuggest for:', tracking.baseKeyword);
  
  const browser = await initBrowser();
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    await page.goto('https://www.bing.com', { waitUntil: 'networkidle0' });
    await page.type('#sb_form_q', tracking.baseKeyword);
    await page.waitForSelector('.sa_sg', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const suggestions = await page.evaluate(() => {
      const elements = document.querySelectorAll('.sa_sg');
      return Array.from(elements).map(el => el.textContent.trim());
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
  
  const browser = await initBrowser();
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    await page.goto('https://www.youtube.com', { waitUntil: 'networkidle0' });
    await page.type('input#search', tracking.baseKeyword);
    await page.waitForSelector('ytd-search-suggestion-renderer', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
  
  for (const client of clients) {
    await checkKeywordsForClient(client);
    updated = true;
  }
  
  if (updated) {
    console.log('Saving updated data...');
    await saveData();
  }
  
  console.log('Keyword check completed');
}

// API Routes
app.get('/api/clients', async (req, res) => {
  try {
    await loadData();
    res.json(clients);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const client = {
      ...req.body,
      id: Date.now().toString(),
      keywordTracking: req.body.keywordTracking || []
    };
    clients.push(client);
    await saveData();
    res.json(client);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedClient = req.body;
    const index = clients.findIndex(c => c.id === id);
    
    if (index !== -1) {
      clients[index] = updatedClient;
      await saveData();
      res.json(updatedClient);
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = clients.findIndex(c => c.id === id);
    
    if (index !== -1) {
      clients.splice(index, 1);
      await saveData();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/clients/:id/check-keywords', async (req, res) => {
  try {
    await loadData();
    const client = clients.find(c => c.id === req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check each keyword
    for (const keyword of client.keywordTracking) {
      const [googleSuggestions, bingSuggestions, youtubeSuggestions] = await Promise.all([
        client.platforms.google ? checkGoogleAutosuggest(keyword) : [],
        client.platforms.bing ? checkBingAutosuggest(keyword) : [],
        client.platforms.youtube ? checkYouTubeAutosuggest(keyword) : []
      ]);

      // Update status and first appearance
      const now = new Date().toISOString();
      
      if (client.platforms.google) {
        const found = googleSuggestions.some(s => isExactMatch(s, keyword.targetResult));
        if (found && !keyword.status.google) {
          keyword.firstAppearance.google = now;
        }
        keyword.status.google = found;
      }
      
      if (client.platforms.bing) {
        const found = bingSuggestions.some(s => isExactMatch(s, keyword.targetResult));
        if (found && !keyword.status.bing) {
          keyword.firstAppearance.bing = now;
        }
        keyword.status.bing = found;
      }
      
      if (client.platforms.youtube) {
        const found = youtubeSuggestions.some(s => isExactMatch(s, keyword.targetResult));
        if (found && !keyword.status.youtube) {
          keyword.firstAppearance.youtube = now;
        }
        keyword.status.youtube = found;
      }
      
      keyword.lastChecked = now;
    }

    // Save changes
    await saveData();
    
    res.json(client);
  } catch (error) {
    console.error('Error checking keywords:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/check-keywords', async (req, res) => {
  try {
    await checkAllKeywords();
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Settings routes
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    await saveSettings(settings);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Schedule daily check at midnight
cron.schedule('0 0 * * *', () => {
  checkAllKeywords().catch(console.error);
});

// Initialize and start server
async function start() {
  try {
    await loadData();
    await loadSettings();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
