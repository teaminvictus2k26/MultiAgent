import os
import sys
sys.path.append("f:/Aigent/backend")

from workflow import app as workflow_app

initial_state = {
    "file_path": "dummy.pdf",
    "user_symptoms": "",
    "extracted_text": "This is a simple text about software engineering and startups. " * 50,
    "classification": None,
    "doc_type": None,
    "medical_finding": None,
    "rag_result": None,
    "task_result": None,
    "startup_sim": None,
    "auto_research": None,
    "rag_context": None
}

try:
    print("Running workflow invoke...")
    final_state = workflow_app.invoke(initial_state)
    print("Success! doc_type:", final_state.get("doc_type"))
except Exception as e:
    import traceback
    traceback.print_exc()
