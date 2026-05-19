# MultiAgent
MultiAgent Systeam
# Nexus MediRelay — Multi-Agent Emergency Dispatch & Triage System

Nexus MediRelay is an intelligent, multi-agent workspace and emergency response system. It features an automated intake dashboard, real-time doctor/ambulance driver queues, manual triage acceptance workflows, and a flexible document ingestion pipeline powered by LangGraph and RAG.

---

## 🏗️ System Architecture

The project is structured as a monorepo containing three core components:

```
├── backend/       # FastAPI + LangGraph + LangChain RAG pipeline
├── frontend/      # Vite + React + TypeScript + Tailwind (Patient/Workspace UI)
└── ambulance/     # Vite + React + TypeScript (Dedicated Staff Portal)
```

### 1. Backend (`/backend`)
- **FastAPI**: Serves the REST endpoints for document uploads, real-time chat, and emergency dispatch workflows.
- **LangGraph**: Orchestrates stateful multi-agent pipelines (routers, medical analysis agents, task planners, and RAG pipelines).
- **RAG & Search**: Uses LangChain's built-in `InMemoryVectorStore` combined with `HuggingFaceEmbeddings` (`TaylorAI/bge-micro-v2`, ~17MB) for fast, lightweight local semantic matching.
- **LLM Integrations**: Powered by Groq Cloud (`llama-3.1-8b-instant`) to perform high-speed structured data extraction and logical reasoning.

### 2. Frontend (`/frontend`)
- **React & TypeScript**: Features a gorgeous glassmorphism workspace UI, dynamic chat interfaces, real-time location capture (GPS intake), and responsive tables.
- **Zustand (`useEmergencyStore`)**: Powers cross-component and cross-tab state management, paired with broadcast channels for real-time status syncing.
- **Framer Motion**: Smooth interactive transitions and visual feedback during uploads and routing pipelines.

### 3. Ambulance Staff Portal (`/ambulance`)
- **Staff-Facing Interface**: Built specifically for Emergency Responders and ER Doctors.
- **Acceptance Loop**: Pauses the dispatch pipeline at a `PENDING_ACCEPTANCE` state, prompting manual confirmation from a driver/doctor before simulating ambulance routing.

---

## ⚡ Key Features

* 📍 **Live Geolocation Intake**: Captures native browser GPS coordinates and auto-resolves addresses to place the emergency case instantly.
* 📂 **Context-Aware Doc Uploader**: Drag-and-drop file analyzer displaying real-time upload progress, verification states, and document content thumbnails.
* 🤖 **Stateful Multi-Agent Workflows**:
  * **Medical Diagnostic Agent**: Analyzes clinical reports, extracts severity metrics, and matches specialists.
  * **RAG General Doc Search**: Automatically indexes text chunks and returns LLM-backed answers with citations.
  * **Startup/Task Planners**: Routes non-medical files to dedicated scoping and scoping simulators.
* 🚑 **Manual Accept Loop**: Halts auto-dispatching until real-world agents accept a case to ensure triage safety.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Groq API Key

### 1. Backend Setup
1. Navigate to `/backend`.
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # macOS/Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install langchain-community langchain-huggingface
   ```
4. Create a `.env` file in the `/backend` folder:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
5. Start the API server:
   ```bash
   uvicorn api:app --reload
   ```
   *Runs on `http://127.0.0.1:8000`*

### 2. Frontend Setup
1. Navigate to `/frontend`.
2. Install Node modules:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *Runs on `http://localhost:8080` (or `5173` depending on port availability)*

### 3. Ambulance Portal Setup
1. Navigate to `/ambulance`.
2. Install Node modules:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *Runs on a secondary local port (e.g., `http://localhost:8081`)*

---

## 🛠️ Technology Stack & Dependencies

- **Backend**: `FastAPI`, `Uvicorn`, `LangGraph`, `LangChain`, `PyMuPDF`, `sentence-transformers`, `torch`
- **Frontend**: `React 19`, `Vite`, `Tailwind CSS`, `Lucide React`, `Zustand`, `Framer Motion`
- **Database (Ephem/Local)**: `SQLite3` (Drizzle config initialized in portal)

