import { useState, useEffect } from 'react';
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
  Paper,
  CircularProgress
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ClientForm from './components/ClientForm';
import KeywordTrackingForm from './components/KeywordTrackingForm';
import AgencySettings from './components/AgencySettings';
import { Client } from './types';

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
  const [clients, setClients] = useState<Client[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => 
    client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (clientData: Client) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      const data = await response.json();
      setClients([...clients, data]);
      setExpandedClients(prev => ({ ...prev, [data.id]: true }));
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
        message: 'Error adding client',
        severity: 'error'
      });
    }
  };

  const handleUpdateClient = async (clientData: Client) => {
    try {
      const response = await fetch(`/api/clients/${clientData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      const data = await response.json();
      setClients(clients.map(client => client.id === data.id ? data : client));
      setSnackbar({
        open: true,
        message: 'Client updated successfully',
        severity: 'success'
      });
      navigate('/');
    } catch (error) {
      console.error('Error updating client:', error);
      setSnackbar({
        open: true,
        message: 'Error updating client',
        severity: 'error'
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await fetch(`/api/clients/${clientId}`, {
          method: 'DELETE',
        });
        setClients(clients.filter(client => client.id !== clientId));
        setSnackbar({
          open: true,
          message: 'Client deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting client:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting client',
          severity: 'error'
        });
      }
    }
  };

  const handleAddKeyword = async (clientId: string, keywordData: { baseKeyword: string; targetResult: string }) => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const updatedClient = {
        ...client,
        keywordTracking: [...client.keywordTracking, {
          ...keywordData,
          id: Date.now().toString(),
          status: { google: false, bing: false, youtube: false },
          firstAppearance: { google: null, bing: null, youtube: null },
          lastChecked: null
        }]
      };

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedClient),
      });

      const data = await response.json();
      setClients(clients.map(c => c.id === clientId ? data : c));
      setSnackbar({
        open: true,
        message: 'Keyword added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding keyword:', error);
      setSnackbar({
        open: true,
        message: 'Error adding keyword',
        severity: 'error'
      });
    }
  };

  const handleDeleteKeyword = async (clientId: string, keywordId: string) => {
    if (window.confirm('Are you sure you want to delete this keyword?')) {
      try {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;

        const updatedClient = {
          ...client,
          keywordTracking: client.keywordTracking.filter(k => k.id !== keywordId)
        };

        const response = await fetch(`/api/clients/${clientId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedClient),
        });

        const data = await response.json();
        setClients(clients.map(c => c.id === clientId ? data : c));
        setSnackbar({
          open: true,
          message: 'Keyword deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting keyword:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting keyword',
          severity: 'error'
        });
      }
    }
  };

  const handleCheckKeywords = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/check-keywords`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setClients(clients.map(c => c.id === clientId ? data : c));
      setSnackbar({
        open: true,
        message: 'Keywords checked successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error checking keywords:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error checking keywords',
        severity: 'error'
      });
    }
  };

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
            Agency Settings
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Routes>
            <Route path="/settings" element={<AgencySettings />} />
            <Route path="/add-client" element={
              <ClientForm onSubmit={handleAddClient} clients={clients} />
            } />
            <Route path="/edit-client/:id" element={
              <ClientForm onSubmit={handleUpdateClient} clients={clients} />
            } />
            <Route path="/add-keyword/:clientId" element={
              <KeywordTrackingForm onSubmit={handleAddKeyword} />
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
                  >
                    Add Client
                  </Button>
                </Box>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1.5rem' }}>
                  <div style={{ flexGrow: 1 }}>
                    <input
                      type="text"
                      placeholder="Search companies or contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ 
                        padding: '1.5rem',
                        fontSize: '1.25rem',
                        width: '100%',
                        borderRadius: '0.75rem',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                    />
                  </div>
                  <Link
                    to="/add-client"
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '1.5rem 3rem',
                      fontSize: '1.25rem',
                      fontWeight: 500,
                      borderRadius: '0.75rem',
                      whiteSpace: 'nowrap',
                      textDecoration: 'none'
                    }}
                  >
                    Add New Client
                  </Link>
                </div>

                <div style={{ gap: '2rem' }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : error ? (
                    <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
                  ) : (
                    filteredClients.map(client => (
                      <div key={client.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                          <div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#333' }}>{client.companyName}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <button
                                onClick={() => setExpandedClients(prev => ({ ...prev, [client.id]: !prev[client.id] }))}
                                style={{ color: '#666', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.25rem' }}
                              >
                                {expandedClients[client.id] ? '▼' : '▶'}
                              </button>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                              onClick={() => handleCheckKeywords(client.id)}
                              style={{
                                backgroundColor: '#22c55e',
                                color: 'white',
                                padding: '1rem 2rem',
                                fontSize: '1.125rem',
                                fontWeight: 500,
                                borderRadius: '0.75rem',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              Check Keywords
                            </button>
                            <Link
                              to={`/edit-client/${client.id}`}
                              style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                padding: '1rem 2rem',
                                fontSize: '1.125rem',
                                fontWeight: 500,
                                borderRadius: '0.75rem',
                                textDecoration: 'none'
                              }}
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                padding: '1rem 2rem',
                                fontSize: '1.125rem',
                                fontWeight: 500,
                                borderRadius: '0.75rem',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {expandedClients[client.id] && (
                          <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Keywords</h3>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f7f7f7' }}>
                                  <tr>
                                    <th style={{ padding: '1rem', fontSize: '1rem', fontWeight: 500, textAlign: 'left' }}>Search Term</th>
                                    <th style={{ padding: '1rem', fontSize: '1rem', fontWeight: 500, textAlign: 'left' }}>Expected Result</th>
                                    <th style={{ padding: '1rem', fontSize: '1rem', fontWeight: 500, textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '1rem', fontSize: '1rem', fontWeight: 500, textAlign: 'left' }}>Last Checked</th>
                                    <th style={{ padding: '1rem', fontSize: '1rem', fontWeight: 500, textAlign: 'left' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {client.keywordTracking.map(keyword => (
                                    <tr key={keyword.id}>
                                      <td style={{ padding: '1rem', fontSize: '1rem', borderBottom: '1px solid #ddd' }}>{keyword.baseKeyword}</td>
                                      <td style={{ padding: '1rem', fontSize: '1rem', borderBottom: '1px solid #ddd', color: '#2563eb', fontWeight: 500 }}>{keyword.targetResult}</td>
                                      <td style={{ padding: '1rem', fontSize: '1rem', borderBottom: '1px solid #ddd' }}>
                                        {Object.entries(keyword.status).map(([platform, found]) => (
                                          found && <span key={platform} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.5rem', backgroundColor: '#c6efce', color: '#33c759', marginRight: '1rem' }}>
                                            {platform}
                                          </span>
                                        ))}
                                      </td>
                                      <td style={{ padding: '1rem', fontSize: '1rem', borderBottom: '1px solid #ddd' }}>
                                        {keyword.lastChecked ? new Date(keyword.lastChecked).toLocaleString() : 'Never'}
                                      </td>
                                      <td style={{ padding: '1rem', fontSize: '1rem', borderBottom: '1px solid #ddd' }}>
                                        <button
                                          onClick={() => handleDeleteKeyword(client.id, keyword.id)}
                                          style={{ color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1rem' }}
                                        >
                                          Delete
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div style={{ marginTop: '2rem' }}>
                              <h4 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '1rem' }}>Add New Keyword</h4>
                              <KeywordTrackingForm
                                onSubmit={(keywordData) => handleAddKeyword(client.id, keywordData)}
                              />
                            </div>
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
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity as any}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
