from langgraph.graph import StateGraph, START, END
from emergency_state import EmergencyState
from emergency_nodes import (
    triage_agent,
    hospital_finder_agent,
    ambulance_agent,
    doctor_brief_agent
)

workflow = StateGraph(EmergencyState)

workflow.add_node("triage_agent", triage_agent)
workflow.add_node("hospital_finder_agent", hospital_finder_agent)
workflow.add_node("ambulance_agent", ambulance_agent)
workflow.add_node("doctor_brief_agent", doctor_brief_agent)

workflow.add_edge(START, "triage_agent")
workflow.add_edge("triage_agent", "hospital_finder_agent")
workflow.add_edge("hospital_finder_agent", "ambulance_agent")
workflow.add_edge("ambulance_agent", "doctor_brief_agent")
workflow.add_edge("doctor_brief_agent", END)

emergency_app = workflow.compile()
