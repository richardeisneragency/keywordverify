import { useState, useEffect } from 'react';
import { 
  Paper, 
  TextField, 
  Button, 
  Box, 
  Typography, 
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  IconButton,
  Stack
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { Client } from '../types';

interface Props {
  onSubmit: (client: Client) => void;
  clients?: Client[];
}

export default function ClientForm({ onSubmit, clients }: Props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState<Client>({
    id: id || '',
    companyName: '',
    contactName: '',
    emails: [''],
    phone: '',
    notifyClient: true,
    platforms: {
      google: true,
      bing: false,
      youtube: false
    },
    keywordTracking: []
  });

  useEffect(() => {
    if (id && clients) {
      const client = clients.find(c => c.id === id);
      if (client) {
        // Convert old email format to new emails array if necessary
        const updatedClient = {
          ...client,
          emails: client.emails || (client.email ? [client.email] : [''])
        };
        setFormData(updatedClient);
      }
    }
  }, [id, clients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty email addresses
    const cleanedFormData = {
      ...formData,
      emails: formData.emails.filter(email => email.trim() !== '')
    };
    onSubmit(cleanedFormData);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...formData.emails];
    newEmails[index] = value;
    setFormData({ ...formData, emails: newEmails });
  };

  const addEmailField = () => {
    setFormData({ ...formData, emails: [...formData.emails, ''] });
  };

  const removeEmailField = (index: number) => {
    const newEmails = formData.emails.filter((_, i) => i !== index);
    setFormData({ ...formData, emails: newEmails.length ? newEmails : [''] });
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#2563eb' }}>
        {id ? 'Edit Client' : 'Add New Client'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
              fullWidth
              sx={{ 
                '& .MuiInputBase-input': {
                  fontSize: '1.125rem',
                  padding: '1rem'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Contact Name"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              fullWidth
              sx={{ 
                '& .MuiInputBase-input': {
                  fontSize: '1.125rem',
                  padding: '1rem'
                }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2, color: '#4b5563' }}>
              Notification Emails
            </Typography>
            {formData.emails.map((email, index) => (
              <Stack key={index} direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  label={`Email ${index + 1}`}
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  sx={{ 
                    '& .MuiInputBase-input': {
                      fontSize: '1.125rem',
                      padding: '1rem'
                    }
                  }}
                />
                <IconButton
                  onClick={() => removeEmailField(index)}
                  disabled={formData.emails.length === 1}
                  color="error"
                >
                  <RemoveIcon />
                </IconButton>
                {index === formData.emails.length - 1 && (
                  <IconButton onClick={addEmailField} color="primary">
                    <AddIcon />
                  </IconButton>
                )}
              </Stack>
            ))}
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
              sx={{ 
                '& .MuiInputBase-input': {
                  fontSize: '1.125rem',
                  padding: '1rem'
                }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.notifyClient}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifyClient: e.target.checked
                    })}
                  />
                }
                label="Send notifications to client"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2, color: '#4b5563' }}>
              Search Platforms
            </Typography>
            <FormGroup row sx={{ gap: 4 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.platforms.google}
                    onChange={(e) => setFormData({
                      ...formData,
                      platforms: { ...formData.platforms, google: e.target.checked }
                    })}
                    sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                  />
                }
                label={<Typography sx={{ fontSize: '1.125rem' }}>Google</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.platforms.bing}
                    onChange={(e) => setFormData({
                      ...formData,
                      platforms: { ...formData.platforms, bing: e.target.checked }
                    })}
                    sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                  />
                }
                label={<Typography sx={{ fontSize: '1.125rem' }}>Bing</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.platforms.youtube}
                    onChange={(e) => setFormData({
                      ...formData,
                      platforms: { ...formData.platforms, youtube: e.target.checked }
                    })}
                    sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                  />
                }
                label={<Typography sx={{ fontSize: '1.125rem' }}>YouTube</Typography>}
              />
            </FormGroup>
          </Grid>
          <Grid item xs={12} sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              onClick={() => navigate('/')}
              variant="outlined"
              size="large"
              sx={{ 
                py: 2,
                px: 6,
                fontSize: '1.125rem',
                borderColor: '#6b7280',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#4b5563',
                  backgroundColor: 'transparent'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ 
                py: 2,
                px: 6,
                fontSize: '1.125rem',
                backgroundColor: '#3b82f6',
                '&:hover': {
                  backgroundColor: '#2563eb'
                }
              }}
            >
              {id ? 'Update Client' : 'Add Client'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
