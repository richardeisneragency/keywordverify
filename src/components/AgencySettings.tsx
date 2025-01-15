import { useState, useEffect } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { API_URL } from '../config';

interface Settings {
  agencyEmails: string[];
  emailTemplate: {
    subject: string;
    message: string;
  };
}

export default function AgencySettings() {
  console.log('AgencySettings component rendering');
  
  const [settings, setSettings] = useState<Settings>({
    agencyEmails: [''],
    emailTemplate: {
      subject: '',
      message: ''
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AgencySettings useEffect running');
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    console.log('Fetching settings...');
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/settings`);
      console.log('Settings response:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      console.log('Settings data:', data);
      // Ensure there's at least one empty email field if no emails are set
      setSettings({
        ...data,
        agencyEmails: data.agencyEmails.length > 0 ? data.agencyEmails : ['']
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    console.log('Email change:', index, value);
    const newEmails = [...settings.agencyEmails];
    newEmails[index] = value;
    setSettings({ ...settings, agencyEmails: newEmails });
  };

  const addEmailField = () => {
    console.log('Adding email field');
    setSettings({
      ...settings,
      agencyEmails: [...settings.agencyEmails, '']
    });
  };

  const removeEmailField = (index: number) => {
    console.log('Removing email field:', index);
    const newEmails = settings.agencyEmails.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      agencyEmails: newEmails.length ? newEmails : ['']
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting settings:', settings);
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
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
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  console.log('Current state:', { settings, isLoading, error });

  if (isLoading) {
    console.log('Rendering loading state');
    return (
      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    console.log('Rendering error state');
    return (
      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={fetchSettings}>
          Retry
        </Button>
      </Paper>
    );
  }

  console.log('Rendering main form');
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
