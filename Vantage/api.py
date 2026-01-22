import os
import re
import json
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Literal

# LangChain Imports
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from langchain_neo4j import Neo4jGraph
from tools import ALL_TOOLS
from whiteboard_tools import WHITEBOARD_TOOLS

# Optional OpenAI support
try:
    from langchain_openai import ChatOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Load Env
load_dotenv()

# --- APP SETUP ---
app = FastAPI(title="Vantage API (Streaming)", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AVAILABLE MODELS ---
GROQ_MODELS = [
    # Qwen 3 - BEST for function calling (recommended default)
    {"id": "qwen/qwen3-32b", "name": "Qwen 3 32B (Recommended)", "provider": "groq", "description": "Best reasoning & function calling"},
    
    # Llama 4 Scout - Tool use specialist  
    {"id": "meta-llama/llama-4-scout-17b-16e-instruct", "name": "Llama 4 Scout", "provider": "groq", "description": "Meta's latest - fast, great for tool use"},
    
    # Kimi K2 - Long context & tool use
    {"id": "moonshotai/kimi-k2-instruct-0905", "name": "Kimi K2", "provider": "groq", "description": "Moonshot 262K context - excellent function calling"},
    
    # GPT OSS Models (OpenAI open-weight)
    {"id": "openai/gpt-oss-120b", "name": "GPT OSS 120B", "provider": "groq", "description": "OpenAI's flagship 120B - reasoning, tool use, browser search"},
    {"id": "openai/gpt-oss-20b", "name": "GPT OSS 20B", "provider": "groq", "description": "Fast 20B model - reasoning, tool use, code execution"},
    
    # Llama 4 Maverick - Powerful multimodal
    {"id": "meta-llama/llama-4-maverick-17b-128e-instruct", "name": "Llama 4 Maverick", "provider": "groq", "description": "Meta's powerful 17B with 128 experts"},
    
    # Llama 3.3 70B - Production stable
    {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B", "provider": "groq", "description": "Production stable - versatile & reliable"},
    
    # Llama 3.1 8B - Fast & efficient
    {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B", "provider": "groq", "description": "Ultra fast - good for simple tasks"},
]

OPENAI_MODELS = [
    {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai", "description": "Most capable OpenAI model"},
    {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openai", "description": "Fast and cost-effective"},
    {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "provider": "openai", "description": "Legacy fast model"},
]

# --- DATA MODELS ---
class ResearchRequest(BaseModel):
    query: str
    provider: Optional[Literal["groq", "openai"]] = "groq"
    model: Optional[str] = None
    mode: Optional[Literal["chat", "research"]] = "chat"

class MapRequest(BaseModel):
    topic: str
    provider: Optional[Literal["groq", "openai"]] = "groq"
    model: Optional[str] = None

class GraphResponse(BaseModel):
    nodes: List[dict]
    edges: List[dict]
    focus_entity: str

# --- HELPER: ENTITY EXTRACTOR ---
def extract_entity_from_query(query: str) -> str:
    if not query: return ""
    query_lower = query.lower()
    known_entities = [
        "OpenAI", "Anthropic", "Perplexity", "Databricks", 
        "Zepto", "Swiggy", "Zomato", "Blinkit", "Meesho", 
        "Microsoft", "NVIDIA", "SoftBank", "Google", "Amazon"
    ]
    for entity in known_entities:
        if entity.lower() in query_lower:
            return entity
            
    prefixes = [
        r"research\s+", r"analyze\s+", r"write an investment memo for\s+", 
        r"memo for\s+", r"tell me about\s+"
    ]
    clean_query = query
    for p in prefixes:
        clean_query = re.sub(f"^{p}", "", clean_query, flags=re.IGNORECASE)
    return clean_query.strip().title()

# --- SYSTEM PROMPT ---
SYSTEM_PROMPT = """You are Vantage AI, an expert financial research assistant.

## MODES:
1. **Chat Mode** (Default): Answer questions, create specific charts/nodes as requested.
2. **Research Mode**: When asked to "Research" or "Deep Dive":
   - Use `research_and_learn` first.
   - Wait for the tool result.
   - Create a SINGLE comprehensive `create_text_node` with a Markdown summary.
   - DO NOT create scattered company/metric nodes unless they have specific, verified data.

## CRITICAL RULES:
1. **NO RAW OUTPUT**: Never output your internal thought process or raw tool results. Only speak to the user.
2. **NO 'UNKNOWN' NODES**: Do NOT create Company or Metric nodes if the value/price/market cap is "Unknown", "N/A", or missing.
   - Bad: Metric "Valuation: Unknown"
   - Good: Text Node "Valuation data is currently unavailable."
3. **TOOL USAGE**:
   - Always call tools to perform actions.
   - After tools finish, explain clearly what you created and provide a brief insight or summary of the data shown.
   - DO NOT copy-paste the tool output into the text response.

## AVAILABLE TOOLS:
- `create_chart_node(ticker, ...)`: Only if you have a VALID ticker.
- `create_metric_node(label, value, ...)`: Only if you have a SPECIFIC number.
- `create_company_node(...)`: Only if you have real financial data.
- `create_text_node(title, content)`: Use this for research summaries. Format content with Markdown.
- `research_and_learn(topic)`: Use for gathering info.
- `generate_knowledge_map(topic)`: Creates concept maps.
- `connect_nodes(...)`: Link related items.

## RESEARCH PROCESS (Strict):
1. User: "Research Stardrift AI"
2. You: Call `research_and_learn("Stardrift AI")`
3. Tool details: "...found funding $4M, val $20M..."
4. You: Call `create_company_node(..., market_cap="$20M")` AND `create_text_node("Stardrift Research", "## Findings\n...")`
5. You: "I've researched Stardrift AI and mapped available data."

If no data found:
"I couldn't find specific financial data for Stardrift AI." (Do NOT create empty nodes)."""

# --- LLM FACTORY ---
def get_llm(provider: str = "groq", model: str = None):
    """Create an LLM instance based on provider and model."""
    if provider == "openai":
        if not OPENAI_AVAILABLE:
            raise HTTPException(status_code=400, detail="OpenAI not installed. Run: pip install langchain-openai")
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")
        model_id = model or "gpt-4o-mini"
        return ChatOpenAI(model=model_id, temperature=0, streaming=True)
    else:  # Default to Groq
        if not os.getenv("GROQ_API_KEY"):
            raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")
        # Use Kimi K2 by default - best for tool calling
        model_id = model or os.getenv("GROQ_MODEL") or "moonshotai/kimi-k2-instruct-0905"
        return ChatGroq(model=model_id, temperature=0, streaming=True)

# --- COMBINED TOOLS ---
ALL_AGENT_TOOLS = ALL_TOOLS + WHITEBOARD_TOOLS

# --- AGENT FACTORY ---
def get_agent(provider: str = "groq", model: str = None):
    """Create a ReAct agent with the specified LLM."""
    llm = get_llm(provider, model)
    
    # Bind tools to the model (important for tool calling)
    llm_with_tools = llm.bind_tools(ALL_AGENT_TOOLS)
    
    # Create the agent with system prompt
    system_prompt = SystemMessage(content=SYSTEM_PROMPT)
    
    print(f"[AGENT] Creating agent with {len(ALL_AGENT_TOOLS)} tools: {[t.name for t in ALL_AGENT_TOOLS]}")
    
    return create_react_agent(llm_with_tools, tools=ALL_AGENT_TOOLS, prompt=system_prompt)

# Cache agents by provider+model combination
_agent_cache = {}

def get_agent_executor(provider: str = "groq", model: str = None):
    """Get or create a cached agent executor."""
    cache_key = f"{provider}:{model or 'default'}"
    if cache_key not in _agent_cache:
        _agent_cache[cache_key] = get_agent(provider, model)
    return _agent_cache[cache_key]

def clear_agent_cache():
    """Clear the agent cache to force recreation."""
    global _agent_cache
    _agent_cache = {}
    print("[CACHE] Agent cache cleared")

# Clear cache on startup
@app.on_event("startup")
async def startup_event():
    clear_agent_cache()
    print("[STARTUP] Vantage AI Server ready")
    print(f"[STARTUP] Available tools: {[t.name for t in ALL_AGENT_TOOLS]}")

# --- ENDPOINT 0: LIST AVAILABLE MODELS ---
@app.get("/models")
async def list_models():
    """Return list of available models by provider."""
    models = {
        "groq": GROQ_MODELS if os.getenv("GROQ_API_KEY") else [],
        "openai": OPENAI_MODELS if (OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY")) else [],
    }
    
    # Default provider and model
    default_provider = "groq" if os.getenv("GROQ_API_KEY") else ("openai" if os.getenv("OPENAI_API_KEY") else None)
    default_model = os.getenv("GROQ_MODEL") or "moonshotai/kimi-k2-instruct-0905"  # Kimi K2 - best for tool calling
    
    return {
        "models": models,
        "default_provider": default_provider,
        "default_model": default_model,
    }

# --- ENDPOINT 1: STREAMING TEXT REPORT ---
async def generate_stream(query: str, provider: str = "groq", model: str = None, mode: str = "chat"):
    """Generator function that yields chunks of text as they are generated."""
    try:
        executor = get_agent_executor(provider, model)
        
        # Add mode context to query if needed
        augmented_query = query
        if mode == "research":
            augmented_query += "\n\n[INSTRUCTION]: I am in RESEARCH MODE. Please gather comprehensive information first, then provide a single detailed summary. Do not create partial nodes."
            
        print(f"[STREAM] Starting stream for query: {augmented_query[:50]}... Mode: {mode}")
        
        # Increase recursion limit to prevent early cutoffs, but tool errors are now handled better
        async for event in executor.astream_events(
            {"messages": [HumanMessage(content=augmented_query)]}, 
            version="v2",
            config={"recursion_limit": 50}
        ):
            kind = event["event"]
            
            # Debug: Log all event types except streaming tokens
            if kind not in ["on_chat_model_stream"]:
                print(f"[EVENT] {kind}")
            
            # Yield text tokens from the model
            if kind == "on_chat_model_stream":
                chunk_data = event.get("data", {})
                chunk = chunk_data.get("chunk")
                if chunk:
                    content = getattr(chunk, "content", "")
                    if content:
                        yield content
            
            # CRITICAL: Capture tool outputs which contain our <<<ACTION:...:ACTION>>> markers
            elif kind == "on_tool_end":
                raw_output = event.get("data", {}).get("output", "")
                
                # Extract string content from various output types
                output_str = ""
                if isinstance(raw_output, str):
                    output_str = raw_output
                elif hasattr(raw_output, 'content'):
                    # ToolMessage object - extract content
                    output_str = str(raw_output.content) if raw_output.content else ""
                elif hasattr(raw_output, '__str__'):
                    output_str = str(raw_output)
                
                print(f"[TOOL END] Raw type: {type(raw_output).__name__}, Output: {output_str[:200]}...")
                
                # Check if this contains action markers
                if output_str and "<<<ACTION:" in output_str:
                    print(f"[ACTION FOUND] Yielding action: {output_str[:100]}...")
                    yield output_str
                
                # Clear status after tool matches
                yield "\n<<<STATUS::STATUS>>>\n"
            
            # Log tool calls for debugging AND yield status updates
            elif kind == "on_tool_start":
                tool_name = event.get("name", "unknown")
                tool_input = event.get("data", {}).get("input", {})
                print(f"[TOOL START] {tool_name}: {tool_input}")
                
                # Map specific tools to friendly status messages
                status_msg = f"Using {tool_name}..."
                if tool_name == "research_and_learn":
                    topic = tool_input.get('topic', 'topic')
                    status_msg = f"🕵️‍♂️ Researching: {topic}"
                elif tool_name == "create_chart_node":
                    ticker = tool_input.get('ticker', '')
                    status_msg = f"📈 Creating Chart: {ticker}"
                elif tool_name == "create_company_node":
                    ticker = tool_input.get('ticker', '')
                    status_msg = f"🏢 Fetching Data: {ticker}"
                elif tool_name == "generate_knowledge_map":
                    topic = tool_input.get('topic', '')
                    status_msg = f"🧠 Generating Map: {topic}"
                
                # Yield status marker
                yield f"\n<<<STATUS:{status_msg}:STATUS>>>\n"
                    
    except Exception as e:
        import traceback
        print(f"[STREAM ERROR] {str(e)}")
        traceback.print_exc()
        yield f"Error: {str(e)}"

@app.post("/research")
async def research_endpoint(request: ResearchRequest):
    """Stream research results."""
    return StreamingResponse(
        generate_stream(request.query, request.provider, request.model, request.mode), 
        media_type="text/event-stream"
    )

@app.post("/map")
async def generate_map_endpoint(request: MapRequest):
    """Generate a knowledge map for a topic."""
    llm = get_llm(request.provider or "groq", request.model)
    prompt = f"""
    You are a research assistant. Generate a knowledge graph for the topic: "{request.topic}".
    Return a JSON object with two keys: "nodes" and "edges".
    
    "nodes": list of objects {{ "id": "unique_id", "label": "Short Label", "type": "concept|company|person", "summary": "Brief description" }}
    "edges": list of objects {{ "source": "source_id", "target": "target_id", "label": "relationship" }}
    
    Create 6-10 nodes covering: Market, Competitors, Key Figures, Risks, Product, History.
    Ensure the central node is "{request.topic}".
    Output strictly valid JSON only.
    """
    response = llm.invoke(prompt)
    content = response.content
    # Handle both string and list content types
    if isinstance(content, list):
        content = str(content[0]) if content else "{}"
    content = content.replace("```json", "").replace("```", "")
    try:
        return json.loads(content)
    except:
        return {"nodes": [], "edges": []}

# --- ENDPOINT 2: GRAPH DATA (Standard JSON) ---
@app.get("/graph", response_model=GraphResponse)
async def get_graph(query: str):
    # ... (Keep your exact previous Graph Logic here) ...
    # (I omitted it to save space, but copy the @app.get("/graph") function 
    # from the previous code block exactly as it was.)
    try:
        focus_entity = extract_entity_from_query(query)
        try:
            graph = Neo4jGraph(
                url=os.getenv("NEO4J_URI"),
                username=os.getenv("NEO4J_USERNAME"),
                password=os.getenv("NEO4J_PASSWORD")
            )
        except:
             return {"nodes": [], "edges": [], "focus_entity": focus_entity}

        if focus_entity:
            safe_entity = focus_entity.replace("'", "\\'")
            center_res = graph.query(f"MATCH (n) WHERE toLower(n.id) = toLower('{safe_entity}') RETURN n.id as id, labels(n)[0] as label LIMIT 1")
            
            if not center_res:
                 return {"nodes": [], "edges": [], "focus_entity": focus_entity}
            
            real_id = center_res[0]['id']
            data = graph.query(f"""
            MATCH (n {{id: '{real_id}'}})-[r]-(m)
            RETURN n.id as source, type(r) as type, m.id as target, labels(m)[0] as target_label LIMIT 20
            """)
            
            nodes = {}
            edges = []
            nodes[real_id] = {"id": real_id, "label": real_id, "color": "#FF4B4B", "size": 40, "group": "Center"}

            for row in data:
                target = row['target']
                t_label = row['target_label']
                rel_type = row['type']
                color = "#AB63FA" 
                if t_label == "Investor" or rel_type == "INVESTED_IN": color = "#00CC96" 
                elif rel_type == "COMPETES_WITH": color = "#FFA15A" 
                elif t_label == "Person": color = "#636EFA" 

                nodes[target] = {"id": target, "label": target, "color": color, "size": 20, "group": t_label}
                edges.append({"source": row['source'], "target": target, "color": "#555"})
            
            return {"nodes": list(nodes.values()), "edges": edges, "focus_entity": focus_entity}
        else:
             return {"nodes": [], "edges": [], "focus_entity": ""}
    except Exception as e:
        return {"nodes": [], "edges": [], "focus_entity": ""}
