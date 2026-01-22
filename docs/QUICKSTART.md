# Quick Start Guide

Get Vantage up and running in 10 minutes.

## Prerequisites Check

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Python 3.10+ installed (`python --version`)
- [ ] Git installed (`git --version`)
- [ ] A code editor (VS Code recommended)

## Step 1: Clone Repository

```bash
git clone <repository-url>
cd vantage
```

## Step 2: Get API Keys

You'll need these API keys (all have free tiers):

### Required

1. **Groq API Key** (Free, fast inference)
   - Visit: https://console.groq.com
   - Sign up and create API key
   - Copy key for later

2. **Neo4j Database** (Free tier available)
   - Visit: https://neo4j.com/cloud/aura/
   - Create free database
   - Save connection URI, username, and password

3. **Tavily API Key** (Free tier available)
   - Visit: https://tavily.com
   - Sign up and get API key
   - Copy key for later

### Optional

4. **Cloudinary** (For file uploads)
   - Visit: https://cloudinary.com
   - Sign up for free account
   - Get cloud name, API key, and secret

5. **MongoDB** (For production storage)
   - Visit: https://www.mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string

## Step 3: Setup AI Server

```bash
# Navigate to AI server directory
cd Vantage

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your API keys
# Use your favorite editor (nano, vim, code, etc.)
nano .env
```

Add your keys to `.env`:

```bash
GROQ_API_KEY=your_groq_key_here
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password
TAVILY_API_KEY=your_tavily_key_here
```

Initialize the database:

```bash
python seed.py
```

Start the AI server:

```bash
uvicorn api:app --reload --port 8000
```

Keep this terminal open. The AI server is now running on http://localhost:8000

## Step 4: Setup Backend

Open a new terminal:

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env (optional - defaults work for local development)
nano .env
```

For local development, the default `.env` works:

```bash
PORT=5050
AI_BASE_URL=http://localhost:8000
```

Start the backend:

```bash
npm run dev
```

Keep this terminal open. The backend is now running on http://localhost:5050

## Step 5: Setup Frontend

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local (defaults work for local development)
nano .env.local
```

The default `.env.local` works:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5050
NEXT_PUBLIC_AI_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

The frontend is now running on http://localhost:3000

## Step 6: Test the Application

1. Open your browser to http://localhost:3000
2. Click "Try it out" or "Open Workspace"
3. Create a new whiteboard
4. Try these commands:
   - "Research OpenAI"
   - "Create a chart for AAPL"
   - "Show me metrics for Tesla"

## Troubleshooting

### AI Server Won't Start

**Error**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**: Make sure virtual environment is activated and dependencies are installed:

```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Error**: `Neo4j connection failed`

**Solution**: Check your Neo4j credentials in `.env`:

```bash
# Test connection
python -c "from langchain_neo4j import Neo4jGraph; g = Neo4jGraph()"
```

### Backend Won't Start

**Error**: `Port 5050 already in use`

**Solution**: Change port in `.env`:

```bash
PORT=5051
```

Then update frontend `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5051
```

**Error**: `AI_BASE_URL connection refused`

**Solution**: Make sure AI server is running on port 8000

### Frontend Won't Start

**Error**: `Port 3000 already in use`

**Solution**: Use a different port:

```bash
PORT=3001 npm run dev
```

**Error**: `Failed to fetch from API`

**Solution**: Check that backend is running and `.env.local` has correct URL

## Verify Everything Works

Run these checks:

```bash
# Check AI server
curl http://localhost:8000/models

# Check backend
curl http://localhost:5050/health

# Check frontend
# Open http://localhost:3000 in browser
```

All should return successful responses.

## Next Steps

Now that everything is running:

1. **Explore the UI**: Create nodes, connect them, chat with AI
2. **Try Financial Features**: Search for stocks, create charts
3. **Test Research**: Ask AI to research companies or topics
4. **Read Documentation**: Check out the detailed guides in `docs/`

## Common First Tasks

### Create Your First Research Board

1. Click "New Whiteboard"
2. Name it "AI Startups Research"
3. Click "Master AI" button
4. Type: "Research OpenAI, Anthropic, and Perplexity"
5. Watch as AI creates nodes and connections

### Analyze a Stock

1. Create a new whiteboard
2. Click "Master AI"
3. Type: "Show me Apple stock with key metrics"
4. AI will create company card and chart

### Build a Knowledge Map

1. Create a new whiteboard
2. Click "Master AI"
3. Type: "Generate a knowledge map about AI safety"
4. AI will create connected concept nodes

## Development Tips

### Hot Reload

All three services support hot reload:

- Frontend: Changes to `.tsx` files reload automatically
- Backend: Changes to `.js` files reload automatically (nodemon)
- AI Server: Changes to `.py` files reload automatically (--reload flag)

### Debugging

Add console logs or print statements:

```typescript
// Frontend
console.log('Debug:', data);
```

```javascript
// Backend
console.log('Debug:', data);
```

```python
# AI Server
print(f"Debug: {data}")
```

### Stopping Services

Press `Ctrl+C` in each terminal to stop the services.

## Getting Help

If you run into issues:

1. Check the error message carefully
2. Review the relevant setup guide in `docs/`
3. Search existing GitHub issues
4. Open a new issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, Python version)

## What's Next?

- [Frontend Setup Guide](./FRONTEND_SETUP.md) - Detailed frontend documentation
- [Backend Setup Guide](./BACKEND_SETUP.md) - Detailed backend documentation
- [AI Server Setup Guide](./AI_SERVER_SETUP.md) - Detailed AI server documentation
- [Features Guide](./FEATURES.md) - Complete feature list
- [Architecture Guide](./ARCHITECTURE.md) - Technical architecture
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment

Happy building!
