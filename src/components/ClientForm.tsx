import React, { useState } from 'react';
import {
  TextField,
  Button,
  Grid,
  FormControlLabel,
  FormGroup,
  Checkbox,
  IconButton,
  Typography,
  Paper,
  Stack
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { Client } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../config';

interface ClientFormProps {
  onSubmit: (client: Client) => void;
  clients?: Client[];
}

const defaultClient: Client = {
  id: '',
  companyName: '',
  contactName: '',
  emails: [],
  phone: '',
  notifyClient: true,
  platforms: {
    google: true,
    bing: false,
    youtube: false
  },
  keywordTracking: []
};

const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, clients }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const initialData = id && clients ? clients.find(c => c.id === id) : undefined;

  const [client, setClient] = useState<Client>(initialData || defaultClient);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/clients${client.id ? `/${client.id}` : ''}`, {
        method: client.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(client),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save client');
      }
      
      const savedClient = await response.json();
      onSubmit(savedClient);
      if (!client.id) {
        setClient({
          id: '',
          companyName: '',
          contactName: '',
          emails: [],
          phone: '',
          notifyClient: true,
          platforms: {
            google: true,
            bing: false,
            youtube: false
          },
          keywordTracking: []
        });
      }
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...client.emails];
    newEmails[index] = value;
    setClient(prev => ({
      ...prev,
      emails: newEmails
    }));
  };

  const handleAddEmail = () => {
    setClient(prev => ({
      ...prev,
      emails: [...prev.emails, '']
    }));
  };

  const handleRemoveEmail = (index: number) => {
    setClient(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index)
    }));
  };

  const handlePlatformChange = (platform: keyof typeof client.platforms) => {
    setClient(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: !prev.platforms[platform]
      }
    }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Company Name"
              name="companyName"
              value={client.companyName}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Contact Name"
              name="contactName"
              value={client.contactName}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Email Addresses
            </Typography>
            {client.emails.map((email, index) => (
              <Stack key={index} direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                />
                <IconButton
                  onClick={() => handleRemoveEmail(index)}
                  disabled={client.emails.length === 1}
                  color="error"
                >
                  <RemoveIcon />
                </IconButton>
                {index === client.emails.length - 1 && (
                  <IconButton onClick={handleAddEmail} color="primary">
                    <AddIcon />
                  </IconButton>
                )}
              </Stack>
            ))}
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={client.phone}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={client.notifyClient}
                    onChange={(e) => setClient(prev => ({ ...prev, notifyClient: e.target.checked }))}
                  />
                }
                label="Send notifications to client"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Search Platforms
            </Typography>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={client.platforms.google}
                    onChange={() => handlePlatformChange('google')}
                  />
                }
                label="Google"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={client.platforms.bing}
                    onChange={() => handlePlatformChange('bing')}
                  />
                }
                label="Bing"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={client.platforms.youtube}
                    onChange={() => handlePlatformChange('youtube')}
                  />
                }
                label="YouTube"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
            >
              {id ? 'Update Client' : 'Add Client'}
            </Button>
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
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default ClientForm;
