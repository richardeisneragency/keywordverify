import React, { useState } from 'react';
import {
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Grid,
  IconButton,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Client } from '../types';

interface ClientFormProps {
  onSubmit: (client: Client) => void;
  clients: Client[];
}

const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, clients }) => {
  const [client, setClient] = useState<Client>({
    id: '',
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    notifyClient: false,
    platforms: {
      google: true,
      bing: false,
      youtube: false
    },
    keywordTracking: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(client);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name.startsWith('platforms.')) {
        const platform = name.split('.')[1];
        setClient(prev => ({
          ...prev,
          platforms: {
            ...prev.platforms,
            [platform]: checked
          }
        }));
      } else {
        setClient(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setClient(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6">Add New Client</Typography>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Company Name"
            name="companyName"
            value={client.companyName}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Contact Name"
            name="contactName"
            value={client.contactName}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={client.email}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={client.phone}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={client.notifyClient || false}
                onChange={handleChange}
                name="notifyClient"
              />
            }
            label="Notify Client"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1">Platforms</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={client.platforms.google}
                onChange={handleChange}
                name="platforms.google"
              />
            }
            label="Google"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={client.platforms.bing}
                onChange={handleChange}
                name="platforms.bing"
              />
            }
            label="Bing"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={client.platforms.youtube}
                onChange={handleChange}
                name="platforms.youtube"
              />
            }
            label="YouTube"
          />
        </Grid>

        <Grid item xs={12}>
          <Button type="submit" variant="contained" color="primary">
            Add Client
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default ClientForm;
