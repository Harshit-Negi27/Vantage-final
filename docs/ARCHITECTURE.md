# Vantage Architecture

This document provides a detailed overview of Vantage's architecture, design decisions, and technical implementation.

## System Overview

Vantage is a distributed system consisting of three main services:

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼──────────────────────────────────────┐
│           Frontend (Next.js)                │
│  - React 19 + TypeScript                   │
│  - Tailwind CSS                            │
│  - Server Components                       │
└──────┬──────────────────────────────────────┘
       │
       │ REST API
       │
┌──────▼──────────────────────────────────────┐
│         Backend (Express.js)                │
│  - RESTful API                             │
│  - MongoDB/File Storage                    │
│  - Yahoo Finance Integration               │
│  - Cloudinary Integration                  │
└──────┬──────────────────────────────────────┘
       │
       │ HTTP/Streaming
       │
┌──────▼──────────────────────────────────────┐
│        AI Server (FastAPI)                  │
│  - LangGraph Agents                        │
│  - Neo4j Knowledge Graph                   │
│  - FAISS Vector Search                     │
│  - Tavily Web Research                     │
└─────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **State Management**: React hooks and context

### Directory Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── home/              # Dashboard
│   ├── chats/             # Chat history
│   └── whiteboard/        # Whiteboard pages
│       ├── page.tsx       # List view
│       ├── new/           # Create new
│       └── [id]/          # Individual board
├── components/            # React components
│   ├── home/             # Home components
│   ├── whiteboard/       # Whiteboard components
│   ├── icons/            # Icon components
│   └── MarkdownText.tsx  # Markdown renderer
├── lib/                  # Utilities
│   ├── api.ts           # API client
│   ├── types.ts         # TypeScript types
│   └── time.ts          # Time utilities
└── public/              # Static assets
```

### Key Design Patterns

#### Server Components

Next.js 16 uses React Server Components by default:

```typescript
// Server Component (default)
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

#### Client Components

Interactive components use 'use client' directive:

```typescript
'use client';

export function InteractiveChart() {
  const [data, setData] = useState([]);
  // ... interactive logic
}
```

#### API Client Pattern

Centralized API calls in `lib/api.ts`:

```typescript
export async function getWhiteboard(id: string): Promise<Whiteboard> {
  const res = await fetch(`${API_URL}/whiteboards/${id}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
```

### State Management

- Local state: `useState` for component-specific state
- Shared state: React Context for cross-component state
- Server state: Next.js data fetching and caching

### Routing

Next.js App Router with file-based routing:

- `/` - Landing page
- `/home` - Dashboard
- `/whiteboard` - Whiteboard list
- `/whiteboard/new` - Create whiteboard
- `/whiteboard/[id]` - Individual whiteboard

## Backend Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (optional) or File storage
- **File Storage**: Cloudinary
- **Finance Data**: Yahoo Finance API

### Directory Structure

```
backend/
├── index.js              # Main server
├── store.js              # Data access layer
├── storage/              # Storage adapters
│   ├── index.js         # Mode selector
│   ├── file.js          # File storage
│   └── mongo.js         # MongoDB storage
├── data.json            # File storage data
└── package.json         # Dependencies
```

### Storage Abstraction

The backend uses a storage adapter pattern:

```javascript
// storage/index.js
export const storageMode = () => {
  return process.env.MONGODB_URI ? 'mongodb' : 'file';
};

export const createWhiteboard = async (data) => {
  if (storageMode() === 'mongodb') {
    return mongoStorage.createWhiteboard(data);
  }
  return fileStorage.createWhiteboard(data);
};
```

### API Design

RESTful API with resource-based endpoints:

```
GET    /whiteboards              # List
POST   /whiteboards              # Create
GET    /whiteboards/:id          # Read
PATCH  /whiteboards/:id          # Update
DELETE /whiteboards/:id          # Delete
```

Nested resources:

```
POST   /whiteboards/:id/nodes
PATCH  /whiteboards/:id/nodes/:nodeId
DELETE /whiteboards/:id/nodes/:nodeId
```

### Context Building

The backend builds context from connected nodes:

```javascript
function buildFullContext(board, node) {
  const parts = [];
  
  // Current node
  parts.push(`Topic: ${node.title}`);
  
  // Connected nodes
  const connected = getConnectedNodesContext(board, node.id);
  for (const ctx of connected) {
    parts.push(ctx.context);
  }
  
  return parts.join('\n');
}
```

### Streaming Responses

AI responses are streamed token-by-token:

```javascript
const reader = aiRes.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  res.write(chunk);
}
res.end();
```

## AI Server Architecture

### Technology Stack

- **Framework**: FastAPI
- **Agent Framework**: LangGraph
- **LLM Integration**: LangChain
- **Knowledge Graph**: Neo4j
- **Vector Search**: FAISS
- **Web Research**: Tavily

### Directory Structure

```
Vantage/
├── api.py                    # FastAPI server
├── tools.py                  # Research tools
├── whiteboard_tools.py       # Whiteboard tools
├── seed.py                   # Database seeding
├── agent.py                  # CLI interface
├── app.py                    # Streamlit UI
├── schema.py                 # Data schemas
├── faiss_index/             # Vector index
│   ├── index.faiss
│   └── index.pkl
└── requirements.txt         # Dependencies
```

### Agent Architecture

LangGraph ReAct agent with tool calling:

```python
# Create agent
llm = ChatGroq(model="moonshotai/kimi-k2-instruct-0905")
llm_with_tools = llm.bind_tools(ALL_TOOLS)
agent = create_react_agent(llm_with_tools, tools=ALL_TOOLS)

# Execute
async for event in agent.astream_events(...):
    if event["event"] == "on_chat_model_stream":
        yield event["data"]["chunk"].content
```

### Tool System

Tools are LangChain functions with schemas:

```python
@tool
def research_and_learn(topic: str) -> str:
    """Research a topic using web search and store in knowledge graph."""
    # 1. Search web
    results = tavily_search(topic)
    
    # 2. Extract entities
    entities = extract_entities(results)
    
    # 3. Store in Neo4j
    for entity in entities:
        graph.query("MERGE (n:Company {id: $id})", {"id": entity})
    
    return f"Researched {topic}"
```

### Knowledge Graph Schema

Neo4j stores entities and relationships:

```cypher
// Nodes
(:Company {id, name, description})
(:Person {id, name, role})
(:Investor {id, name, type})

// Relationships
(:Company)-[:INVESTED_IN]->(:Company)
(:Person)-[:FOUNDED_BY]->(:Company)
(:Company)-[:COMPETES_WITH]->(:Company)
```

### Vector Search

FAISS provides semantic similarity search:

```python
# Load index
index = faiss.read_index("faiss_index/index.faiss")
embeddings = load_embeddings()

# Search
query_vector = embeddings.embed_query(query)
distances, indices = index.search(query_vector, k=3)
```

### Streaming Architecture

FastAPI streams responses using async generators:

```python
async def generate_stream(query: str):
    async for event in agent.astream_events(...):
        if event["event"] == "on_chat_model_stream":
            yield event["data"]["chunk"].content

@app.post("/research")
async def research(request: ResearchRequest):
    return StreamingResponse(
        generate_stream(request.query),
        media_type="text/event-stream"
    )
```

## Data Flow

### Creating a Whiteboard

```
1. User clicks "New Whiteboard" in frontend
2. Frontend sends POST /whiteboards to backend
3. Backend creates whiteboard in storage
4. Backend returns whiteboard data
5. Frontend redirects to /whiteboard/[id]
```

### AI Chat Flow

```
1. User types message in chat panel
2. Frontend sends POST /whiteboards/:id/nodes/:nodeId/chat
3. Backend builds context from connected nodes
4. Backend forwards to AI server POST /research
5. AI server streams response token-by-token
6. Backend streams to frontend
7. Frontend displays streaming response
8. Backend saves message to storage
```

### Research Flow

```
1. User asks AI to research a topic
2. AI agent decides to use research_and_learn tool
3. Tool searches web via Tavily
4. Tool extracts entities from results
5. Tool stores entities in Neo4j
6. Tool returns summary
7. AI agent generates final response
8. Response streamed to user
```

### Financial Data Flow

```
1. User creates company node or searches ticker
2. Frontend sends GET /finance/company/:ticker
3. Backend queries Yahoo Finance API
4. Backend formats and returns data
5. Frontend displays company card
```

## Security Architecture

### API Security

- CORS configured for allowed origins
- Environment variables for secrets
- Input validation on all endpoints
- Error message sanitization

### Authentication

Currently no authentication (suitable for single-user or trusted environments).

For multi-user deployment, add:
- JWT-based authentication
- User sessions
- Role-based access control
- API key authentication

### Data Security

- Sensitive data in environment variables
- HTTPS in production
- Database connection encryption
- File upload validation

## Performance Optimization

### Frontend

- Next.js automatic code splitting
- Image optimization with next/image
- CSS optimization with Tailwind
- Server-side rendering for initial load

### Backend

- Connection pooling for MongoDB
- Response streaming for large data
- Efficient context building
- Caching for frequently accessed data

### AI Server

- Agent instance caching
- Parallel tool execution
- Streaming responses
- Recursion limits to prevent infinite loops

## Scalability

### Horizontal Scaling

- Frontend: Stateless, scales easily
- Backend: Stateless, can add instances
- AI Server: Can add workers or instances

### Vertical Scaling

- Increase instance resources
- Optimize database queries
- Add caching layers
- Use CDN for static assets

## Monitoring and Observability

### Logging

- Frontend: Browser console and error tracking
- Backend: Request/response logging
- AI Server: Tool execution logging

### Metrics

- Response times
- Error rates
- API usage
- Database performance

### Health Checks

All services expose health endpoints:

```
GET /health
```

## Error Handling

### Frontend

```typescript
try {
  const data = await api.getWhiteboard(id);
} catch (error) {
  console.error('Failed to load whiteboard:', error);
  // Show error UI
}
```

### Backend

```javascript
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Unknown error';
  res.status(status).json({ error: message });
});
```

### AI Server

```python
try:
    result = await agent.ainvoke(...)
except Exception as e:
    logger.error(f"Agent error: {e}")
    yield f"Error: {str(e)}"
```

## Testing Strategy

### Frontend

- Unit tests: Jest + React Testing Library
- Integration tests: Playwright
- E2E tests: Cypress

### Backend

- Unit tests: Jest
- Integration tests: Supertest
- API tests: Postman/Newman

### AI Server

- Unit tests: pytest
- Integration tests: pytest with fixtures
- Tool tests: Mock external APIs

## Deployment Architecture

### Development

```
localhost:3000  → Frontend
localhost:5050  → Backend
localhost:8000  → AI Server
```

### Production

```
app.domain.com  → Frontend (Vercel)
api.domain.com  → Backend (Railway)
ai.domain.com   → AI Server (Railway)
```

## Future Enhancements

### Planned Features

- Real-time collaboration (WebSockets)
- User authentication and authorization
- Whiteboard templates
- Export to PDF/PNG
- Advanced search and filtering
- Mobile app

### Technical Improvements

- GraphQL API option
- Redis caching layer
- Message queue for async tasks
- Microservices architecture
- Kubernetes deployment

## Design Decisions

### Why Next.js?

- Server-side rendering for SEO
- Automatic code splitting
- Built-in routing
- Great developer experience

### Why Express.js?

- Simple and flexible
- Large ecosystem
- Easy to understand
- Good performance

### Why FastAPI?

- Async support
- Automatic API documentation
- Type validation with Pydantic
- Fast performance

### Why Neo4j?

- Native graph database
- Cypher query language
- Relationship-first design
- Visual graph exploration

### Why LangGraph?

- Agent orchestration
- Tool calling support
- Streaming responses
- State management

## Conclusion

Vantage's architecture is designed for:

- Modularity: Each service is independent
- Scalability: Can scale horizontally
- Maintainability: Clear separation of concerns
- Extensibility: Easy to add new features
- Performance: Optimized for speed
- Developer Experience: Modern tools and patterns
