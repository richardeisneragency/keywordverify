import { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

interface Props {
  onSubmit: (data: { baseKeyword: string; targetResult: string }) => void;
}

export default function KeywordTrackingForm({ onSubmit }: Props) {
  const [formData, setFormData] = useState({
    baseKeyword: '',
    targetResult: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.baseKeyword.trim() && formData.targetResult.trim()) {
      onSubmit(formData);
      setFormData({ baseKeyword: '', targetResult: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr auto',
        gap: 2, 
        alignItems: 'flex-start',
        mb: 3
      }}>
        <TextField
          label="Search Term"
          value={formData.baseKeyword}
          onChange={(e) => setFormData({ ...formData, baseKeyword: e.target.value })}
          placeholder="e.g., dentist manhattan"
          size="small"
          required
          fullWidth
        />
        <TextField
          label="Expected Result"
          value={formData.targetResult}
          onChange={(e) => setFormData({ ...formData, targetResult: e.target.value })}
          placeholder="e.g., dentist manhattan Bright Smile Dental"
          size="small"
          required
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="medium"
          sx={{ height: '40px' }}
        >
          Add Keyword
        </Button>
      </Box>
    </form>
  );
}
