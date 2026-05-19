import os
import traceback
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import tempfile
import uuid

from extractor import extract_text_from_pdf
from workflow import app as workflow_app
from schema import AnalyzeResponse
from travel_schema import TravelPlanResponse
from nodes import llm
from travel_workflow import travel_app
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import List, Dict, Any

from emergency_schema import EmergencyRequest, EmergencyResponse
from emergency_workflow import emergency_app

app = FastAPI(title="MultiAgent Triage API")

# Setup CORS to allow the frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "https://multi-agent-delta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/upload", response_model=AnalyzeResponse)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    try:
        # Save uploaded file temporarily
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
            
        # Extract text
        extracted_text = extract_text_from_pdf(tmp_path)
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract text from the document.")
            
        # Run workflow
        initial_state = {
            "file_path": file.filename,
            "user_symptoms": "",
            "extracted_text": extracted_text,
            "classification": None,
            "doc_type": None,
            "medical_finding": None,
            "rag_result": None,
            "task_result": None,
            "startup_sim": None,
            "auto_research": None,
            "rag_context": None
        }
        
        # We need to run it synchronously or async. LangGraph supports astream/ainvoke but we can use invoke
        final_state = workflow_app.invoke(initial_state)
        
        pipeline_map = {
            "medical": "medical",
            "task": "task",
            "startup": "startup",
            "research": "research",
            "general": "rag"
        }
        pipeline_val = pipeline_map.get(final_state["doc_type"], "rag")
        
        # Construct the AnalyzeResponse based on our schema
        response = AnalyzeResponse(
            classification=final_state["classification"],
            pipeline=pipeline_val,
            medical=final_state.get("medical_finding"),
            research=final_state.get("rag_result"),
            task_team=final_state.get("task_result"),
            startup=final_state.get("startup_sim"),
            automated_research=final_state.get("auto_research"),
            raw_text_preview=extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None
    context: Optional[str] = None

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        messages = []
        # Add system message with context if provided
        system_content = "You are a helpful multi-agent AI assistant."
        if request.context:
            system_content += f"\n\nHere is the context of the user's uploaded documents:\n{request.context}"
        messages.append(SystemMessage(content=system_content))
        
        # Add history
        if request.history:
            for msg in request.history[-4:]:  # last 4 messages
                if msg.get("role") == "user":
                    messages.append(HumanMessage(content=msg.get("content", "")))
                elif msg.get("role") == "assistant":
                    messages.append(AIMessage(content=msg.get("content", "")))
                    
        # Add current message
        messages.append(HumanMessage(content=request.message))
        
        response = llm.invoke(messages)
        return {"reply": response.content, "agents": ["classifier"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agents/status")
async def get_agent_status():
    return {
        "router": "online",
        "medical_diagnostician": "online",
        "rag_pipeline": "online"
    }

@app.get("/documents")
async def get_documents():
    return []

@app.get("/analysis/{id}")
async def get_analysis(id: str):
    raise HTTPException(status_code=404, detail="Analysis not found")

class TripRequest(BaseModel):
    message: str
    origin: Optional[str] = None

@app.post("/plan_trip", response_model=TravelPlanResponse)
async def plan_trip(request: TripRequest):
    try:
        initial_state = {
            "user_request": request.message,
            "origin": request.origin or "Unknown",
            "destination": None,
            "budget": None,
            "dates": None,
            "currency": None,
            "currency_symbol": None,
            "flights": None,
            "hotels": None,
            "taxis": None,
            "itinerary": None,
            "budget_report": None,
            "booking_status": None,
            "notification_sent": False,
            "final_response": ""
        }
        
        final_state = travel_app.invoke(initial_state)
        
        response = TravelPlanResponse(
            destination=final_state.get("destination", "Unknown"),
            budget=final_state.get("budget", 0),
            origin=final_state.get("origin") or "Unknown",
            dates=final_state.get("dates", ""),
            currency=final_state.get("currency") or "USD",
            currency_symbol=final_state.get("currency_symbol") or "$",
            flights=final_state.get("flights", []),
            hotels=final_state.get("hotels", []),
            taxis=final_state.get("taxis", []),
            itinerary=final_state.get("itinerary"),
            budget_report=final_state.get("budget_report"),
            booking_confirmation=final_state.get("booking_status"),
            notification_sent=final_state.get("notification_sent", False),
            message=final_state.get("final_response", "")
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/emergency", response_model=EmergencyResponse, tags=["Core Emergency Operation"])
async def dispatch_emergency_relay(payload: EmergencyRequest):
    try:
        graph_input = {
            "raw_symptoms": payload.raw_symptoms,
            "patient_lat": payload.patient_lat,
            "patient_lng": payload.patient_lng
        }
        
        # Invoke emergency workflow graph
        graph_result = emergency_app.invoke(graph_input)
        return graph_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
