from langgraph.graph import StateGraph, END
from state import TriageState
from nodes import classify_document, analyze_medical, process_general_rag, run_task_team, run_startup_sim, run_auto_research

def route_document(state: TriageState) -> str:
    """
    Conditional edge routing function.
    Checks the doc_type state variable and splits the flow.
    """
    doc_type = state.get("doc_type", "general")
    if doc_type == "medical":
        return "analyze_medical"
    elif doc_type == "task":
        return "run_task_team"
    elif doc_type == "startup":
        return "run_startup_sim"
    elif doc_type == "research":
        return "run_auto_research"
    else:
        return "process_general_rag"

def create_workflow():
    # Instantiate the StateGraph
    workflow = StateGraph(TriageState)
    
    # Add nodes
    workflow.add_node("classify", classify_document)
    workflow.add_node("analyze_medical", analyze_medical)
    workflow.add_node("process_general_rag", process_general_rag)
    workflow.add_node("run_task_team", run_task_team)
    workflow.add_node("run_startup_sim", run_startup_sim)
    workflow.add_node("run_auto_research", run_auto_research)
    
    # Set the entry point
    workflow.set_entry_point("classify")
    
    # Add conditional edges
    workflow.add_conditional_edges(
        "classify",
        route_document,
        {
            "analyze_medical": "analyze_medical",
            "process_general_rag": "process_general_rag",
            "run_task_team": "run_task_team",
            "run_startup_sim": "run_startup_sim",
            "run_auto_research": "run_auto_research"
        }
    )
    
    # Add edges to END
    workflow.add_edge("analyze_medical", END)
    workflow.add_edge("process_general_rag", END)
    workflow.add_edge("run_task_team", END)
    workflow.add_edge("run_startup_sim", END)
    workflow.add_edge("run_auto_research", END)
    
    # Compile
    return workflow.compile()

app = create_workflow()
