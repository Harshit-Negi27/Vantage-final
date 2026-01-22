# API Reference

Complete API documentation for Vantage services.

## Backend API (Port 5050)

Base URL: `http://localhost:5050` (development)

### Health Check

Check server status and storage mode.

```
GET /health
```

**Response**

```json
{
  "ok": true,
  "storage": "file"
}
```

### Whiteboards

#### List Whiteboards

```
GET /whiteboards
```

**Response**

```json
{
  "whiteboards": [
    {
      "id": "wb_123",
      "title": "My Research",
      "description": "AI startups analysis",
      "nodes": [],
      "edges": [],
      "createdAt": "2025-01-22T10:00:00Z",
      "updatedAt": "2025-01-22T10:00:00Z"
    }
  ]
}
```

#### Create Whiteboard

```
POST /whiteboards
Content-Type: application/json

{
  "title": "New Research Board",
  "description": "Optional description"
}
```

**Response**

```json
{
  "whiteboard": {
    "id": "wb_456",
    "title": "New Research Board",
    "description": "Optional description",
    "nodes": [],
    "edges": [],
    "createdAt": "2025-01-22T10:05:00Z",
    "updatedAt": "2025-01-22T10:05:00Z"
  }
}
```

#### Get Whiteboard

```
GET /whiteboards/:id
```

**Response**

```json
{
  "whiteboard": {
    "id": "wb_123",
    "title": "My Research",
    "nodes": [...],
    "edges": [...]
  }
}
```

#### Update Whiteboard

```
PATCH /whiteboards/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

#### Delete Whiteboard

```
DELETE /whiteboards/:id
```

**Response**

```json
{
  "success": true
}
```

### Nodes

#### Create Node

```
POST /whiteboards/:id/nodes
Content-Type: application/json

{
  "title": "Research Topic",
  "summary": "Initial summary",
  "x": 100,
  "y": 200,
  "type": "research",
  "data": {},
  "width": 300,
  "height": 400
}
```

**Node Types**

- `research` - AI chat node
- `company` - Company financial card
- `chart` - Stock price chart
- `metric` - Single metric display
- `text` - Text/markdown note
- `image` - Image display
- `document` - Document attachment

**Response**

```json
{
  "node": {
    "id": "node_789",
    "title": "Research Topic",
    "type": "research",
    "x": 100,
    "y": 200,
    "data": {},
    "messages": [],
    "createdAt": "2025-01-22T10:10:00Z"
  }
}
```

#### Update Node

```
PATCH /whiteboards/:id/nodes/:nodeId
Content-Type: application/json

{
  "title": "Updated Title",
  "x": 150,
  "y": 250,
  "data": { "updated": "data" }
}
```

#### Delete Node

```
DELETE /whiteboards/:id/nodes/:nodeId
```

### Edges

#### Create Edge

```
POST /whiteboards/:id/edges
Content-Type: application/json

{
  "source": "node_123",
  "target": "node_456"
}
```

**Response**

```json
{
  "edge": {
    "id": "edge_789",
    "source": "node_123",
    "target": "node_456",
    "createdAt": "2025-01-22T10:15:00Z"
  }
}
```

#### Delete Edge

```
DELETE /whiteboards/:id/edges/:edgeId
```

### Chat

#### Get Messages

```
GET /whiteboards/:id/nodes/:nodeId/messages
```

**Response**

```json
{
  "messages": [
    {
      "id": "msg_123",
      "role": "user",
      "content": "What is AI?",
      "createdAt": "2025-01-22T10:20:00Z"
    },
    {
      "id": "msg_124",
      "role": "assistant",
      "content": "AI stands for...",
      "createdAt": "2025-01-22T10:20:05Z"
    }
  ]
}
```

#### Send Message (Node Chat)

```
POST /whiteboards/:id/nodes/:nodeId/chat
Content-Type: application/json

{
  "message": "Tell me about AI",
  "provider": "groq",
  "model": "moonshotai/kimi-k2-instruct-0905",
  "mode": "chat"
}
```

**Streaming Response**

Returns text/plain stream with AI response tokens.

#### Master AI Chat

```
POST /whiteboards/:id/nodes/master/chat
Content-Type: application/json

{
  "message": "Create a chart for AAPL",
  "provider": "groq",
  "model": "qwen/qwen3-32b"
}
```

**Streaming Response**

Returns text/plain stream with status markers and action markers:

```
<<<STATUS:Creating Chart: AAPL:STATUS>>>
<<<ACTION:{"type":"create_chart","nodeId":"node_123"}:ACTION>>>
```

### Finance

#### Get Company Data

```
GET /finance/company/:ticker
```

**Example**: `GET /finance/company/AAPL`

**Response**

```json
{
  "company": {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "sector": "Technology",
    "marketCap": "$2.8T",
    "price": 185.50,
    "change": 2.30,
    "changePercent": 1.25,
    "description": "Apple Inc. designs, manufactures...",
    "metrics": [
      { "label": "P/E Ratio", "value": "28.5", "trend": "neutral" },
      { "label": "EPS", "value": "6.50", "trend": "up" }
    ]
  }
}
```

#### Search Companies

```
GET /finance/search?q=apple
```

**Response**

```json
{
  "results": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "sector": "Technology",
      "marketCap": "$2.8T",
      "price": 185.50,
      "changePercent": 1.25
    }
  ]
}
```

#### Get Chart Data

```
GET /finance/chart/:ticker?timeframe=1M
```

**Timeframes**: `1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, `5Y`

**Response**

```json
{
  "ticker": "AAPL",
  "timeframe": "1M",
  "data": [
    {
      "timestamp": "2025-01-01T00:00:00Z",
      "price": 180.00,
      "volume": 50000000,
      "open": 179.50,
      "high": 181.00,
      "low": 179.00
    }
  ]
}
```

### File Uploads

#### Upload Image

```
POST /upload/image
Content-Type: multipart/form-data

file: <image file>
```

**Response**

```json
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "vantage-whiteboard/abc123",
  "width": 1920,
  "height": 1080
}
```

#### Upload Document

```
POST /upload/document
Content-Type: multipart/form-data

file: <document file>
```

**Response**

```json
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "vantage-documents/doc123",
  "originalName": "report.pdf",
  "size": 1024000
}
```

### AI Models

#### List Available Models

```
GET /ai/models
```

**Response**

```json
{
  "models": {
    "groq": [
      {
        "id": "qwen/qwen3-32b",
        "name": "Qwen 3 32B",
        "provider": "groq",
        "description": "Best reasoning & function calling"
      }
    ],
    "openai": [
      {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "provider": "openai",
        "description": "Most capable OpenAI model"
      }
    ]
  },
  "default_provider": "groq",
  "default_model": "moonshotai/kimi-k2-instruct-0905"
}
```

### Map Generation

#### Generate Knowledge Map

```
POST /whiteboards/:id/generate-map
Content-Type: application/json

{
  "topic": "AI Safety"
}
```

**Response**

```json
{
  "success": true,
  "nodes": [
    {
      "id": "node_123",
      "title": "AI Safety",
      "x": 400,
      "y": 300
    }
  ]
}
```

## AI Server API (Port 8000)

Base URL: `http://localhost:8000` (development)

### Models

#### List Available Models

```
GET /models
```

**Response**

```json
{
  "models": {
    "groq": [...],
    "openai": [...]
  },
  "default_provider": "groq",
  "default_model": "moonshotai/kimi-k2-instruct-0905"
}
```

### Research

#### Stream Research Results

```
POST /research
Content-Type: application/json

{
  "query": "Research OpenAI",
  "provider": "groq",
  "model": "qwen/qwen3-32b",
  "mode": "research"
}
```

**Modes**

- `chat` - Quick Q&A
- `research` - Deep research with web search

**Streaming Response**

Returns `text/event-stream` with:

- Text tokens from AI
- Status markers: `<<<STATUS:message:STATUS>>>`
- Action markers: `<<<ACTION:json:ACTION>>>`

**Example Stream**

```
<<<STATUS:Researching: OpenAI:STATUS>>>
OpenAI is an AI research company...
<<<ACTION:{"type":"create_text_node","title":"OpenAI Research"}:ACTION>>>
<<<STATUS::STATUS>>>
```

### Knowledge Map

#### Generate Map

```
POST /map
Content-Type: application/json

{
  "topic": "Machine Learning",
  "provider": "groq",
  "model": "qwen/qwen3-32b"
}
```

**Response**

```json
{
  "nodes": [
    {
      "id": "ml",
      "label": "Machine Learning",
      "type": "concept",
      "summary": "Field of AI..."
    }
  ],
  "edges": [
    {
      "source": "ml",
      "target": "supervised",
      "label": "includes"
    }
  ]
}
```

### Graph Data

#### Get Knowledge Graph

```
GET /graph?query=OpenAI
```

**Response**

```json
{
  "nodes": [
    {
      "id": "OpenAI",
      "label": "OpenAI",
      "color": "#FF4B4B",
      "size": 40,
      "group": "Center"
    },
    {
      "id": "Microsoft",
      "label": "Microsoft",
      "color": "#00CC96",
      "size": 20,
      "group": "Investor"
    }
  ],
  "edges": [
    {
      "source": "Microsoft",
      "target": "OpenAI",
      "color": "#555"
    }
  ],
  "focus_entity": "OpenAI"
}
```

## Error Responses

All APIs return errors in this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes**

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Internal Server Error
- `502` - Bad Gateway (AI server error)

## Rate Limiting

Currently no rate limiting is implemented. For production, implement rate limiting on all endpoints.

## Authentication

Currently no authentication is required. For production, implement:

- JWT tokens
- API keys
- OAuth 2.0

## CORS

CORS is enabled for all origins in development. For production, restrict to specific origins.

## Webhooks

Webhooks are not currently implemented but could be added for:

- Whiteboard updates
- Node creation
- Chat messages
- Research completion
