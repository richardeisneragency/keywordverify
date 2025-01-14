import { useState, useEffect } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

interface Settings {
  agencyEmails: string[];
  emailTemplate: {
    subject: string;
    message: string;
  };
}

export default function AgencySettings() {
  const [settings, setSettings] = useState<Settings>({
    agencyEmails: [''],
    emailTemplate: {
      subject: '',
      message: ''
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...settings.agencyEmails];
    newEmails[index] = value;
    setSettings({ ...settings, agencyEmails: newEmails });
  };

  const addEmailField = () => {
    setSettings({
      ...settings,
      agencyEmails: [...settings.agencyEmails, '']
    });
  };

  const removeEmailField = (index: number) => {
    const newEmails = settings.agencyEmails.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      agencyEmails: newEmails.length ? newEmails : ['']
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...settings,
          agencyEmails: settings.agencyEmails.filter(email => email.trim() !== '')
        })
      });
      if (!response.ok) throw new Error('Failed to save settings');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Agency Settings
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Agency Email Notifications
          </Typography>
          {settings.agencyEmails.map((email, index) => (
            <Stack key={index} direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                fullWidth
                label={`Agency Email ${index + 1}`}
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
              />
              <IconButton
                onClick={() => removeEmailField(index)}
                disabled={settings.agencyEmails.length === 1}
                color="error"
              >
                <RemoveIcon />
              </IconButton>
              {index === settings.agencyEmails.length - 1 && (
                <IconButton onClick={addEmailField} color="primary">
                  <AddIcon />
                </IconButton>
              )}
            </Stack>
          ))}
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Email Template
          </Typography>
          <TextField
            fullWidth
            label="Email Subject"
            value={settings.emailTemplate.subject}
            onChange={(e) => setSettings({
              ...settings,
              emailTemplate: { ...settings.emailTemplate, subject: e.target.value }
            })}
            helperText="Use {{platform}}, {{companyName}}, etc. as placeholders"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email Message"
            value={settings.emailTemplate.message}
            onChange={(e) => setSettings({
              ...settings,
              emailTemplate: { ...settings.emailTemplate, message: e.target.value }
            })}
            multiline
            rows={6}
            helperText="Use {{platform}}, {{companyName}}, {{baseKeyword}}, {{targetResult}}, {{foundDate}} as placeholders"
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
