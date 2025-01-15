import React, { useState, useEffect } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Container, 
  Box, 
  Snackbar, 
  Alert,
  AppBar,
  Toolbar,
  Typography,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  TextField
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ClientForm from './components/ClientForm';
import KeywordTrackingForm from './components/KeywordTrackingForm';
import AgencySettings from './components/AgencySettings';
import TestPage from './components/TestPage';
import { Client, KeywordTracking } from './types';
import { API_URL } from './config';
import { api } from './services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [value, setValue] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedClients = await api.getClients();
      setClients(loadedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleAddClient = async (client: Client) => {
    try {
      const savedClient = await api.addClient(client);
      setClients(prev => [...prev, savedClient]);
      setSnackbar({
        open: true,
        message: 'Client added successfully',
        severity: 'success'
      });
      navigate('/');
    } catch (error) {
      console.error('Error adding client:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add client',
        severity: 'error'
      });
    }
  };

  const handleUpdateClient = async (client: Client) => {
    try {
      const updatedClient = await api.updateClient(client);
      setClients(prev => prev.map(c => c.id === client.id ? updatedClient : c));
      setSnackbar({
        open: true,
        message: 'Client updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating client:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update client',
        severity: 'error'
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await api.deleteClient(clientId);
      setClients(prev => prev.filter(c => c.id !== clientId));
      setSnackbar({
        open: true,
        message: 'Client deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete client',
        severity: 'error'
      });
    }
  };

  const handleAddKeyword = async (clientId: string, keywordData: { baseKeyword: string; targetResult: string }) => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const newKeyword: KeywordTracking = {
        id: Date.now().toString(),
        baseKeyword: keywordData.baseKeyword,
        targetResult: keywordData.targetResult,
        status: {
          google: false,
          bing: false,
          youtube: false
        },
        firstAppearance: {
          google: null,
          bing: null,
          youtube: null
        },
        lastChecked: new Date().toISOString()
      };

      const updatedClient = {
        ...client,
        keywordTracking: [...client.keywordTracking, newKeyword]
      };

      await handleUpdateClient(updatedClient);
    } catch (error) {
      console.error('Error adding keyword:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add keyword',
        severity: 'error'
      });
    }
  };

  const handleDeleteKeyword = async (clientId: string, keywordId: string) => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const updatedClient = {
        ...client,
        keywordTracking: client.keywordTracking.filter(k => k.id !== keywordId)
      };

      await handleUpdateClient(updatedClient);
    } catch (error) {
      console.error('Error deleting keyword:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete keyword',
        severity: 'error'
      });
    }
  };

  const handleCheckKeywords = async (clientId: string) => {
    try {
      await api.checkKeywords();
      await loadClients();
      setSnackbar({
        open: true,
        message: 'Keywords checked successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error checking keywords:', error);
      setSnackbar({
        open: true,
        message: 'Failed to check keywords',
        severity: 'error'
      });
    }
  };

  const filteredClients = clients.filter(client => 
    client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Keyword Verification
          </Typography>
          <Button color="inherit" component={Link} to="/">
            Clients
          </Button>
          <Button color="inherit" component={Link} to="/settings">
            Settings
          </Button>
          <Button color="inherit" component={Link} to="/test">
            Test
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Routes>
            <Route path="/settings" element={<AgencySettings />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/add-client" element={
              <ClientForm onSubmit={handleAddClient} clients={clients} />
            } />
            <Route path="/" element={
              <>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h4" component="h1">
                    Clients
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/add-client"
                    sx={{
                      py: 2,
                      px: 6,
                      fontSize: '1.125rem',
                      backgroundColor: '#2563eb',
                      '&:hover': {
                        backgroundColor: '#1d4ed8'
                      }
                    }}
                  >
                    Add Client
                  </Button>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    placeholder="Search clients..."
                    size="small"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ backgroundColor: 'white' }}
                  />
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <div style={{ gap: '2rem' }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    filteredClients.map(client => (
                      <div key={client.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                          <div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#333' }}>{client.companyName}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              {client.contactName && (
                                <p style={{ margin: 0, color: '#6b7280' }}>
                                  Contact: {client.contactName}
                                </p>
                              )}
                              {client.email && (
                                <p style={{ margin: 0, color: '#6b7280' }}>
                                  Email: {client.email}
                                </p>
                              )}
                              {client.phone && (
                                <p style={{ margin: 0, color: '#6b7280' }}>
                                  Phone: {client.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button
                              variant="outlined"
                              onClick={() => handleCheckKeywords(client.id)}
                              sx={{
                                borderColor: '#6b7280',
                                color: '#6b7280',
                                '&:hover': {
                                  borderColor: '#4b5563',
                                  backgroundColor: 'transparent'
                                }
                              }}
                            >
                              Check Keywords
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleDeleteClient(client.id)}
                              sx={{
                                borderColor: '#ef4444',
                                color: '#ef4444',
                                '&:hover': {
                                  borderColor: '#dc2626',
                                  backgroundColor: 'transparent'
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                          <div style={{ backgroundColor: client.platforms.google ? '#dcfce7' : '#fee2e2', color: client.platforms.google ? '#166534' : '#991b1b', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                            Google
                          </div>
                          <div style={{ backgroundColor: client.platforms.bing ? '#dcfce7' : '#fee2e2', color: client.platforms.bing ? '#166534' : '#991b1b', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                            Bing
                          </div>
                          <div style={{ backgroundColor: client.platforms.youtube ? '#dcfce7' : '#fee2e2', color: client.platforms.youtube ? '#166534' : '#991b1b', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                            YouTube
                          </div>
                        </div>

                        <Button
                          onClick={() => setExpandedClients(prev => ({ ...prev, [client.id]: !prev[client.id] }))}
                          sx={{
                            color: '#6b7280',
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: 'transparent',
                              color: '#4b5563'
                            }
                          }}
                        >
                          {expandedClients[client.id] ? 'Hide Keywords' : 'Show Keywords'}
                        </Button>

                        {expandedClients[client.id] && (
                          <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Keywords</h3>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#f9fafb' }}>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Base Keyword</th>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Target Result</th>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>First Appearance</th>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Last Checked</th>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {client.keywordTracking.map(keyword => (
                                    <tr key={keyword.id}>
                                      <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>{keyword.baseKeyword}</td>
                                      <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>{keyword.targetResult}</td>
                                      <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                          {Object.entries(keyword.status).map(([platform, status]) => (
                                            <div
                                              key={platform}
                                              style={{
                                                backgroundColor: status ? '#dcfce7' : '#fee2e2',
                                                color: status ? '#166534' : '#991b1b',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem',
                                                textTransform: 'capitalize'
                                              }}
                                            >
                                              {platform}
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                      <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                                        {Object.entries(keyword.firstAppearance).map(([platform, date]) => (
                                          date && (
                                            <div key={platform} style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                              {platform}: {new Date(date).toLocaleDateString()}
                                            </div>
                                          )
                                        ))}
                                      </td>
                                      <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                                        {new Date(keyword.lastChecked).toLocaleDateString()}
                                      </td>
                                      <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                                        <Button
                                          variant="outlined"
                                          color="error"
                                          size="small"
                                          onClick={() => handleDeleteKeyword(client.id, keyword.id)}
                                          sx={{
                                            borderColor: '#ef4444',
                                            color: '#ef4444',
                                            '&:hover': {
                                              borderColor: '#dc2626',
                                              backgroundColor: 'transparent'
                                            }
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <KeywordTrackingForm
                              onSubmit={(data) => handleAddKeyword(client.id, data)}
                              client={client}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            } />
          </Routes>
        </Box>
      </Container>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
