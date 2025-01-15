const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const settingsRouter = require('./routes/settings');

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS for both development and production
const allowedOrigins = [
  'http://localhost:5173',  // Local development
  'https://keywordverify.com',  // Production domain
  'https://www.keywordverify.com'  // Production www subdomain
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(bodyParser.json());

// Routes
app.use('/api/settings', settingsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
