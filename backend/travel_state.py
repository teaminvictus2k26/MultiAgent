from typing import TypedDict, Optional, List, Dict, Any

class TravelState(TypedDict):
    user_request: str
    origin: Optional[str]
    destination: Optional[str]
    budget: Optional[float]
    dates: Optional[str]
    currency: Optional[str]
    currency_symbol: Optional[str]
    
    flights: Optional[List[Dict[str, Any]]]
    hotels: Optional[List[Dict[str, Any]]]
    taxis: Optional[List[Dict[str, Any]]]
    itinerary: Optional[Dict[str, Any]]
    budget_report: Optional[Dict[str, Any]]
    booking_status: Optional[Dict[str, Any]]
    
    notification_sent: bool
    final_response: str
