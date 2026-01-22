# Backend Setup Guide

The backend is an Express.js API server that handles whiteboard data, financial information, and AI integration.

## Prerequisites

- Node.js 18 or higher
- MongoDB (local or cloud instance)
- Cloudinary account (for file uploads)

## Installation

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

## Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
# Server Configuration
PORT=5050

# AI Server
AI_BASE_URL=http://localhost:8000

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/vantage
MONGODB_DB=vantage

# Cloudinary (for file uploads)
# Get these from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Environment Variables

#### Required

- `AI_BASE_URL`: URL of the AI server (default: http://localhost:8000)

#### Optional

- `PORT`: Server port (default: 5050)
- `MONGODB_URI`: MongoDB connection string (if using MongoDB storage)
- `MONGODB_DB`: MongoDB database name (default: vantage)
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name (for file uploads)
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

## Storage Modes

The backend supports two storage modes:

### 1. File Storage (Default)

Stores data in `data.json` file. No database required.

- Pros: Simple setup, no external dependencies
- Cons: Not suitable for production, no concurrent access

### 2. MongoDB Storage

Stores data in MongoDB database.

- Pros: Production-ready, scalable, concurrent access
- Cons: Requires MongoDB instance

To use MongoDB, set the `MONGODB_URI` environment variable.

## MongoDB Setup

### Local MongoDB

1. Install MongoDB:

```bash
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

2. Start MongoDB:

```bash
# macOS/Linux
mongod --dbpath /path/to/data

# Or use brew services (macOS)
brew services start mongodb-community
```

3. Set environment variable:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/vantage
```

### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Set environment variable:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vantage
```

## Cloudinary Setup

Cloudinary is used for image and document uploads.

1. Create account at [Cloudinary](https://cloudinary.com)
2. Get credentials from dashboard
3. Set environment variables:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Development

Start the development server with auto-reload:

```bash
npm run dev
```

The server will be available at `http://localhost:5050`

## Production

Start the production server:

```bash
npm start
```

## API Endpoints

### Health Check

```
GET /health
```

Returns server status and storage mode.

### Whiteboards

```
GET    /whiteboards              # List all whiteboards
POST   /whiteboards              # Create whiteboard
GET    /whiteboards/:id          # Get whiteboard
PATCH  /whiteboards/:id          # Update whiteboard
DELETE /whiteboards/:id          # Delete whiteboard
```

### Nodes

```
POST   /whiteboards/:id/nodes              # Create node
PATCH  /whiteboards/:id/nodes/:nodeId      # Update node
DELETE /whiteboards/:id/nodes/:nodeId      # Delete node
```

### Edges

```
POST   /whiteboards/:id/edges              # Create edge
DELETE /whiteboards/:id/edges/:edgeId      # Delete edge
```

### Chat

```
GET  /whiteboards/:id/nodes/:nodeId/messages    # Get messages
POST /whiteboards/:id/nodes/:nodeId/chat        # Send message
POST /whiteboards/:id/nodes/master/chat         # Master AI chat
```

### Finance

```
GET /finance/company/:ticker              # Get company data
GET /finance/search?q=query               # Search companies
GET /finance/chart/:ticker?timeframe=1M   # Get chart data
```

### AI

```
GET /ai/models                            # List available models
```

### File Uploads

```
POST /upload/image                        # Upload image
POST /upload/document                     # Upload document
```

### Map Generation

```
POST /whiteboards/:id/generate-map        # Generate knowledge map
```

## Project Structure

```
backend/
├── index.js              # Main server file
├── store.js              # Data access layer
├── storage/              # Storage adapters
│   ├── index.js         # Storage mode selector
│   ├── file.js          # File-based storage
│   └── mongo.js         # MongoDB storage
├── data.json            # File storage (if used)
├── package.json         # Dependencies
└── .env                 # Environment variables
```

## Key Features

### Context-Aware AI Chat

The backend builds context from connected nodes when chatting:

```javascript
// Includes current node + all connected nodes
const context = buildFullContext(board, node);
```

### Real-Time Financial Data

Uses Yahoo Finance API for live market data:

```javascript
const quote = await yahooFinance.quote('AAPL');
const historical = await yahooFinance.chart('AAPL', { period1: date });
```

### Streaming AI Responses

Streams AI responses token-by-token:

```javascript
const reader = aiRes.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  res.write(chunk);
}
```

## Deployment

### Railway

1. Install Railway CLI:

```bash
npm i -g @railway/cli
```

2. Login and deploy:

```bash
railway login
railway init
railway up
```

3. Set environment variables in Railway dashboard

### Render

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5050
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t vantage-backend .
docker run -p 5050:5050 --env-file .env vantage-backend
```

## Troubleshooting

### Port Already in Use

Change port in `.env`:

```bash
PORT=5051
```

### MongoDB Connection Failed

Check MongoDB is running:

```bash
mongosh
```

Verify connection string format:

```bash
mongodb://[username:password@]host[:port]/database
```

### Cloudinary Upload Failed

Verify credentials are correct and account is active.

### AI Server Not Responding

Check AI server is running on correct port:

```bash
curl http://localhost:8000/models
```

## Performance Tips

- Use MongoDB for production (better than file storage)
- Enable MongoDB indexes for faster queries
- Use connection pooling for MongoDB
- Implement rate limiting for API endpoints
- Add caching for frequently accessed data

## Security

- Never commit `.env` file
- Use environment variables for all secrets
- Enable CORS only for trusted origins in production
- Implement authentication/authorization
- Validate all user inputs
- Use HTTPS in production

## Monitoring

Add logging:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Yahoo Finance API](https://github.com/gadicc/node-yahoo-finance2)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
