# Keyword Verification Tool

A web application for tracking keywords in Google, Bing, and YouTube autosuggest results. The system monitors specified keywords for clients and sends notifications when keywords appear in the autosuggest results for the first time.

## Features

- Client Management
  - Store company information and contact details
  - Track multiple keywords per client
  - Select platforms to monitor (Google, Bing, YouTube)
  - Add/edit/delete clients and keywords

- Keyword Tracking
  - Daily automated checks for keyword appearance in autosuggest
  - Real-time status tracking for each platform
  - First appearance date tracking
  - Email notifications when keywords appear

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for components
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- Puppeteer for web scraping
- Node-cron for scheduled tasks
- Nodemailer for email notifications

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   ```

3. Configure environment variables:
   - Copy `server/.env.example` to `server/.env`
   - Update the email configuration in `.env`

4. Start the development servers:
   ```bash
   # Start backend server (from server directory)
   npm run dev

   # Start frontend development server (from root directory)
   npm run dev
   ```

## Deployment

### GitHub Setup

1. Create a new GitHub repository
2. Initialize git and push the code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

### Render Deployment

1. Create a Render account at https://render.com
2. Connect your GitHub repository
3. Create two new web services:

#### Backend API Service
1. Click "New +" and select "Web Service"
2. Connect your GitHub repo
3. Configure the service:
   - Name: keyword-verification-api
   - Root Directory: server
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. Add environment variables:
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `NODE_ENV=production`

#### Frontend Static Site
1. Click "New +" and select "Static Site"
2. Connect your GitHub repo
3. Configure the service:
   - Name: keyword-verification-frontend
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Add environment variable:
   - `VITE_API_URL`: URL of your backend API service

After deployment, update your domain's DNS settings to point to the Render frontend service.

## API Endpoints

- `GET /api/clients` - Get all clients
- `POST /api/clients` - Add a new client
- `PUT /api/clients/:id` - Update a client
- `DELETE /api/clients/:id` - Delete a client
- `POST /api/check-keywords` - Manually trigger keyword check

## Environment Variables

- `PORT` - Server port (default: 3000)
- `EMAIL_USER` - Gmail account for sending notifications
- `EMAIL_PASS` - Gmail app-specific password

## Notes

- The application uses Gmail for sending notifications. You'll need to set up an app-specific password in your Google Account settings.
- Keyword checks are scheduled to run daily at midnight.
- For production use, consider implementing a proper database instead of in-memory storage.
