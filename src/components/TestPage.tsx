import { Box, TextField, Typography } from '@mui/material';
import { useState } from 'react';

export default function TestPage() {
  const [value, setValue] = useState('');

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Test Page</Typography>
      <TextField 
        label="Test Input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        fullWidth
      />
    </Box>
  );
}
