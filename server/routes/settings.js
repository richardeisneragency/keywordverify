const express = require('express');
const router = express.Router();

// In-memory storage for settings (replace with database in production)
let settings = {
  agencyEmails: [''],
  emailTemplate: {
    subject: '',
    message: ''
  }
};

// Get settings
router.get('/', (req, res) => {
  res.json(settings);
});

// Update settings
router.post('/', (req, res) => {
  const newSettings = req.body;
  
  // Validate settings
  if (!newSettings.agencyEmails || !Array.isArray(newSettings.agencyEmails)) {
    return res.status(400).json({ error: 'Invalid agencyEmails format' });
  }
  
  if (!newSettings.emailTemplate || typeof newSettings.emailTemplate !== 'object') {
    return res.status(400).json({ error: 'Invalid emailTemplate format' });
  }
  
  // Update settings
  settings = {
    agencyEmails: newSettings.agencyEmails.filter(email => email.trim() !== ''),
    emailTemplate: {
      subject: newSettings.emailTemplate.subject || '',
      message: newSettings.emailTemplate.message || ''
    }
  };
  
  res.json(settings);
});

module.exports = router;
