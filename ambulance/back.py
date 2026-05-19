# /// script
# dependencies = [
#     "langgraph",
#     "langchain-groq",
#     "pandas",
#     "fastapi",
#     "uvicorn",
#     "python-dotenv",
# ]
# ///

import os
import json
import math
import pandas as pd
from typing import TypedDict, Dict, Any
from contextlib import asynccontextmanager

# Backend Framework Imports
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

# LangChain & LangGraph official imports
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from dotenv import load_dotenv

# Load Environment Variables early
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("❌ Critical Error: GROQ_API_KEY environment variable is missing!")

# Global variable to hold hospital data framework efficiently in memory
df = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan handles startup data caching cleanly.
    Ensures Hospitals.csv is only read once into memory instead of on every request.
    """
    global df
    csv_path = "Hospitals.csv"
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"❌ Missing mandatory file: '{csv_path}' could not be located.")
    df = pd.read_csv(csv_path)
    print("📈 Hospitals Database cached successfully into memory.")
    yield
    # Cleanup operations go here if needed
    print("📉 Shutting down backend framework.")


# Initialize FastAPI with metadata and lifespan configurations
app = FastAPI(
    title="MediRelay Emergency Routing Backend",
    description="Multi-Agent System powered by LangGraph & Groq to optimize Indian Emergency Healthcare routes.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable Cross-Origin Resource Sharing (CORS) so your frontend can connect seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production hackathon testing; restrict to specific domains later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------
# STEP 1: Define Input & Output Schemas via Pydantic
# -------------------------------------------------------------
class EmergencyRequest(BaseModel):
    raw_symptoms: str = Field(..., description="The medical symptoms inputted by family or bystanders",
                              example="58-year-old female experiencing severe crushing chest pain radiating down her left arm.")
    patient_lat: float = Field(..., description="Latitude coordinate tracked via mobile or vehicle GPS",
                               example=19.9940)
    patient_lng: float = Field(..., description="Longitude coordinate tracked via mobile or vehicle GPS",
                               example=73.8338)


class EmergencyResponse(BaseModel):
    severity_level: str
    suspected_condition: str
    required_specialist: str
    selected_hospital: Dict[str, Any]
    eta_minutes: float
    route_details: str
    doctor_brief: str


# -------------------------------------------------------------
# STEP 2: LangGraph State Definition
# -------------------------------------------------------------
class MediRelayState(TypedDict):
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


# -------------------------------------------------------------
# STEP 3: LangGraph Node Implementation Functions
# -------------------------------------------------------------
def agent_1_triage(state: MediRelayState) -> Dict[str, Any]:
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=GROQ_API_KEY)

    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an expert ER Medical Triage Officer.\n"
            "Analyze the patient symptoms and output JSON format ONLY with keys:\n"
            "'severity_level' (CRITICAL, URGENT, STABLE), \n"
            "'suspected_condition' (e.g., STEMI Heart Attack, Stroke, Seizure), \n"
            "'required_specialist' (Cardiologist, Neurologist, General Physician, Pediatrician)"
        )),
        ("human", "{symptoms}")
    ])

    chain = prompt | llm
    response = chain.invoke({"symptoms": state["raw_symptoms"]})

    clean_content = response.content.replace("```json", "").replace("```", "").strip()
    data = json.loads(clean_content)

    return {
        "severity_level": data["severity_level"],
        "suspected_condition": data["suspected_condition"],
        "required_specialist": data["required_specialist"]
    }


def agent_2_hospital_finder(state: MediRelayState) -> Dict[str, Any]:
    p_lat = state["patient_lat"]
    p_lng = state["patient_lng"]

    best_hospital = None
    min_distance = float('inf')

    # Read from global data frame instance initialized during app startup
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
        raise ValueError("No viable hospital matches available near current location grid coordinates.")

    return {"selected_hospital": best_hospital}


def agent_3_ambulance_coordinator(state: MediRelayState) -> Dict[str, Any]:
    hosp = state["selected_hospital"]
    p_lat = state["patient_lat"]
    p_lng = state["patient_lng"]

    distance_kms = math.sqrt((p_lat - hosp["lat"]) ** 2 + (p_lng - hosp["lng"]) ** 2) * 111
    estimated_eta = (distance_kms / 30) * 60 + 3

    return {
        "eta_minutes": round(estimated_eta, 1),
        "route_details": f"Fastest route locked via Green Corridor straight to {hosp['name']}."
    }


def agent_4_doctor_briefing(state: MediRelayState) -> Dict[str, Any]:
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2, api_key=GROQ_API_KEY)

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


# -------------------------------------------------------------
# STEP 4: Setup LangGraph Processing Engine Topology
# -------------------------------------------------------------
workflow = StateGraph(MediRelayState)

workflow.add_node("triage_agent", agent_1_triage)
workflow.add_node("hospital_finder_agent", agent_2_hospital_finder)
workflow.add_node("ambulance_agent", agent_3_ambulance_coordinator)
workflow.add_node("doctor_brief_agent", agent_4_doctor_briefing)

workflow.add_edge(START, "triage_agent")
workflow.add_edge("triage_agent", "hospital_finder_agent")
workflow.add_edge("hospital_finder_agent", "ambulance_agent")
workflow.add_edge("ambulance_agent", "doctor_brief_agent")
workflow.add_edge("doctor_brief_agent", END)

medi_relay_app = workflow.compile()


# -------------------------------------------------------------
# STEP 5: Define API Routing Endpoints
# -------------------------------------------------------------
@app.get("/", tags=["Healthcheck"])
async def root_healthcheck():
    """Simple connection entrypoint checking server readiness."""
    return {"status": "online", "system": "MediRelay Multi-Agent Backend Engine Ready"}


@app.post("/api/v1/emergency", response_model=EmergencyResponse, tags=["Core Emergency Operation"])
async def dispatch_emergency_relay(payload: EmergencyRequest):
    """
    Primary intake endpoint. Takes immediate emergency variables,
    processes them through LangGraph state nodes, and outputs structured solutions.
    """
    try:
        # Construct graph configuration dictionary from validation payload
        graph_input = {
            "raw_symptoms": payload.raw_symptoms,
            "patient_lat": payload.patient_lat,
            "patient_lng": payload.patient_lng
        }

        # Execute state machine graph flow synchronously inside asynchronous container wrapper
        graph_result = medi_relay_app.invoke(graph_input)

        return graph_result

    except json.JSONDecodeError as json_err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to cleanly process structured output from downstream LLM models: {str(json_err)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred within the graph pipeline runtime execution: {str(e)}"
        )


# Run executable module block using configuration setups
if __name__ == "__main__":
    uvicorn.run("back:app", host="0.0.0.0", port=8000, reload=True)