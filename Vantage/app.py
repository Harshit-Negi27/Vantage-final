import streamlit as st
import os
import re
from dotenv import load_dotenv

load_dotenv()

# LangChain / LangGraph
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from langchain_neo4j import Neo4jGraph

# Graph visualization
from streamlit_agraph import agraph, Node, Edge, Config
from tools import ALL_TOOLS


def extract_entity_from_query(query: str) -> str:
    """Extract a known entity from a free-form user query."""
    if not query:
        return ""

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
        r"research\s+", r"analyze\s+", r"analyse\s+",
        r"investment memo for\s+", r"memo for\s+",
        r"write an investment for\s+", r"write a report on\s+",
        r"write an investment memo for\s+",
        r"tell me about\s+", r"who is\s+", r"what is\s+"
    ]

    clean_query = query
    for p in prefixes:
        clean_query = re.sub(f"^{p}", "", clean_query, flags=re.IGNORECASE)

    return clean_query.strip().title()


st.set_page_config(
    page_title="Vantage | VC Analyst Agent",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown(
    """
    <style>
    .stApp { background-color: #0E1117; }
    h1 { color: #FF4B4B; }
    .stChatInput { border-color: #FF4B4B; }
    div[data-testid="stMarkdownContainer"] p { font-size: 1.1rem; }
    </style>
    """,
    unsafe_allow_html=True
)

st.title("Vantage: VC Analyst")


col1, col2 = st.columns([1, 1.5])


@st.cache_resource
def get_agent():
    if not os.getenv("GROQ_API_KEY"):
        st.error("GROQ_API_KEY is not set")
        st.stop()
    groq_model = os.getenv("GROQ_MODEL") or "llama-3.1-8b-instant"
    llm = ChatGroq(model=groq_model, temperature=0)
    return create_react_agent(llm, tools=ALL_TOOLS)


agent_executor = get_agent()


def get_graph_data(focus_entity: str | None = None):
    try:
        graph = Neo4jGraph(
            url=os.getenv("NEO4J_URI"),
            username=os.getenv("NEO4J_USERNAME"),
            password=os.getenv("NEO4J_PASSWORD")
        )
    except Exception:
        return [], []

    if focus_entity and focus_entity.strip():
        safe_entity = focus_entity.strip().replace("'", "\\'")

        center = graph.query(f"""
            MATCH (n)
            WHERE toLower(n.id) = toLower('{safe_entity}')
            RETURN n.id AS id, labels(n)[0] AS label
            LIMIT 1
        """)

        if not center:
            return [], []

        real_id = center[0]["id"]

        investors = graph.query(f"""
            MATCH (o:Organization)-[:INVESTED_IN]->(c {{id: '{real_id}'}})
            RETURN o.id AS source, c.id AS target, 'Investor' AS label
            LIMIT 10
        """)

        team = graph.query(f"""
            MATCH (p:Person)-[:LEADS|FOUNDED_BY]->(c {{id: '{real_id}'}})
            RETURN p.id AS source, c.id AS target, 'Person' AS label
            LIMIT 5
        """)

        rows = investors + team
        center_data = real_id
    else:
        rows = graph.query("""
            MATCH (n)-[r]->(m)
            RETURN n.id AS source, m.id AS target, labels(n)[0] AS label
            LIMIT 20
        """)
        center_data = None

    nodes = {}
    edges = []

    def add_node(node_id, label, center=False):
        if node_id in nodes:
            return

        if center:
            color, size = "#FF4B4B", 40
        elif label == "Investor":
            color, size = "#00CC96", 25
        elif label == "Person":
            color, size = "#636EFA", 20
        else:
            color, size = "#AB63FA", 15

        nodes[node_id] = Node(
            id=node_id,
            label=node_id,
            size=size,
            color=color,
            font={"color": "white", "size": 14}
        )

    if center_data:
        add_node(center_data, "Center", center=True)

    for r in rows:
        add_node(r["source"], r["label"])
        add_node(r["target"], "Center" if r["target"] == center_data else "Organization")

        edges.append(
            Edge(
                source=r["source"],
                target=r["target"],
                color="#555",
                strokeWidth=2
            )
        )

    return list(nodes.values()), edges


with col1:
    st.subheader("Investment Memo")

    if "messages" not in st.session_state:
        st.session_state.messages = [
            SystemMessage(content="""
You are a Senior VC Analyst at Sequoia Capital.
Write a rigorous investment memo using the internal dataset below as the source of truth
for valuations and investors. Use external search only for market, trends, and risks.
""")
        ]

    for msg in st.session_state.messages:
        if isinstance(msg, SystemMessage):
            continue
        role = "user" if msg.type == "human" else "assistant"
        st.chat_message(role).write(msg.content)

    user_input = st.chat_input("e.g. Research Meesho")

    if user_input:
        st.chat_message("user").write(user_input)
        st.session_state.messages.append(HumanMessage(content=user_input))

        with st.chat_message("assistant"):
            response = agent_executor.invoke(
                {"messages": st.session_state.messages}
            )
            answer = response["messages"][-1].content
            st.markdown(answer)
            st.session_state.messages.append(AIMessage(content=answer))

        st.rerun()


with col2:
    st.subheader("Network Map")

    default_focus = ""
    for msg in reversed(st.session_state.messages):
        if isinstance(msg, HumanMessage):
            default_focus = extract_entity_from_query(msg.content)
            break

    focus = st.text_input("Focus entity", value=default_focus)

    if focus:
        st.caption(f"Showing network for: **{focus}**")

    nodes, edges = get_graph_data(focus)

    if nodes:
        config = Config(
            width=900,
            height=700,
            directed=True,
            physics=True,
            nodeHighlightBehavior=True,
            highlightColor="#F7A7A6"
        )
        agraph(nodes=nodes, edges=edges, config=config)
    else:
        st.info("No graph data available.")
