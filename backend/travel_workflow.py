from langgraph.graph import StateGraph, START, END
from travel_state import TravelState
from travel_nodes import (
    supervisor_agent,
    flight_agent,
    hotel_agent,
    taxi_agent,
    itinerary_agent,
    budget_agent,
    booking_agent,
    notification_agent
)

# 1. Initialize graph
travel_graph = StateGraph(TravelState)

# 2. Add nodes
travel_graph.add_node("supervisor", supervisor_agent)
travel_graph.add_node("flight", flight_agent)
travel_graph.add_node("hotel", hotel_agent)
travel_graph.add_node("taxi", taxi_agent)
travel_graph.add_node("itinerary", itinerary_agent)
travel_graph.add_node("budget", budget_agent)
travel_graph.add_node("booking", booking_agent)
travel_graph.add_node("notification", notification_agent)

# 3. Add edges (Linear for simplicity as per diagram, but flights/hotels/itinerary could run in parallel)
travel_graph.add_edge(START, "supervisor")

# Supervisor delegates to parallel execution of flight, hotel, taxi, and itinerary
travel_graph.add_edge("supervisor", "flight")
travel_graph.add_edge("supervisor", "hotel")
travel_graph.add_edge("supervisor", "taxi")
travel_graph.add_edge("supervisor", "itinerary")

# All must finish before budget can calculate total
travel_graph.add_edge(["flight", "hotel", "taxi", "itinerary"], "budget")

# Budget goes to Booking
travel_graph.add_edge("budget", "booking")

# Booking goes to Notification
travel_graph.add_edge("booking", "notification")

# Notification finishes workflow
travel_graph.add_edge("notification", END)

# 4. Compile
travel_app = travel_graph.compile()
