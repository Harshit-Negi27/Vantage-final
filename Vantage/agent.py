import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage
from tools import ALL_TOOLS

load_dotenv()

if not os.getenv("GROQ_API_KEY"):
    raise RuntimeError("GROQ_API_KEY is not set")
groq_model = os.getenv("GROQ_MODEL") or "llama-3.1-8b-instant"
llm = ChatGroq(model=groq_model, temperature=0)
# "create_react_agent" automatically builds the loop: 
# Think -> Act (Call Tool) -> Observe (Result) -> Answer
agent_executor = create_react_agent(llm, ALL_TOOLS)

def run_chat():
    print("Vantage Agent Online. Type 'exit' to quit.")
    print("-" * 50)
    
    #  INIT MEMORY (Outside the loop!)
    chat_history = [] 
    
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            print("Goodbye")
            break
            
        print("Thinking...")
        
        # APPEND NEW INPUT TO HISTORY
        current_messages = chat_history + [HumanMessage(content=user_input)]
        
        # RUN AGENT WITH FULL CONTEXT
        events = agent_executor.stream(
            {"messages": current_messages},
            stream_mode="values"
        )

        # PROCESS EVENTS & UPDATE MEMORY
        final_response = None
        
        for event in events:
            if "messages" in event:
                # The agent returns the FULL conversation history every step
                # We update our chat_history to match the agent's latest state
                chat_history = event["messages"]
                
                # Grab the last message to check if it's the AI's final answer
                last_msg = chat_history[-1]
                if last_msg.type == "ai":
                    final_response = last_msg.content

        # PRINT ONLY THE FINAL ANSWER
        if final_response:
            print(f"Agent: {final_response}")

if __name__ == "__main__":
    run_chat()
