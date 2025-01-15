// Use localhost for development, API subdomain for production
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_ENV === 'production' ? 'https://api.example.com' : 'http://localhost:3000');
