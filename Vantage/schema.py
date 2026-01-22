# schema.py

# 1. Allowed Node Types
# We merge "Company", "Organization", "Startup" all into -> "Organization"
ALLOWED_NODES = [
    "Organization", 
    "Person", 
    "Investor", 
    "Product", 
    "Event"  # For things like "Series A", "Acquisition"
]

# 2. Allowed Relationships
# We standardize verbs so "Founded", "Started", "Created" all become -> "FOUNDED"
ALLOWED_RELATIONSHIPS = [
    "FOUNDED", 
    "INVESTED_IN", 
    "ACQUIRED", 
    "PARTNERED_WITH", 
    "EMPLOYED_BY", 
    "PRODUCED",       # For products
    "PARTICIPATED_IN" # For rounds like Series B
]

# 3. Description hints to help the LLM choose correctly
NODE_PROPERTIES = {
    "Organization": "Companies, startups, VC firms, non-profits, and government bodies.",
    "Person": "Founders, investors, employees, board members.",
    "Investor": "Specific VC firms or angel investors (can overlap with Organization).",
    "Product": "Software, hardware, apps, or APIs created by organizations.",
    "Event": "Funding rounds (Series A), IPOs, acquisitions."
}