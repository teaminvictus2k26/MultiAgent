import uuid
from typing import Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from dotenv import load_dotenv

from travel_schema import (
    FlightList, HotelList, TaxiList, Itinerary,
    SupervisorOutput
)
from travel_state import TravelState

load_dotenv()

llm = ChatGroq(model_name="llama-3.1-8b-instant", temperature=0.2)


def supervisor_agent(state: TravelState) -> TravelState:
    """Extracts destination, budget, dates, and detects appropriate currency."""
    origin = state.get("origin") or "Unknown"
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are a Travel Supervisor AI. Extract the destination, budget (as a number), "
            "and dates from the user request. "
            "Also detect the appropriate currency based on the user's origin city: '{origin}'. "
            "Rules: if origin is in India → currency='INR', currency_symbol='₹'. "
            "If origin is in the USA → currency='USD', currency_symbol='$'. "
            "If origin is in Europe → currency='EUR', currency_symbol='€'. "
            "If origin is in the UK → currency='GBP', currency_symbol='£'. "
            "Otherwise default to 'USD' and '$'. "
            "If the user explicitly mentions a currency symbol or code, use that. "
            "If budget is missing, default to 50000 for INR or 2000 for other currencies. "
            "If dates are missing, default to 'Flexible'."
        ),
        ("human", "{request}")
    ])
    chain = prompt | llm.with_structured_output(SupervisorOutput)
    res = chain.invoke({"request": state.get("user_request", ""), "origin": origin})

    if not res:
        return {
            "origin": origin,
            "destination": "Unknown",
            "budget": 2000.0,
            "dates": "Flexible",
            "currency": "USD",
            "currency_symbol": "$"
        }

    return {
        "origin": origin,
        "destination": res.destination or "Unknown",
        "budget": float(res.budget or 2000.0),
        "dates": res.dates or "Flexible",
        "currency": res.currency or "USD",
        "currency_symbol": res.currency_symbol or "$"
    }


def flight_agent(state: TravelState) -> TravelState:
    """Uses LLM to find 3 realistic flights from origin to destination."""
    origin = state.get("origin") or "Unknown"
    dest = state.get("destination") or "Unknown"
    dates = state.get("dates") or "Flexible"
    currency = state.get("currency") or "USD"
    symbol = state.get("currency_symbol") or "$"

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            f"You are a Flight Booking Agent. Provide exactly 3 realistic flight options "
            f"from {{origin}} to {{destination}} for dates: {{dates}}. "
            f"IMPORTANT: ALL prices MUST be in {currency} ({symbol}). "
            f"Use real airlines. Include realistic prices and a booking_url like "
            f"'https://www.google.com/flights?q={{origin}}+to+{{destination}}'."
        ),
        ("human", "Find me flights.")
    ])
    chain = prompt | llm.with_structured_output(FlightList)
    res = chain.invoke({"origin": origin, "destination": dest, "dates": dates})
    return {"flights": [f.model_dump() for f in res.flights] if res else []}


def hotel_agent(state: TravelState) -> TravelState:
    """Uses LLM to find 3 realistic hotels at the destination."""
    dest = state.get("destination") or "Unknown"
    dates = state.get("dates") or "Flexible"
    currency = state.get("currency") or "USD"
    symbol = state.get("currency_symbol") or "$"

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            f"You are a Hotel Booking Agent. Provide exactly 3 realistic accommodation options "
            f"in {{destination}} for dates: {{dates}}. One luxury hotel, one mid-range hotel, one budget hostel. "
            f"IMPORTANT: ALL prices MUST be in {currency} ({symbol}). "
            f"Use real or highly plausible hotel names. Include realistic prices per night and total_price, "
            f"a booking_url like 'https://www.booking.com/hotel/{{destination}}/...', "
            f"and a single descriptive image_keyword like 'resort', 'hostel', or 'boutique'."
        ),
        ("human", "Find me hotels.")
    ])
    chain = prompt | llm.with_structured_output(HotelList)
    res = chain.invoke({"destination": dest, "dates": dates})
    return {"hotels": [h.model_dump() for h in res.hotels] if res else []}


def taxi_agent(state: TravelState) -> TravelState:
    """Uses LLM to find 2 realistic airport transfer options."""
    dest = state.get("destination") or "Unknown"
    currency = state.get("currency") or "USD"
    symbol = state.get("currency_symbol") or "$"

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            f"You are a Local Transport Agent. Provide exactly 2 realistic airport transfer options "
            f"from {{destination}} airport to the city center. Use real services (e.g. Uber, local taxi, "
            f"airport express train). "
            f"IMPORTANT: ALL prices MUST be in {currency} ({symbol}). "
            f"Include realistic estimated_cost, vehicle_type, pickup and dropoff locations, and a booking_url."
        ),
        ("human", "Find airport transfers.")
    ])
    chain = prompt | llm.with_structured_output(TaxiList)
    res = chain.invoke({"destination": dest})
    return {"taxis": [t.model_dump() for t in res.taxis] if res else []}


def itinerary_agent(state: TravelState) -> TravelState:
    """Uses LLM to plan a detailed 3-day itinerary with real places and images."""
    dest = state.get("destination") or "Unknown"
    currency = state.get("currency") or "USD"
    symbol = state.get("currency_symbol") or "$"

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            f"You are an expert Itinerary Planner. Create a detailed 3-day itinerary for {{destination}}. "
            f"For each activity:\n"
            f"- Use the REAL name of the location or restaurant in location_name\n"
            f"- Write a vivid 1-sentence description\n"
            f"- IMPORTANT: ALL costs MUST be in {currency} ({symbol}). Give REALISTIC per-person costs.\n"
            f"- Provide a booking or info URL (e.g. official website or Google Maps link)\n"
            f"- Provide a single short image_keyword for that activity (e.g. 'sushi', 'temple', 'park')\n"
            f"Also provide a destination_image_keyword (one famous landmark keyword for a hero banner image)."
        ),
        ("human", "Plan a 3-day trip for {{destination}}.")
    ])
    chain = prompt | llm.with_structured_output(Itinerary)
    res = chain.invoke({"destination": dest})
    return {"itinerary": res.model_dump() if res else {"destination_image_keyword": "city", "activities": []}}


def _get(item, key, default=0):
    """Safe attribute/key getter for both dicts and Pydantic models."""
    if isinstance(item, dict):
        return item.get(key, default)
    return getattr(item, key, default)


def budget_agent(state: TravelState) -> TravelState:
    """Calculates total trip cost and checks against user budget."""
    budget = state.get("budget") or 2000
    flights = state.get("flights") or []
    hotels = state.get("hotels") or []
    taxis = state.get("taxis") or []
    itinerary = state.get("itinerary") or {}

    f_cost = min([_get(f, "price") for f in flights], default=0)
    h_cost = min([_get(h, "total_price") for h in hotels], default=0)
    t_cost = min([_get(t, "estimated_cost") for t in taxis], default=0)
    activities = itinerary.get("activities", []) if isinstance(itinerary, dict) else []
    a_cost = sum([_get(a, "cost") for a in activities])

    total = f_cost + h_cost + t_cost + a_cost
    over_budget = total > budget

    return {
        "budget_report": {
            "total_flights": f_cost,
            "total_hotels": h_cost,
            "total_taxis": t_cost,
            "total_activities": a_cost,
            "grand_total": total,
            "is_within_budget": not over_budget,
            "optimization_suggestions": (
                ["Consider the budget hostel option or reduce activities to stay within budget."]
                if over_budget else
                ["Budget looks great! All costs are within your limit."]
            )
        }
    }


def booking_agent(state: TravelState) -> TravelState:
    """Simulates booking execution and generates reference numbers."""
    return {
        "booking_status": {
            "flight_booking_ref": uuid.uuid4().hex[:8].upper(),
            "hotel_booking_ref": uuid.uuid4().hex[:8].upper(),
            "status": "Simulation Complete – Proceed to Payment"
        }
    }


def notification_agent(state: TravelState) -> TravelState:
    """Compiles the final summary message for the user."""
    dest = state.get("destination") or "Unknown"
    origin = state.get("origin") or "Unknown"
    total = (state.get("budget_report") or {}).get("grand_total", 0)
    ref = (state.get("booking_status") or {}).get("flight_booking_ref", "N/A")

    msg = (
        f"✈️ Your trip from {origin} to {dest} has been fully planned! "
        f"Estimated total: ${total:,.2f}. "
        f"Flight ref: {ref}. "
        "Review your hotels, itinerary, and transfers below."
    )
    return {"notification_sent": True, "final_response": msg}
