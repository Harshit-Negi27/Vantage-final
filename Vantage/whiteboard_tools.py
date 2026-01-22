"""
Whiteboard Action Tools for AI Agent

These tools allow the AI to create and manipulate whiteboard elements.
Actions are returned as structured JSON that the frontend processes.
"""

import json
from langchain_core.tools import tool
from typing import Optional

# Action types that frontend understands
ACTION_TYPES = {
    "CREATE_NODE": "create_node",
    "CREATE_CHART": "create_chart", 
    "CREATE_METRIC": "create_metric",
    "CREATE_COMPANY": "create_company",
    "CREATE_RESEARCH": "create_research",
    "UPDATE_NODE": "update_node",
    "CONNECT_NODES": "connect_nodes",
    "GENERATE_MAP": "generate_map",
}

def emit_action(action_type: str, data: dict) -> str:
    """Format an action for the frontend to process."""
    action = {
        "type": action_type,
        "data": data
    }
    # Use special delimiters so frontend can parse actions from stream
    return f"\n<<<ACTION:{json.dumps(action)}:ACTION>>>\n"


@tool
def create_research_node(title: str, summary: str = "", initial_query: str = "") -> str:
    """
    Create a new research node on the whiteboard.
    Use this when the user wants to start researching a topic.
    
    Args:
        title: The title of the research node (e.g., "OpenAI Research", "Market Analysis")
        summary: Brief description or context for the research
        initial_query: Optional initial research query to populate the node
    
    Returns:
        Confirmation message with action data for frontend
    """
    return emit_action(ACTION_TYPES["CREATE_RESEARCH"], {
        "title": title,
        "summary": summary,
        "initial_query": initial_query,
        "node_type": "research"
    })


@tool  
def create_chart_node(ticker: str, chart_type: str = "line", timeframe: str = "1M", title: str = "") -> str:
    """
    Create a stock/financial chart node on the whiteboard.
    Use this when the user asks to visualize stock data or price movements.
    
    Args:
        ticker: Stock ticker symbol (e.g., "AAPL", "MSFT", "GOOGL", "TSLA")
        chart_type: Type of chart - "line", "area", or "bar"
        timeframe: Time period - "1D", "1W", "1M", "3M", "6M", "1Y"
        title: Optional custom title for the chart
    
    Returns:
        Confirmation message with action data for frontend
    """
    chart_title = title or f"{ticker} Price Chart"
    return emit_action(ACTION_TYPES["CREATE_CHART"], {
        "title": chart_title,
        "node_type": "chart",
        "chart": {
            "ticker": ticker.upper(),
            "chartType": chart_type,
            "timeframe": timeframe,
            "title": chart_title
        }
    })


@tool
def create_metric_node(label: str, value: str, ticker: str = "", trend: str = "neutral", unit: str = "") -> str:
    """
    Create a metric/KPI display node on the whiteboard.
    Use this to highlight key financial metrics, statistics, or KPIs.
    
    Args:
        label: Name of the metric (e.g., "Market Cap", "P/E Ratio", "Revenue Growth")
        value: The metric value (e.g., "$2.89T", "28.5", "+15%")
        ticker: Optional ticker symbol if metric is company-specific
        trend: Direction indicator - "up", "down", or "neutral"
        unit: Optional unit label (e.g., "USD", "%", "B")
    
    Returns:
        Confirmation message with action data for frontend
    """
    return emit_action(ACTION_TYPES["CREATE_METRIC"], {
        "title": label,
        "node_type": "metric",
        "metric": {
            "label": label,
            "value": value,
            "ticker": ticker.upper() if ticker else "",
            "trend": trend,
            "unit": unit,
            "metricType": "custom"
        }
    })


@tool
def create_company_node(ticker: str, name: str = "", sector: str = "", market_cap: str = "", 
                        price: float = 0, description: str = "") -> str:
    """
    Create a company profile node on the whiteboard.
    Use this when user wants to analyze or track a specific company.
    
    Args:
        ticker: Stock ticker symbol (e.g., "AAPL", "MSFT")
        name: Full company name (e.g., "Apple Inc.")
        sector: Industry sector (e.g., "Technology", "Healthcare")
        market_cap: Market capitalization (e.g., "$2.89T")
        price: Current stock price
        description: Brief company description
    
    Returns:
        Confirmation message with action data for frontend
    """
    return emit_action(ACTION_TYPES["CREATE_COMPANY"], {
        "title": ticker.upper(),
        "node_type": "company",
        "company": {
            "ticker": ticker.upper(),
            "name": name,
            "sector": sector,
            "marketCap": market_cap,
            "price": price,
            "description": description,
            "change": 0,
            "changePercent": 0
        }
    })


@tool
def create_text_node(title: str, content: str) -> str:
    """
    Create a text/notes node on the whiteboard.
    Use this for adding notes, observations, or text summaries.
    
    Args:
        title: Title for the text node
        content: The text content to display
    
    Returns:
        Confirmation message with action data for frontend
    """
    return emit_action(ACTION_TYPES["CREATE_NODE"], {
        "title": title,
        "node_type": "text",
        "data": {
            "content": content
        }
    })


@tool
def connect_nodes(source_title: str, target_title: str, relationship: str = "") -> str:
    """
    Create a connection/edge between two nodes on the whiteboard.
    Use this to show relationships between different elements.
    
    Args:
        source_title: Title of the source node
        target_title: Title of the target node  
        relationship: Optional label for the relationship
    
    Returns:
        Confirmation message with action data for frontend
    """
    return emit_action(ACTION_TYPES["CONNECT_NODES"], {
        "source_title": source_title,
        "target_title": target_title,
        "relationship": relationship
    })


@tool
def generate_knowledge_map(topic: str, depth: str = "medium") -> str:
    """
    Generate a knowledge map/graph for a topic.
    This creates multiple interconnected nodes about a subject.
    
    Args:
        topic: The central topic to map (e.g., "Electric Vehicles Market", "AI Startups")
        depth: How detailed - "quick" (3-5 nodes), "medium" (6-8 nodes), "detailed" (10+ nodes)
    
    Returns:
        Confirmation message with action data for frontend
    """
    return emit_action(ACTION_TYPES["GENERATE_MAP"], {
        "topic": topic,
        "depth": depth
    })


@tool
def analyze_portfolio(tickers: str) -> str:
    """
    Create a portfolio analysis view with multiple company nodes and charts.
    Use when user wants to compare multiple stocks or build a watchlist.
    
    Args:
        tickers: Comma-separated list of ticker symbols (e.g., "AAPL,MSFT,GOOGL,AMZN")
    
    Returns:
        Confirmation of portfolio nodes being created
    """
    ticker_list = [t.strip().upper() for t in tickers.split(",")]
    actions = []
    
    for ticker in ticker_list[:6]:  # Limit to 6 to avoid clutter
        actions.append({
            "type": ACTION_TYPES["CREATE_CHART"],
            "data": {
                "title": f"{ticker} Chart",
                "node_type": "chart",
                "chart": {
                    "ticker": ticker,
                    "chartType": "line",
                    "timeframe": "1M"
                }
            }
        })
    
    # Return all actions
    result = ""
    for action in actions:
        result += f"\n<<<ACTION:{json.dumps(action)}:ACTION>>>\n"
    
    return result + f"\nCreated portfolio view for: {', '.join(ticker_list)}"


# Export all whiteboard tools
WHITEBOARD_TOOLS = [
    create_research_node,
    create_chart_node,
    create_metric_node,
    create_company_node,
    create_text_node,
    connect_nodes,
    generate_knowledge_map,
    analyze_portfolio,
]
