import os
import json
from dotenv import load_dotenv
load_dotenv()

from langchain_core.tools import tool
from langchain_neo4j import Neo4jGraph, GraphCypherQAChain
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings.fake import FakeEmbeddings

# Try DuckDuckGo (Free) instead of Tavily to avoid API Key issues
try:
    from langchain_community.tools import DuckDuckGoSearchRun
    search_tool = DuckDuckGoSearchRun()
    SEARCH_AVAILABLE = True
except ImportError:
    SEARCH_AVAILABLE = False

# 1. SETUP GRAPH
graph = Neo4jGraph(
    url=os.getenv("NEO4J_URI"),
    username=os.getenv("NEO4J_USERNAME"),
    password=os.getenv("NEO4J_PASSWORD")
)

# 2. THE IMPROVED LEARNER TOOL
@tool
def research_and_learn(topic: str) -> str:
    """
    Research a topic (Company, Person, Investor).
    Scrapes web -> Extracts Entites -> Updates Graph.
    Returns a textual summary of what was found.
    """
    print(f"🕵️‍♂️ Researching: {topic}")
    
    # A. Search (Search for 'Investors' explicitly if topic implies it)
    search_query = topic
    if "investor" not in topic.lower() and "ceo" not in topic.lower():
         search_query += " investors CEO founders details"
    
    raw_text = ""
    if SEARCH_AVAILABLE:
        try:
            raw_text = search_tool.invoke(search_query)
        except Exception as e:
            return f"Search failed: {str(e)}"
    else:
        return "Search tool not available."
    
    # B. Extract (Added 'LEADS' for CEOs)
    groq_model = os.getenv("GROQ_MODEL") or "moonshotai/kimi-k2-instruct-0905"
    llm = ChatGroq(temperature=0, model=groq_model, streaming=False)
    
    extraction_prompt = f"""
    You are a Data Engineer. Extract structured data.
    
    Rules:
    1. Identify Companies, People, Sectors, Locations.
    2. Relationships:
       - INVESTED_IN (Investor -> Company)
       - FOUNDED_BY (Company -> Person)
       - LEADS (Person -> Company) -> USE THIS FOR CEOs / Executives!
       - OPERATES_IN (Company -> Sector)
       - LOCATED_AT (Company -> Location)
    
    Output strictly valid JSON:
    {{
      "companies": ["Name"],
      "people": ["Name"],
      "sectors": ["Name"],
      "locations": ["Name"],
      "relationships": [
        {{"source": "PersonName", "target": "CompanyName", "type": "LEADS"}},
        {{"source": "InvestorName", "target": "CompanyName", "type": "INVESTED_IN"}}
      ]
    }}

    Text:
    {raw_text}
    """
    
    response = llm.invoke(extraction_prompt)
    
    # C. Write & Return Summary
    try:
        clean_json = response.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        
        # Create Nodes
        for key in ["companies", "people", "sectors", "locations"]:
            label = "Organization" if key == "companies" else "Person" if key == "people" else "Sector" if key == "sectors" else "Location"
            for item in data.get(key, []):
                graph.query(f"MERGE (n:{label} {{id: $name}})", params={"name": item})

        # Create Relationships
        for rel in data.get("relationships", []):
            rel_type = rel['type'].upper()
            if rel_type == "INVESTED_IN":
                graph.query("MATCH (n {id: $name}) SET n:Investor", params={"name": rel["source"]})
            
            cypher = (
                "MATCH (a {id: $source}), (b {id: $target}) "
                f"MERGE (a)-[:{rel_type}]->(b)"
            )
            graph.query(cypher, params={"source": rel["source"], "target": rel["target"]})
            
        # RETURN SUMMARY (So Agent knows what happened)
        summary = f"I have updated the database. Found: {', '.join(data.get('companies', [])[:3])}. "
        if data.get('people'):
            summary += f"Key People: {', '.join(data.get('people', []))}."
        return summary
    
    except Exception as e:
        return f"Error: {e}"

# 3. EXISTING TOOLS (Updated Cypher Prompt for CEO)
CYPHER_GENERATION_TEMPLATE = """
Task: Generate Cypher statement to query a graph database.
Schema:
{schema}

Instructions:
1. Use `toLower()` for string matching.
2. For "CEO" or "Leader" questions, check BOTH `[:LEADS]` and `[:FOUNDED_BY]`.
   Example: MATCH (p:Person)-[:LEADS]->(c:Organization) WHERE toLower(c.id) = 'hyundai' RETURN p

Question: {question}
"""
CYPHER_PROMPT = PromptTemplate(template=CYPHER_GENERATION_TEMPLATE, input_variables=["schema", "question"])

@tool
def query_graph_database(question: str) -> str:
    """Useful for querying the graph database."""
    groq_model = os.getenv("GROQ_MODEL") or "moonshotai/kimi-k2-instruct-0905"
    chain = GraphCypherQAChain.from_llm(
        ChatGroq(temperature=0, model=groq_model, streaming=False),
        graph=graph, verbose=True, cypher_prompt=CYPHER_PROMPT, allow_dangerous_requests=True
    )
    try:
        return chain.invoke(question)["result"]
    except Exception as e:
        return "No info in graph."

@tool
def query_text_database(query: str) -> str:
    """Useful for definition questions."""
    embeddings = FakeEmbeddings(size=1536)
    try:
        vector_store = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)
        return vector_store.similarity_search(query, k=1)[0].page_content
    except:
        return "No text data found."

ALL_TOOLS = [query_graph_database, query_text_database, research_and_learn]
