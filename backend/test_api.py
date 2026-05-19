import requests
import fitz

# Create a boring general document that won't classify as medical/research/task/startup
doc = fitz.open()
page = doc.new_page()
page.insert_text((72, 72), """
Meeting Minutes - Team Sync 
Date: May 15, 2026

Attendees: Alice, Bob, Charlie, Dana

Agenda:
1. Review last sprint outcomes
2. Plan next iteration
3. Office logistics

Notes:
- Alice reported that the new desk arrangement is working well
- Bob mentioned the coffee machine needs maintenance  
- Charlie suggested we order new sticky notes for brainstorming sessions
- Dana updated on the parking situation

Action Items:
- Bob: Call maintenance for coffee machine by Friday
- Charlie: Order supplies from the office catalog
- Dana: Send parking permit forms to new hires

Next meeting: May 22, 2026
""")
doc.save("test_boring.pdf")
doc.close()

print("--- Testing with a boring general PDF (triggers RAG vector embedding) ---")
with open("test_boring.pdf", "rb") as f:
    resp = requests.post("http://127.0.0.1:8000/upload", files={"file": ("test_boring.pdf", f, "application/pdf")})

print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    import json
    print(json.dumps(resp.json(), indent=2))
else:
    print(f"Error: {resp.text}")
