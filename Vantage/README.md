# Vantage: Autonomous VC Due Diligence Agent

Vantage is a GraphRAG-style VC research assistant that combines:
- An LLM “analyst” agent (LangGraph + OpenAI chat models)
- A persistent Knowledge Graph (Neo4j) for structured relationships (investors, founders, competitors)
- A lightweight Vector index (FAISS) for unstructured snippets/definitions
- Two serving modes:
  - Streamlit UI for a hackathon demo dashboard
  - FastAPI service exposing a streaming research endpoint and a graph endpoint

## Repository Layout

- [app.py](file:///Users/pranshubansal/Vantage-Hackathon/Vantage/app.py): Streamlit dashboard (chat + network map)
- [api.py](file:///Users/pranshubansal/Vantage-Hackathon/Vantage/api.py): FastAPI service (streaming memo + graph JSON)
- [tools.py](file:///Users/pranshubansal/Vantage-Hackathon/Vantage/tools.py): Agent toolbelt (Neo4j, FAISS, web research)
- [seed.py](file:///Users/pranshubansal/Vantage-Hackathon/Vantage/seed.py): Seeds Neo4j with a small dataset
- [agent.py](file:///Users/pranshubansal/Vantage-Hackathon/Vantage/agent.py): CLI chat runner (no UI)
- [faiss_index/](file:///Users/pranshubansal/Vantage-Hackathon/Vantage/faiss_index): Prebuilt FAISS index files used by the text tool
- [archive/](file:///Users/pranshubansal/Vantage-Hackathon/Vantage/archive): Experimental scripts (graph ingest, vector build, PDF plan)

## How It Works (In-Depth)

### Core Data Flow

1. User asks a question (company research, “who invested in X?”, “who is the CEO?”).
2. The agent (LangGraph ReAct-style loop) decides whether to:
   - Query Neo4j for structured facts (relationships, entities)
   - Query FAISS for definition-style / unstructured snippets
   - Use Tavily-powered web search and then write newly extracted entities back into Neo4j
3. The final output is an “Investment Memo”-style response in Markdown.

### The Three Main Tools

Defined in [tools.py](file:///Users/pranshubansal/Vantage-Hackathon/Vantage/tools.py):

- `query_graph_database(question: str) -> str`
  - Uses `GraphCypherQAChain` to translate a natural-language question into Cypher and query Neo4j.
- `query_text_database(query: str) -> str`
  - Loads a local `faiss_index/` and returns the closest snippet.
- `research_and_learn(topic: str) -> str`
  - Uses Tavily web search, asks an LLM to extract structured JSON, then merges nodes/edges into Neo4j.

### Persistent Memory

The “memory” in this project is primarily the Neo4j graph:
- Every successful `research_and_learn` call expands the graph and makes future queries richer.
- `seed.py` initializes a baseline dataset (organizations, people, investors, competitive edges).

### Serving Modes

- Streamlit demo UI: [app.py](file:///Users/pranshubansal/Vantage-Hackathon/Vantage/app.py)
  - Left panel: chat + memo output
  - Right panel: graph visualization from Neo4j for a “focus entity”
- FastAPI backend: [api.py](file:///Users/pranshubansal/Vantage-Hackathon/Vantage/api.py)
  - `/research` streams the memo output token-by-token
  - `/graph` returns graph nodes/edges suitable for a frontend force-graph renderer

## Environment Variables

Create a `.env` file in the `Vantage/` directory (or export these variables):

- `OPENAI_API_KEY`
- `NEO4J_URI`
- `NEO4J_USERNAME`
- `NEO4J_PASSWORD`
- `TAVILY_API_KEY` (required for the web research tool)

## FastAPI API Specification

Base URL: wherever you run the server (example: `http://localhost:8000`)

### POST `/research`

Generates an “Investment Memo” as a streaming response.

Request:
- `Content-Type: application/json`
- Body:

```json
{ "query": "Research Meesho" }
```

Response:
- `200 OK`
- `Content-Type: text/event-stream`
- Body: a stream of text chunks (model tokens).

Notes for clients:
- The response is streamed as raw text chunks (not structured JSON, and not framed as strict SSE `data:` events).
- Treat it as a chunked text stream and concatenate in order to render the final Markdown.

### GET `/graph?query=...`

Returns a “local neighborhood” graph for the entity inferred from the query.

Request:
- Query string: `query` (string)
  - Example: `/graph?query=Research%20OpenAI`

Response (`200 OK`):

```json
{
  "nodes": [
    { "id": "OpenAI", "label": "OpenAI", "color": "#FF4B4B", "size": 40, "group": "Center" },
    { "id": "Microsoft", "label": "Microsoft", "color": "#00CC96", "size": 20, "group": "Organization" }
  ],
  "edges": [
    { "source": "OpenAI", "target": "Microsoft", "color": "#555" }
  ],
  "focus_entity": "OpenAI"
}
```

Field semantics:
- `focus_entity`: extracted from the user query (best-effort).
- `nodes[]`:
  - `id`: entity identifier (Neo4j `n.id`)
  - `label`: display label (currently identical to `id`)
  - `color`: UI hint for node type/relationship
  - `size`: UI hint
  - `group`: UI hint (“Center”, “Person”, “Investor”, etc.)
- `edges[]`:
  - `source`: source node id
  - `target`: target node id
  - `color`: UI hint

Empty graph behavior:
- If Neo4j is unreachable, or the entity is not found, the API returns `nodes: []`, `edges: []` and `focus_entity` may be set.

## Minimum Requirements

### Backend Minimum Requirements

- Python: 3.10+ (required by `str | None` syntax used in [app.py](file:///Users/pranshubansal/Vantage-Hackathon/Vantage/app.py))
- Services:
  - Neo4j 5+ reachable via `NEO4J_URI` credentials
- Credentials:
  - OpenAI API key (`OPENAI_API_KEY`)
  - Tavily key if you want web research (`TAVILY_API_KEY`)
- Data:
  - `faiss_index/` directory present in the process working directory (run from `Vantage/` so `faiss_index` resolves correctly)

### Frontend Minimum Requirements (If Using FastAPI)

Any frontend (Next.js, React, etc.) integrating with `api.py` should minimally:

- Support streaming text consumption from `POST /research`
  - Append chunks incrementally to show partial memo output
  - Render the final string as Markdown
- Support graph rendering from `GET /graph`
  - Accept `nodes[]` / `edges[]` arrays and visualize them (force-graph, cytoscape, sigma.js, etc.)
  - Handle empty graph responses gracefully (show “no data” state)
- Handle CORS:
  - The backend currently allows `*` origins via CORS middleware

## Quickstart (Local)

From the repo root:

```bash
cd Vantage
python -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt
```

Seed Neo4j:

```bash
python seed.py
```

Run Streamlit UI:

```bash
streamlit run app.py
```

Run FastAPI:

```bash
uvicorn api:app --reload --port 8000
```
