import { TextField, Box, Typography } from '@mui/material';
import { useState } from 'react';

export default function TestSearch() {
  const [value, setValue] = useState('');
  
  return (
    <Box sx={{ p: 2, border: '1px solid red' }}>
      <Typography>Test Search Component</Typography>
      <TextField
        label="Test Search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Box>
  );
}
