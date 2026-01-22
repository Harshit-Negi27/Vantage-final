# Vantage

An AI-powered visual research workspace that combines intelligent whiteboarding with financial analysis capabilities. Create nodes, connect ideas, chat with AI, and analyze companies with real-time market data.

## Quick Links

- [Quick Start Guide](./docs/QUICKSTART.md) - Get running in 10 minutes
- [Features](./docs/FEATURES.md) - Complete feature list
- [Architecture](./docs/ARCHITECTURE.md) - Technical deep dive
- [Deployment](./docs/DEPLOYMENT.md) - Production deployment guide
- [Contributing](./CONTRIBUTING.md) - How to contribute

## Overview

Vantage is a visual research workspace where you can:

- Create and organize research as nodes on an infinite canvas
- Chat with AI that understands context from connected nodes
- Analyze companies with real-time financial data
- Generate knowledge maps automatically
- Research topics with web search integration
- Visualize relationships in a knowledge graph

## Architecture

Vantage consists of three main services:

- **Frontend**: Next.js 16 with React 19 and Tailwind CSS
- **Backend**: Express.js API with MongoDB/File storage and Yahoo Finance
- **AI Server**: FastAPI with LangGraph agents, Neo4j, and FAISS

## Key Features

- Visual whiteboard with drag-and-drop nodes
- AI-powered research with multiple models (Groq, OpenAI)
- Real-time stock data and interactive charts
- Knowledge graph storage and visualization
- Web research with automatic entity extraction
- Context-aware AI conversations
- Image and document uploads
- Automatic knowledge map generation

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Recharts for data visualization

### Backend
- Node.js with Express
- MongoDB for data persistence
- Yahoo Finance API for market data
- Cloudinary for file storage
- CORS enabled for cross-origin requests

### AI Server
- Python 3.10+
- FastAPI for async API endpoints
- LangChain & LangGraph for agent orchestration
- Neo4j for knowledge graph storage
- FAISS for vector similarity search
- Groq & OpenAI LLM support
- Tavily for web research

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- MongoDB (local or cloud instance)
- Neo4j database (local or cloud instance)
- API Keys:
  - Groq API key (recommended) or OpenAI API key
  - Tavily API key (for web research)
  - Cloudinary account (for file uploads)

## Quick Start

Get up and running in 10 minutes. See the [Quick Start Guide](./docs/QUICKSTART.md) for detailed instructions.

### Prerequisites

- Node.js 18+
- Python 3.10+
- API Keys: Groq, Neo4j, Tavily (all have free tiers)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd vantage

# Setup AI Server
cd Vantage
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env
python seed.py
uvicorn api:app --reload --port 8000

# Setup Backend (new terminal)
cd backend
npm install
cp .env.example .env
npm run dev

# Setup Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 in your browser.

## Documentation

### Setup Guides

- [Quick Start](./docs/QUICKSTART.md) - Get running in 10 minutes
- [Frontend Setup](./docs/FRONTEND_SETUP.md) - Next.js frontend configuration
- [Backend Setup](./docs/BACKEND_SETUP.md) - Express.js backend configuration
- [AI Server Setup](./docs/AI_SERVER_SETUP.md) - FastAPI AI server configuration

### Technical Documentation

- [Features](./docs/FEATURES.md) - Complete feature list and capabilities
- [Architecture](./docs/ARCHITECTURE.md) - System design and technical details
- [API Reference](./docs/API_REFERENCE.md) - Complete API documentation
- [Deployment](./docs/DEPLOYMENT.md) - Production deployment guide
- [Contributing](./CONTRIBUTING.md) - How to contribute to the project

## Project Structure

```
vantage/
├── frontend/              # Next.js frontend application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/             # Utilities and API clients
│   └── public/          # Static assets
├── backend/              # Express.js API server
│   ├── storage/         # Database adapters (MongoDB/File)
│   ├── index.js         # Main server file
│   └── store.js         # Data access layer
├── Vantage/             # Python AI server
│   ├── api.py           # FastAPI endpoints
│   ├── tools.py         # LangChain tools
│   ├── whiteboard_tools.py  # Whiteboard-specific tools
│   ├── seed.py          # Neo4j data seeding
│   └── faiss_index/     # Vector search index
└── docs/                # Documentation
```

## Development

### Running All Services

You'll need three terminal windows:

```bash
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - Backend
cd backend && npm run dev

# Terminal 3 - AI Server
cd Vantage && source venv/bin/activate && uvicorn api:app --reload --port 8000
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
npm start

# AI Server
cd Vantage
uvicorn api:app --host 0.0.0.0 --port 8000
```

## API Documentation

### Backend API (Port 5050)

- `GET /health` - Health check
- `GET /whiteboards` - List all whiteboards
- `POST /whiteboards` - Create new whiteboard
- `GET /whiteboards/:id` - Get whiteboard details
- `POST /whiteboards/:id/nodes` - Create node
- `POST /whiteboards/:id/edges` - Create edge
- `POST /whiteboards/:id/nodes/:nodeId/chat` - Chat with AI
- `GET /finance/company/:ticker` - Get company data
- `GET /finance/search?q=query` - Search companies
- `GET /finance/chart/:ticker?timeframe=1M` - Get chart data

### AI Server API (Port 8000)

- `GET /models` - List available AI models
- `POST /research` - Stream research results
- `POST /map` - Generate knowledge map
- `GET /graph?query=entity` - Get knowledge graph data

## Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel deploy --prod
```

### Backend (Railway/Render)

```bash
cd backend
# Deploy using your platform's CLI or Git integration
```

### AI Server (Railway/Render)

```bash
cd Vantage
# Deploy using your platform's CLI or Git integration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.
