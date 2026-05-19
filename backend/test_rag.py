import sys
sys.path.append("f:/Aigent/backend")

from nodes import process_general_rag

state = {
    "extracted_text": "This is a random document about chairs and tables.",
    "user_symptoms": ""
}

try:
    print("Testing process_general_rag...")
    res = process_general_rag(state)
    print("Success:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
