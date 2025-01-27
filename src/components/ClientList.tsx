import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Button,
  Typography,
  Box,
  Collapse,
  TextField,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Client } from '../types';

interface Props {
  clients: Client[];
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

interface RowProps {
  client: Client;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

function Row({ client, onUpdateClient, onDeleteClient }: RowProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{client.companyName}</TableCell>
        <TableCell>{client.contactName}</TableCell>
        <TableCell>{client.email}</TableCell>
        <TableCell>{client.phone}</TableCell>
        <TableCell>
          {Object.entries(client.platforms)
            .filter(([_, enabled]) => enabled)
            .map(([platform]) => platform)
            .join(', ')}
        </TableCell>
        <TableCell>{client.keywordTracking.length}</TableCell>
        <TableCell>
          <IconButton 
            onClick={() => navigate(`/edit-client/${client.id}`)}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            onClick={() => onDeleteClient(client.id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Keyword Tracking
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Base Keyword</TableCell>
                    <TableCell>Target Result</TableCell>
                    <TableCell>Google Status</TableCell>
                    <TableCell>Bing Status</TableCell>
                    <TableCell>YouTube Status</TableCell>
                    <TableCell>Last Checked</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {client.keywordTracking.map((tracking) => (
                    <TableRow key={tracking.id}>
                      <TableCell>{tracking.baseKeyword}</TableCell>
                      <TableCell>{tracking.targetResult}</TableCell>
                      <TableCell>
                        {tracking.status.google ? (
                          <Typography color="success.main">
                            Found ({new Date(tracking.firstAppearance.google || '').toLocaleDateString()})
                          </Typography>
                        ) : (
                          <Typography color="text.secondary">Not Found</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {tracking.status.bing ? (
                          <Typography color="success.main">
                            Found ({new Date(tracking.firstAppearance.bing || '').toLocaleDateString()})
                          </Typography>
                        ) : (
                          <Typography color="text.secondary">Not Found</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {tracking.status.youtube ? (
                          <Typography color="success.main">
                            Found ({new Date(tracking.firstAppearance.youtube || '').toLocaleDateString()})
                          </Typography>
                        ) : (
                          <Typography color="text.secondary">Not Found</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(tracking.lastChecked).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function ClientList({ clients, onUpdateClient, onDeleteClient }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredClients = clients.filter(client => 
    client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={() => navigate('/add-client')}
        >
          Add New Client
        </Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell colSpan={6}>
                <TextField
                  placeholder="Search clients..."
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ width: '300px' }}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell />
              <TableCell>Company Name</TableCell>
              <TableCell>Contact Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.map((client) => (
              <Row
                key={client.id}
                client={client}
                onUpdateClient={onUpdateClient}
                onDeleteClient={onDeleteClient}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
