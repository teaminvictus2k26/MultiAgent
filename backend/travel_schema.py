from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class Flight(BaseModel):
    airline: str
    flight_number: str
    departure_time: str
    arrival_time: str
    price: float
    booking_url: Optional[str] = Field(default=None, description="A realistic link to book this flight")

class FlightList(BaseModel):
    flights: List[Flight]

class Hotel(BaseModel):
    name: str
    check_in: str
    check_out: str
    price_per_night: float
    total_price: float
    booking_url: Optional[str] = Field(default=None, description="A realistic link to book this hotel")
    image_keyword: str = Field(default="hotel", description="A single word keyword to fetch an image for this hotel (e.g. resort, hostel, luxury)")

class HotelList(BaseModel):
    hotels: List[Hotel]

class Activity(BaseModel):
    day: int
    time: str
    description: str
    location_name: str = Field(default="Various", description="Name of the restaurant or landmark")
    cost: float
    booking_url: Optional[str] = Field(default=None, description="A link to the activity or restaurant")
    image_keyword: str = Field(default="city", description="A single word describing the activity (e.g. sushi, museum, park)")

class SupervisorOutput(BaseModel):
    destination: str = Field(description="The destination city/country")
    budget: float = Field(description="The total budget for the trip")
    dates: str = Field(description="The dates for the trip")
    currency: str = Field(default="USD", description="The currency to use for all prices, e.g. 'INR' for India trips, 'USD' for international trips, 'EUR' for Europe, 'GBP' for UK")
    currency_symbol: str = Field(default="$", description="The currency symbol, e.g. '₹' for INR, '$' for USD, '€' for EUR")

class Taxi(BaseModel):
    company: str
    vehicle_type: str
    estimated_cost: float
    pickup: str
    dropoff: str
    booking_url: Optional[str] = Field(default=None, description="A realistic link to book this transfer")

class TaxiList(BaseModel):
    taxis: List[Taxi]

class Itinerary(BaseModel):
    destination_image_keyword: str = Field(default="city", description="One word keyword for the destination to fetch an image")
    activities: List[Activity] = Field(default_factory=list)

class BudgetReport(BaseModel):
    total_flights: float
    total_hotels: float
    total_taxis: float
    total_activities: float
    grand_total: float
    is_within_budget: bool
    optimization_suggestions: Optional[List[str]] = None

class BookingConfirmation(BaseModel):
    flight_booking_ref: Optional[str] = None
    hotel_booking_ref: Optional[str] = None
    status: str

class TravelPlanResponse(BaseModel):
    destination: str
    budget: float
    origin: str
    dates: str
    currency: str = "USD"
    currency_symbol: str = "$"
    flights: List[Flight] = Field(default_factory=list)
    hotels: List[Hotel] = Field(default_factory=list)
    taxis: List[Taxi] = Field(default_factory=list)
    itinerary: Optional[Itinerary] = None
    budget_report: Optional[BudgetReport] = None
    booking_confirmation: Optional[BookingConfirmation] = None
    notification_sent: bool = False
    message: str = ""
