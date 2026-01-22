# Vantage Features

A comprehensive overview of all features available in Vantage.

## Core Features

### Visual Whiteboard

- Infinite canvas for organizing research
- Drag-and-drop node positioning
- Multiple node types (research, company, chart, metric, text, image, document)
- Visual connections between related concepts
- Zoom and pan controls
- Auto-layout for generated maps

### AI-Powered Research

- Context-aware conversations with AI
- Multiple AI model support (Groq, OpenAI)
- Streaming responses for real-time feedback
- Web research integration via Tavily
- Knowledge graph storage in Neo4j
- Vector similarity search with FAISS

### Financial Analysis

- Real-time stock data from Yahoo Finance
- Interactive price charts with multiple timeframes
- Company financial metrics and ratios
- Market cap, P/E ratio, EPS, dividend yield
- 52-week high/low tracking
- Company search and discovery

### Knowledge Management

- Automatic entity extraction from research
- Relationship mapping between entities
- Graph visualization of connections
- Persistent knowledge base
- Context propagation across connected nodes

## Node Types

### Research Node

- AI chat interface
- Conversation history
- Summary generation
- Connected context awareness
- Web research capabilities

### Company Node

- Company profile and description
- Real-time stock price
- Price change indicators
- Key financial metrics
- Sector and industry information
- Market capitalization

### Chart Node

- Interactive stock price charts
- Multiple timeframes (1D, 1W, 1M, 3M, 6M, 1Y, 5Y)
- Price and volume data
- Zoom and pan controls
- Responsive design

### Metric Node

- Single metric display
- Trend indicators (up, down, neutral)
- Percentage change tracking
- Custom labels and values
- Visual styling based on trend

### Text Node

- Rich text editing
- Markdown support
- Notes and annotations
- Research summaries
- Free-form content

### Image Node

- Image upload and display
- Cloudinary integration
- Drag-and-drop upload
- Image preview
- Responsive sizing

### Document Node

- PDF and document upload
- File storage via Cloudinary
- Document preview
- Download capability
- File metadata display

## AI Capabilities

### Research Mode

- Deep web research on topics
- Entity extraction and storage
- Comprehensive summaries
- Source citation
- Knowledge graph expansion

### Chat Mode

- Quick question answering
- Context-aware responses
- Conversation continuity
- Multi-turn dialogues
- Tool usage for specific tasks

### Master AI Chat

- Global whiteboard commands
- Automatic node creation
- Multi-node operations
- Knowledge map generation
- Batch processing

### Available AI Models

#### Groq (Fast & Free)

- Qwen 3 32B: Best reasoning and function calling
- Llama 4 Scout: Fast tool use specialist
- Kimi K2: 262K context window
- GPT OSS 120B: OpenAI's flagship model
- GPT OSS 20B: Fast 20B model
- Llama 3.3 70B: Production stable
- Llama 3.1 8B: Ultra fast

#### OpenAI

- GPT-4o: Most capable model
- GPT-4o Mini: Fast and cost-effective
- GPT-3.5 Turbo: Legacy model

## Whiteboard Features

### Node Management

- Create nodes with drag-and-drop
- Update node positions
- Edit node content
- Delete nodes
- Duplicate nodes
- Group nodes

### Edge Management

- Connect related nodes
- Visual relationship indicators
- Delete connections
- Automatic routing
- Curved edge rendering

### Layout Options

- Manual positioning
- Auto-layout for maps
- Grid snapping
- Alignment tools
- Distribution controls

### Collaboration

- Multiple whiteboards
- Whiteboard sharing
- Title and description
- Creation timestamps
- Last updated tracking

## Data Integration

### Yahoo Finance

- Real-time stock quotes
- Historical price data
- Company fundamentals
- Market statistics
- Search functionality

### Neo4j Knowledge Graph

- Entity storage
- Relationship mapping
- Graph queries
- Cypher query support
- Visual graph exploration

### FAISS Vector Search

- Semantic similarity search
- Definition lookup
- Concept matching
- Fast retrieval

### Tavily Web Research

- Real-time web search
- Source extraction
- Content summarization
- Entity identification

## File Management

### Image Uploads

- Drag-and-drop interface
- Cloudinary storage
- Automatic optimization
- Responsive delivery
- 10MB file size limit

### Document Uploads

- PDF support
- Cloudinary storage
- Secure URLs
- File metadata
- Download capability

## User Interface

### Design System

- Dark theme with orange accents
- Stone color palette
- Consistent typography
- Responsive layouts
- Accessible components

### Navigation

- Landing page
- Home dashboard
- Whiteboard list
- Individual whiteboards
- Chat history

### Panels

- Left panel: Node list and controls
- Right panel: AI chat interface
- Top toolbar: Actions and settings
- Bottom status: Connection indicators

### Interactions

- Drag-and-drop nodes
- Click to select
- Double-click to edit
- Right-click context menu
- Keyboard shortcuts

## API Features

### RESTful Endpoints

- CRUD operations for whiteboards
- Node and edge management
- Chat and messaging
- Finance data access
- File uploads

### Streaming Responses

- Real-time AI responses
- Token-by-token delivery
- Status updates
- Action markers
- Error handling

### CORS Support

- Cross-origin requests
- Configurable origins
- Credential support
- Method allowlist

## Storage Options

### File Storage

- JSON-based persistence
- Simple setup
- No external dependencies
- Development mode

### MongoDB Storage

- Production-ready
- Scalable
- Concurrent access
- Query optimization

## Performance

### Frontend

- Next.js App Router
- React Server Components
- Automatic code splitting
- Image optimization
- CSS optimization

### Backend

- Express.js with async/await
- Connection pooling
- Response streaming
- Error handling
- Request validation

### AI Server

- FastAPI async endpoints
- Agent caching
- Streaming responses
- Parallel tool execution
- Recursion limits

## Security

### API Security

- Environment variable secrets
- CORS configuration
- Input validation
- Error sanitization
- Rate limiting ready

### Data Security

- Secure database connections
- Encrypted API keys
- HTTPS support
- File upload validation
- XSS prevention

## Extensibility

### Custom Tools

- Easy tool addition
- LangChain integration
- Function calling support
- Tool documentation
- Error handling

### Custom Models

- Multiple provider support
- Model configuration
- Temperature control
- Streaming support
- Fallback options

### Custom Storage

- Storage adapter pattern
- Easy backend switching
- Migration support
- Backup capabilities

## Future Enhancements

Potential features for future development:

- Real-time collaboration
- User authentication
- Whiteboard templates
- Export to PDF/PNG
- Advanced search
- Tagging system
- Version history
- Comments and annotations
- Mobile app
- API webhooks
- Custom integrations
- Analytics dashboard
