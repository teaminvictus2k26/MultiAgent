from pydantic import BaseModel, Field
from typing import Dict, Any

class EmergencyRequest(BaseModel):
    raw_symptoms: str = Field(..., description="The medical symptoms inputted by family or bystanders")
    patient_lat: float = Field(..., description="Latitude coordinate tracked via mobile or vehicle GPS")
    patient_lng: float = Field(..., description="Longitude coordinate tracked via mobile or vehicle GPS")

class EmergencyResponse(BaseModel):
    severity_level: str
    suspected_condition: str
    required_specialist: str
    selected_hospital: Dict[str, Any]
    eta_minutes: float
    route_details: str
    doctor_brief: str
