import os
from dotenv import load_dotenv
from langchain_neo4j import Neo4jGraph

load_dotenv()

# Connect to Neo4j
try:
    graph = Neo4jGraph(
        url=os.getenv("NEO4J_URI"),
        username=os.getenv("NEO4J_USERNAME"),
        password=os.getenv("NEO4J_PASSWORD")
    )
    print("Connected to Neo4j")
except Exception as e:
    print(f"Neo4j connection failed: {e}")
    exit()

# Reset database
graph.query("MATCH (n) DETACH DELETE n")

def seed_company(name, data):
    # Escape single quotes for Cypher
    desc = data["description"].replace("'", "\\'")
    val = data["valuation"].replace("'", "\\'")
    sec = data["sector"].replace("'", "\\'")
    stat = data["status"].replace("'", "\\'")

    graph.query(f"""
        MERGE (c:Organization {{id: '{name}'}})
        SET c.valuation = '{val}',
            c.sector = '{sec}',
            c.description = '{desc}',
            c.status = '{stat}'
    """)

    for founder in data["founders"]:
        founder = founder.replace("'", "\\'")
        graph.query(f"""
            MERGE (p:Person {{id: '{founder}'}})
            MERGE (c:Organization {{id: '{name}'}})
            MERGE (p)-[:LEADS]->(c)
        """)

    for investor in data["investors"]:
        investor = investor.replace("'", "\\'")
        graph.query(f"""
            MERGE (i:Organization {{id: '{investor}'}})
            MERGE (c:Organization {{id: '{name}'}})
            MERGE (i)-[:INVESTED_IN]->(c)
        """)

dataset = {
    "OpenAI": {
        "valuation": "$157 Billion",
        "sector": "Artificial Intelligence",
        "status": "Private",
        "description": "Creator of ChatGPT and GPT-4.",
        "founders": ["Sam Altman", "Greg Brockman", "Ilya Sutskever"],
        "investors": ["Microsoft", "Thrive Capital", "Khosla Ventures", "Fidelity"]
    },
    "Anthropic": {
        "valuation": "$40 Billion",
        "sector": "AI Safety",
        "status": "Private",
        "description": "AI safety company building reliable, interpretable AI systems.",
        "founders": ["Dario Amodei", "Daniela Amodei"],
        "investors": ["Amazon", "Google", "Menlo Ventures", "Spark Capital"]
    },
    "Perplexity": {
        "valuation": "$3 Billion",
        "sector": "AI Search",
        "status": "Private",
        "description": "Conversational answer engine challenging Google.",
        "founders": ["Aravind Srinivas", "Denis Yarats"],
        "investors": ["NVIDIA", "Jeff Bezos", "Institutional Venture Partners"]
    },
    "Databricks": {
        "valuation": "$43 Billion",
        "sector": "Data & AI",
        "status": "Private",
        "description": "Unified data analytics platform for large-scale data engineering.",
        "founders": ["Ali Ghodsi", "Matei Zaharia", "Ion Stoica"],
        "investors": ["Andreessen Horowitz", "NVIDIA", "Microsoft", "T. Rowe Price"]
    },
    "Zepto": {
        "valuation": "$5 Billion",
        "sector": "Quick Commerce",
        "status": "Unicorn",
        "description": "India's 10-minute grocery delivery service.",
        "founders": ["Aadit Palicha", "Kaivalya Vohra"],
        "investors": ["Y Combinator", "Nexus VP", "Glade Brook", "StepStone"]
    },
    "Swiggy": {
        "valuation": "$12.7 Billion",
        "sector": "Food Tech",
        "status": "Public",
        "description": "On-demand food delivery platform in India.",
        "founders": ["Sriharsha Majety", "Nandan Reddy"],
        "investors": ["Prosus", "SoftBank", "Accel", "Baron Capital"]
    },
    "Zomato": {
        "valuation": "$20 Billion+",
        "sector": "Food Tech",
        "status": "Public",
        "description": "Restaurant discovery and food delivery company.",
        "founders": ["Deepinder Goyal"],
        "investors": ["Info Edge", "Ant Financial", "Tiger Global"]
    },
    "Blinkit": {
        "valuation": "Acquired ($568M)",
        "sector": "Quick Commerce",
        "status": "Acquired",
        "description": "Quick commerce subsidiary of Zomato.",
        "founders": ["Albinder Dhindsa"],
        "investors": ["Zomato", "SoftBank", "Sequoia India"]
    },
    "Meesho": {
        "valuation": "$5 Billion",
        "sector": "E-Commerce",
        "status": "Unicorn",
        "description": "Social commerce platform for small businesses.",
        "founders": ["Vidit Aatrey", "Sanjeev Barnwal"],
        "investors": ["SoftBank", "Meta", "Sequoia India", "Fidelity"]
    },
    "Microsoft": {
        "valuation": "$3 Trillion",
        "sector": "Big Tech",
        "status": "Public",
        "description": "Global technology company focused on AI infrastructure.",
        "founders": ["Bill Gates", "Paul Allen"],
        "investors": ["Vanguard", "BlackRock"]
    },
    "NVIDIA": {
        "valuation": "$3 Trillion",
        "sector": "Hardware / AI",
        "status": "Public",
        "description": "Semiconductor company powering AI workloads.",
        "founders": ["Jensen Huang"],
        "investors": ["Vanguard", "Fidelity"]
    },
    "SoftBank": {
        "valuation": "$80 Billion",
        "sector": "Investment Firm",
        "status": "Public",
        "description": "Global investment and technology holding company.",
        "founders": ["Masayoshi Son"],
        "investors": ["Public Market"]
    },
    "Google": {
        "valuation": "$2 Trillion",
        "sector": "Big Tech",
        "status": "Public",
        "description": "Technology company focused on search and AI.",
        "founders": ["Larry Page", "Sergey Brin"],
        "investors": ["Vanguard", "BlackRock", "Fidelity"]
    },
    "Amazon": {
        "valuation": "$2 Trillion",
        "sector": "Big Tech",
        "status": "Public",
        "description": "E-commerce and cloud computing company.",
        "founders": ["Jeff Bezos"],
        "investors": ["Vanguard", "BlackRock", "State Street"]
    }
}

for company, data in dataset.items():
    seed_company(company, data)

def create_competition(companies):
    for i in range(len(companies)):
        for j in range(i + 1, len(companies)):
            graph.query(f"""
                MATCH (a:Organization {{id: '{companies[i]}'}}),
                      (b:Organization {{id: '{companies[j]}'}})
                MERGE (a)-[:COMPETES_WITH]->(b)
                MERGE (b)-[:COMPETES_WITH]->(a)
            """)

create_competition(["Zepto", "Blinkit", "Swiggy", "Zomato", "Meesho"])
create_competition(["OpenAI", "Anthropic", "Databricks", "Perplexity", "Google"])

graph.query("MATCH (a:Organization {id: 'Amazon'}), (b:Organization {id: 'Anthropic'}) MERGE (a)-[:INVESTED_IN]->(b)")
graph.query("MATCH (a:Organization {id: 'Google'}), (b:Organization {id: 'Anthropic'}) MERGE (a)-[:INVESTED_IN]->(b)")
graph.query("MATCH (a:Organization {id: 'Google'}), (b:Organization {id: 'Databricks'}) MERGE (a)-[:INVESTED_IN]->(b)")
graph.query("MATCH (a:Organization {id: 'Microsoft'}), (b:Organization {id: 'OpenAI'}) MERGE (a)-[:INVESTED_IN]->(b)")
graph.query("MATCH (a:Organization {id: 'Microsoft'}), (b:Organization {id: 'Databricks'}) MERGE (a)-[:INVESTED_IN]->(b)")
graph.query("MATCH (a:Organization {id: 'NVIDIA'}), (b:Organization {id: 'Perplexity'}) MERGE (a)-[:INVESTED_IN]->(b)")
graph.query("MATCH (a:Organization {id: 'NVIDIA'}), (b:Organization {id: 'Databricks'}) MERGE (a)-[:INVESTED_IN]->(b)")

print("Database seeded successfully")
