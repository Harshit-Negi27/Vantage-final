# Vantage - Project Summary

## What is Vantage?

Vantage is an AI-powered visual research workspace that combines intelligent whiteboarding with financial analysis. It allows users to create research nodes, connect ideas visually, chat with AI that understands context, and analyze companies with real-time market data.

## Key Capabilities

1. **Visual Research Workspace**: Infinite canvas with drag-and-drop nodes
2. **AI-Powered Analysis**: Context-aware conversations with multiple AI models
3. **Financial Intelligence**: Real-time stock data, charts, and company metrics
4. **Knowledge Graph**: Automatic entity extraction and relationship mapping
5. **Web Research**: Integrated web search with Tavily
6. **Multi-Modal**: Support for text, images, documents, charts, and metrics

## Technology Stack

### Frontend
- Next.js 16 with React 19
- TypeScript for type safety
- Tailwind CSS for styling
- Recharts for data visualization

### Backend
- Express.js REST API
- MongoDB or file-based storage
- Yahoo Finance for market data
- Cloudinary for file uploads

### AI Server
- FastAPI with async support
- LangGraph for agent orchestration
- Neo4j for knowledge graphs
- FAISS for vector search
- Groq/OpenAI for LLM inference
- Tavily for web research

## Architecture Overview

```
Browser → Frontend (Next.js) → Backend (Express) → AI Server (FastAPI)
                                      ↓                    ↓
                                  MongoDB            Neo4j + FAISS
                                      ↓                    ↓
                                 Cloudinary          Tavily + LLMs
```

## Core Features

### Whiteboard
- Create unlimited whiteboards
- Drag-and-drop node positioning
- Visual connections between nodes
- Multiple node types (research, company, chart, metric, text, image, document)
- Auto-layout for generated maps

### AI Research
- Context-aware conversations
- Web research integration
- Automatic entity extraction
- Knowledge graph storage
- Multiple AI models (Groq, OpenAI)
- Streaming responses

### Financial Analysis
- Real-time stock quotes
- Interactive price charts
- Company financial metrics
- Market data search
- Multiple timeframes (1D to 5Y)

### Knowledge Management
- Neo4j graph database
- Relationship mapping
- Graph visualization
- Persistent knowledge base
- Context propagation

## Use Cases

1. **Investment Research**: Analyze companies, track competitors, map relationships
2. **Market Analysis**: Monitor stocks, compare metrics, visualize trends
3. **Due Diligence**: Research companies, verify information, build knowledge graphs
4. **Strategic Planning**: Map concepts, connect ideas, explore relationships
5. **Academic Research**: Organize sources, connect concepts, track findings
6. **Competitive Intelligence**: Track competitors, map market landscape

## API Keys Required

### Essential (Free Tiers Available)
- **Groq**: Fast LLM inference (https://console.groq.com)
- **Neo4j**: Knowledge graph database (https://neo4j.com/cloud/aura/)
- **Tavily**: Web research (https://tavily.com)

### Optional
- **OpenAI**: Alternative LLM provider (https://platform.openai.com)
- **Cloudinary**: File uploads (https://cloudinary.com)
- **MongoDB**: Production database (https://www.mongodb.com/cloud/atlas)

## Quick Setup

```bash
# 1. Clone and setup AI server
cd Vantage
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your API keys
python seed.py
uvicorn api:app --reload --port 8000

# 2. Setup backend
cd backend
npm install
cp .env.example .env
npm run dev

# 3. Setup frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Documentation Structure

```
docs/
├── QUICKSTART.md          # 10-minute setup guide
├── FRONTEND_SETUP.md      # Frontend configuration
├── BACKEND_SETUP.md       # Backend configuration
├── AI_SERVER_SETUP.md     # AI server configuration
├── FEATURES.md            # Complete feature list
├── ARCHITECTURE.md        # Technical architecture
├── API_REFERENCE.md       # API documentation
└── DEPLOYMENT.md          # Production deployment
```

## Development Workflow

1. **Local Development**: All three services run locally with hot reload
2. **Testing**: Manual testing in browser, API testing with curl/Postman
3. **Building**: Production builds for each service
4. **Deployment**: Deploy to Vercel (frontend), Railway/Render (backend/AI)

## Deployment Options

### Frontend
- Vercel (recommended)
- Netlify
- AWS Amplify
- Railway

### Backend
- Railway (recommended)
- Render
- Heroku
- AWS/GCP/Azure

### AI Server
- Railway (recommended)
- Render
- AWS/GCP/Azure
- Docker containers

## Security Considerations

- Environment variables for all secrets
- CORS configured for allowed origins
- Input validation on all endpoints
- HTTPS in production
- No authentication (add for production)

## Performance

- Frontend: Next.js automatic optimization
- Backend: Streaming responses, connection pooling
- AI Server: Agent caching, parallel tool execution
- Database: Indexed queries, connection pooling

## Scalability

- Frontend: Stateless, scales horizontally
- Backend: Stateless, can add instances
- AI Server: Can add workers or instances
- Databases: Managed services scale automatically

## Cost Estimate (Free Tier)

- Groq: Free tier (generous limits)
- Neo4j Aura: Free tier (up to 50k nodes)
- Tavily: Free tier (1000 requests/month)
- Vercel: Free for personal projects
- Railway: $5 credit/month
- MongoDB Atlas: 512MB free tier
- Cloudinary: Free tier (25 credits/month)

**Total**: $0-10/month for development/personal use

## Roadmap

### Planned Features
- Real-time collaboration
- User authentication
- Whiteboard templates
- Export to PDF/PNG
- Advanced search
- Mobile app

### Technical Improvements
- GraphQL API
- Redis caching
- Message queues
- Kubernetes deployment
- Automated testing

## Contributing

Contributions welcome! See CONTRIBUTING.md for guidelines.

Areas for contribution:
- Bug fixes
- New features
- Documentation
- Performance optimization
- Testing
- UI/UX improvements

## License

MIT License - see LICENSE file

## Support

- GitHub Issues: Bug reports and feature requests
- Documentation: Comprehensive guides in docs/
- Examples: Sample whiteboards and use cases

## Links

- Repository: [GitHub URL]
- Documentation: docs/
- Demo: [Demo URL if available]
- Issues: [GitHub Issues URL]

## Credits

Built with:
- Next.js by Vercel
- React by Meta
- FastAPI by Sebastián Ramírez
- LangChain by LangChain Inc.
- Neo4j by Neo4j Inc.
- And many other open source projects

## Contact

For questions or support, open an issue on GitHub.

---

Last Updated: January 22, 2025
Version: 0.1.0
