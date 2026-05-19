from typing import TypedDict, Optional, Any
from schema import ClassificationResult, MedicalFinding, RagResult, TaskResult, StartupSimulation, AutomatedResearch

class TriageState(TypedDict):
    """
    State schema for the triage workflow.
    """
    file_path: Optional[str]
    user_symptoms: Optional[str]
    extracted_text: Optional[str]
    
    classification: Optional[ClassificationResult]
    doc_type: Optional[str]  # Derived pipeline: 'medical', 'general/rag', 'task', 'startup', 'research'
    
    medical_finding: Optional[MedicalFinding]
    rag_result: Optional[RagResult]
    task_result: Optional[TaskResult]
    startup_sim: Optional[StartupSimulation]
    auto_research: Optional[AutomatedResearch]
    
    # For RAG context if non-medical
    rag_context: Optional[str]
