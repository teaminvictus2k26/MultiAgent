from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class AbnormalValue(BaseModel):
    name: str = Field(description="Name of the abnormal value or test")
    value: str = Field(description="The recorded value")
    reference: Optional[str] = Field(None, description="Normal reference range if mentioned")
    severity: Optional[str] = Field(None, description="Severity of the abnormality if indicated")

class MedicalFinding(BaseModel):
    symptoms: Optional[List[str]] = Field(default_factory=list)
    diseases: Optional[List[str]] = Field(default_factory=list)
    abnormal_values: Optional[List[AbnormalValue]] = Field(default_factory=list)
    severity: Optional[Literal["low", "moderate", "high", "critical"]] = Field(None)
    triage: Optional[str] = Field(None, description="Triage recommendation")
    summary: Optional[str] = Field(None, description="Overall summary of the medical findings")

class Citation(BaseModel):
    chunk: str
    score: Optional[float] = None

class RagResult(BaseModel):
    summary: Optional[str] = None
    key_points: Optional[List[str]] = Field(default_factory=list)
    citations: Optional[List[Citation]] = Field(default_factory=list)

class ClassificationResult(BaseModel):
    category: Literal["medical", "research", "legal", "financial", "academic", "general", "task", "startup"] = Field(description="The document category")
    confidence: Optional[float] = Field(None, description="Confidence score between 0.0 and 1.0")
    reasoning: Optional[str] = Field(None, description="Reasoning for the classification")

class TaskResult(BaseModel):
    plan: Optional[str] = None
    execution: Optional[str] = None
    review: Optional[str] = None

class StartupSimulation(BaseModel):
    vision: Optional[str] = None
    architecture: Optional[str] = None
    scoping: Optional[str] = None

class AutomatedResearch(BaseModel):
    search_queries: Optional[List[str]] = Field(default_factory=list)
    summary: Optional[str] = None
    presentation: Optional[str] = None

class AnalyzeResponse(BaseModel):
    classification: ClassificationResult
    pipeline: Literal["medical", "rag", "task", "startup", "research"]
    medical: Optional[MedicalFinding] = None
    research: Optional[RagResult] = None
    task_team: Optional[TaskResult] = None
    startup: Optional[StartupSimulation] = None
    automated_research: Optional[AutomatedResearch] = None
    raw_text_preview: Optional[str] = None
