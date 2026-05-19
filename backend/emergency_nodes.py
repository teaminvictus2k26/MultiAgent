import os
import json
import math
import pandas as pd
from typing import Dict, Any
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from dotenv import load_dotenv

from emergency_state import EmergencyState

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

_df = None

def get_hospitals_df():
    global _df
    if _df is None:
        csv_path = os.path.join(os.path.dirname(__file__), "Hospitals.csv")
        if os.path.exists(csv_path):
            _df = pd.read_csv(csv_path)
        else:
            # Fallback path if run from different dir
            csv_path_alt = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "Hospitals.csv")
            if os.path.exists(csv_path_alt):
                _df = pd.read_csv(csv_path_alt)
            else:
                raise FileNotFoundError(f"Hospitals.csv not found.")
    return _df

class TriageOutput(BaseModel):
    severity_level: str = Field(description="CRITICAL, URGENT, or STABLE")
    suspected_condition: str = Field(description="The suspected medical condition")
    required_specialist: str = Field(description="The required specialist doctor")

def triage_agent(state: EmergencyState) -> Dict[str, Any]:
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0, api_key=GROQ_API_KEY)

    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an expert ER Medical Triage Officer.\n"
            "Analyze the patient symptoms and output the triage categorization matching the schema."
        )),
        ("human", "{symptoms}")
    ])

    chain = prompt | llm.with_structured_output(TriageOutput)
    res = chain.invoke({"symptoms": state["raw_symptoms"]})

    return {
        "severity_level": res.severity_level,
        "suspected_condition": res.suspected_condition,
        "required_specialist": res.required_specialist
    }

def hospital_finder_agent(state: EmergencyState) -> Dict[str, Any]:
    p_lat = state["patient_lat"]
    p_lng = state["patient_lng"]

    best_hospital = None
    min_distance = float('inf')

    df = get_hospitals_df()
    for _, row in df.iterrows():
        h_lat = float(row["Latitude"])
        h_lng = float(row["Longitude"])

        # Distance calculation mapping
        distance = math.sqrt((p_lat - h_lat) ** 2 + (p_lng - h_lng) ** 2) * 111

        if distance < min_distance and float(row["Rating"]) >= 3.5:
            min_distance = distance
            best_hospital = {
                "id": row["id"],
                "name": f"Hospital #{row['id'].split('#')[-1]} ({row['City']})",
                "lat": h_lat,
                "lng": h_lng,
                "rating": row["Rating"]
            }

    if not best_hospital:
        # Let's try rating >= 3.0 if no hospital rating >= 3.5 is found
        for _, row in df.iterrows():
            h_lat = float(row["Latitude"])
            h_lng = float(row["Longitude"])
            distance = math.sqrt((p_lat - h_lat) ** 2 + (p_lng - h_lng) ** 2) * 111
            if distance < min_distance:
                min_distance = distance
                best_hospital = {
                    "id": row["id"],
                    "name": f"Hospital #{row['id'].split('#')[-1]} ({row['City']})",
                    "lat": h_lat,
                    "lng": h_lng,
                    "rating": row["Rating"]
                }

    if not best_hospital:
        # Hard fallback
        best_hospital = {
            "id": "HOSP#999",
            "name": "City General Hospital (Mumbai)",
            "lat": p_lat + 0.01,
            "lng": p_lng + 0.01,
            "rating": 4.0
        }

    return {"selected_hospital": best_hospital}

def ambulance_agent(state: EmergencyState) -> Dict[str, Any]:
    hosp = state["selected_hospital"]
    p_lat = state["patient_lat"]
    p_lng = state["patient_lng"]

    distance_kms = math.sqrt((p_lat - hosp["lat"]) ** 2 + (p_lng - hosp["lng"]) ** 2) * 111
    estimated_eta = (distance_kms / 30) * 60 + 3

    return {
        "eta_minutes": round(estimated_eta, 1),
        "route_details": f"Fastest route locked via Green Corridor straight to {hosp['name']}."
    }

def doctor_brief_agent(state: EmergencyState) -> Dict[str, Any]:
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.2, api_key=GROQ_API_KEY)

    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a clinical coordinator drafting an emergency heads-up brief for incoming ER doctors.\n"
            "Summarize the patient case cleanly. Mention symptoms, priority tier, and ETA.\n"
            "Keep it crisp, highly actionable, and structured with short bullet points."
        )),
        ("human", "Symptoms: {symptoms}\nSuspected: {cond}\nSeverity: {sev}\nETA: {eta} minutes")
    ])

    chain = prompt | llm
    brief = chain.invoke({
        "symptoms": state["raw_symptoms"],
        "cond": state["suspected_condition"],
        "sev": state["severity_level"],
        "eta": state["eta_minutes"]
    })

    return {"doctor_brief": brief.content}
