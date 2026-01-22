# AI Server Setup Guide

The AI server is a FastAPI application that provides intelligent research capabilities using LangGraph agents, Neo4j knowledge graphs, and FAISS vector search.

## Prerequisites

- Python 3.10 or higher
- Neo4j database (local or cloud instance)
- API Keys:
  - Groq API key (recommended) or OpenAI API key
  - Tavily API key (for web research)

## Installation

1. Navigate to the Vantage directory:

```bash
cd Vantage
```

2. Create virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

## Environment Configuration

Create a `.env` file in the `Vantage` directory:

```bash
# AI Model API Keys
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key  # Optional

# Neo4j Database
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password

# Web Research
TAVILY_API_KEY=your_tavily_api_key

# Optional: Model Selection
GROQ_MODEL=moonshotai/kimi-k2-instruct-0905
```

### Environment Variables

#### Required

- `GROQ_API_KEY` or `OPENAI_API_KEY`: At least one LLM provider API key
- `NEO4J_URI`: Neo4j database connection URI
- `NEO4J_USERNAME`: Neo4j username (usually "neo4j")
- `NEO4J_PASSWORD`: Neo4j password
- `TAVILY_API_KEY`: Tavily API key for web research

#### Optional

- `GROQ_MODEL`: Default Groq model (default: moonshotai/kimi-k2-instruct-0905)

## API Keys Setup

### Groq API Key (Recommended)

1. Visit [Groq Console](https://console.groq.com)
2. Sign up for free account
3. Navigate to API Keys section
4. Create new API key
5. Copy key to `.env` file

Groq provides fast inference with generous free tier.

### OpenAI API Key (Optional)

1. Visit [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create new secret key
5. Copy key to `.env` file

### Tavily API Key

1. Visit [Tavily](https://tavily.com)
2. Sign up for account
3. Get API key from dashboard
4. Copy key to `.env` file

Tavily provides web search capabilities for research.

## Neo4j Setup

### Neo4j AuraDB (Cloud - Recommended)

1. Visit [Neo4j Aura](https://neo4j.com/cloud/aura/)
2. Create free account
3. Create new database instance
4. Save connection credentials
5. Update `.env` with connection details:

```bash
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_generated_password
```

### Local Neo4j

1. Download Neo4j Desktop from [neo4j.com](https://neo4j.com/download/)
2. Install and create new database
3. Start database
4. Update `.env`:

```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
```

## Initialize Database

Seed Neo4j with sample data:

```bash
python seed.py
```

This creates sample entities:
- Companies (OpenAI, Anthropic, Perplexity, etc.)
- Investors (Microsoft, NVIDIA, SoftBank, etc.)
- People (Sam Altman, Dario Amodei, etc.)
- Relationships (INVESTED_IN, FOUNDED_BY, COMPETES_WITH)

## Development

Start the development server with auto-reload:

```bash
uvicorn api:app --reload --port 8000
```

The server will be available at `http://localhost:8000`

### API Documentation

FastAPI provides automatic interactive documentation:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Production

Start the production server:

```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
```

For production deployment, consider using:
- Gunicorn with Uvicorn workers
- Docker containers
- Process managers (systemd, supervisor)

## Available AI Models

### Groq Models (Fast & Free)

- **Qwen 3 32B** (Recommended): Best reasoning and function calling
- **Llama 4 Scout**: Fast, great for tool use
- **Kimi K2**: 262K context, excellent function calling
- **GPT OSS 120B**: OpenAI's flagship 120B model
- **GPT OSS 20B**: Fast 20B model
- **Llama 3.3 70B**: Production stable, versatile

### OpenAI Models

- **GPT-4o**: Most capable OpenAI model
- **GPT-4o Mini**: Fast and cost-effective
- **GPT-3.5 Turbo**: Legacy fast model

## API Endpoints

### List Models

```
GET /models
```

Returns available AI models by provider.

### Research (Streaming)

```
POST /research
Content-Type: application/json

{
  "query": "Research Meesho",
  "provider": "groq",
  "model": "moonshotai/kimi-k2-instruct-0905",
  "mode": "research"
}
```

Streams research results with status updates and action markers.

### Generate Knowledge Map

```
POST /map
Content-Type: application/json

{
  "topic": "AI Startups",
  "provider": "groq",
  "model": "qwen/qwen3-32b"
}
```

Returns JSON with nodes and edges for knowledge graph.

### Get Graph Data

```
GET /graph?query=OpenAI
```

Returns Neo4j graph data for entity visualization.

## Agent Tools

The AI agent has access to multiple tools:

### Research Tools

- `research_and_learn`: Web research with Tavily, extracts entities to Neo4j
- `query_graph_database`: Natural language queries to Neo4j
- `query_text_database`: FAISS vector similarity search

### Whiteboard Tools

- `create_chart_node`: Create stock price charts
- `create_company_node`: Create company cards with financial data
- `create_metric_node`: Create metric displays
- `create_text_node`: Create text/markdown nodes
- `generate_knowledge_map`: Generate concept maps
- `connect_nodes`: Create connections between nodes

## Project Structure

```
Vantage/
├── api.py                    # FastAPI server
├── tools.py                  # Research tools (Neo4j, FAISS, Tavily)
├── whiteboard_tools.py       # Whiteboard creation tools
├── seed.py                   # Database seeding script
├── agent.py                  # CLI chat interface
├── app.py                    # Streamlit demo UI
├── schema.py                 # Data schemas
├── requirements.txt          # Python dependencies
├── faiss_index/             # Vector search index
│   ├── index.faiss
│   └── index.pkl
└── archive/                 # Experimental scripts
```

## Key Features

### Streaming Responses

The `/research` endpoint streams responses in real-time:

```python
async for event in executor.astream_events(...):
    if event["event"] == "on_chat_model_stream":
        yield chunk.content
```

### Knowledge Graph Integration

Automatically extracts entities from research and stores in Neo4j:

```python
# Extract entities from web search
entities = extract_entities(search_results)

# Store in Neo4j
for entity in entities:
    graph.query("MERGE (n:Company {id: $id})", {"id": entity})
```

### Context-Aware Conversations

Includes connected nodes in conversation context:

```python
context = build_full_context(board, node)
response = agent.invoke({"messages": [HumanMessage(content=context)]})
```

## Deployment

### Railway

1. Install Railway CLI:

```bash
pip install railway
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
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn api:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

### Docker

Create `Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t vantage-ai .
docker run -p 8000:8000 --env-file .env vantage-ai
```

## Troubleshooting

### Import Errors

Ensure virtual environment is activated:

```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Reinstall dependencies:

```bash
pip install -r requirements.txt
```

### Neo4j Connection Failed

Verify Neo4j is running and credentials are correct:

```bash
# Test connection
python -c "from langchain_neo4j import Neo4jGraph; g = Neo4jGraph()"
```

Check URI format:
- Cloud: `neo4j+s://xxxxx.databases.neo4j.io`
- Local: `bolt://localhost:7687`

### API Key Errors

Verify API keys are set:

```bash
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('GROQ_API_KEY'))"
```

### FAISS Index Not Found

Ensure `faiss_index/` directory exists with index files:

```bash
ls -la faiss_index/
# Should show: index.faiss, index.pkl
```

If missing, the vector search tool will be disabled but other tools will work.

### Model Not Available

Check available models:

```bash
curl http://localhost:8000/models
```

Verify API key for the provider you're using.

## Performance Optimization

### Use Faster Models

For quick responses, use smaller models:
- Groq: `llama-3.1-8b-instant`
- OpenAI: `gpt-4o-mini`

### Increase Workers

For production, use multiple workers:

```bash
uvicorn api:app --workers 4
```

### Cache Agent Instances

Agents are cached by provider+model combination to avoid recreation.

### Limit Recursion

Agent recursion limit is set to 50 to prevent infinite loops:

```python
config={"recursion_limit": 50}
```

## Security

- Never commit `.env` file
- Use environment variables for all secrets
- Restrict CORS origins in production
- Implement rate limiting
- Use HTTPS in production
- Validate all inputs

## Monitoring

Add logging:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
```

Monitor Neo4j queries:

```python
# Enable query logging in Neo4j
graph = Neo4jGraph(..., database="neo4j", enhanced_schema=True)
```

## Testing

Test the API:

```bash
# Health check
curl http://localhost:8000/

# List models
curl http://localhost:8000/models

# Research (streaming)
curl -X POST http://localhost:8000/research \
  -H "Content-Type: application/json" \
  -d '{"query": "Research OpenAI", "provider": "groq"}'

# Graph data
curl "http://localhost:8000/graph?query=OpenAI"
```

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [LangChain Documentation](https://python.langchain.com)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Neo4j Documentation](https://neo4j.com/docs/)
- [Groq Documentation](https://console.groq.com/docs)
- [Tavily Documentation](https://docs.tavily.com)
