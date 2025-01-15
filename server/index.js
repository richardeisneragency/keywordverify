const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const settingsRouter = require('./routes/settings');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/settings', settingsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
