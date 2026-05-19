from typing import TypedDict, Dict, Any

class EmergencyState(TypedDict):
    raw_symptoms: str
    patient_lat: float
    patient_lng: float
    severity_level: str
    suspected_condition: str
    required_specialist: str
    selected_hospital: Dict[str, Any]
    eta_minutes: float
    route_details: str
    doctor_brief: str
