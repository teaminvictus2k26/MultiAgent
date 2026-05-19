# Nexus Multi-Agent System (MediRelay & Travel Planner)

Welcome to the **Nexus Multi-Agent System**, an intelligent, multi-agent workspace and emergency response system powered by **FastAPI**, **LangGraph**, and **React**. 

This system acts as a unified platform featuring an automated medical triage/emergency dispatch pipeline, a robust multi-agent travel planner, real-time doctor/ambulance driver queues, and a flexible document ingestion pipeline powered by LangChain and RAG.

---

## 🌟 Key Features

### 🚑 Emergency & Medical Triage (Nexus MediRelay)
* 📍 **Live Geolocation Intake**: Captures native browser GPS coordinates and auto-resolves addresses to place the emergency case instantly.
* 🏥 **Automated Hospital Routing**: Routes patients to the nearest hospital based on geolocation and bed availability.
* 🤖 **Stateful Multi-Agent Medical Diagnosis**: Analyzes clinical reports, extracts severity metrics, and matches specialists using LangGraph.
* 🛑 **Human-in-the-Loop Triage**: A dedicated Ambulance/Staff Portal pauses the auto-dispatch pipeline at a `PENDING_ACCEPTANCE` state, requiring manual confirmation from a real doctor/driver to proceed.

### ✈️ Multi-Agent Travel Planner
* 🗺️ **Comprehensive Trip Planning**: Simply state your request, and the multi-agent system orchestrates destinations, dates, budgets, flights, and hotels.
* 💰 **Budget Calculation & Reporting**: Generates a detailed budget breakdown for the proposed itinerary.
* 📅 **Detailed Itinerary Generation**: Creates structured, day-by-day travel plans using LLM reasoning.

### 📂 Document Analysis & RAG Chat
* 🔍 **Context-Aware Document Uploader**: Drag-and-drop file analyzer that reads PDFs and extracts relevant context.
* 🧠 **RAG General Doc Search**: Automatically indexes text chunks and returns LLM-backed answers with citations using `TaylorAI/bge-micro-v2` embeddings and a local in-memory vector store.
* 💬 **AI Assistant Chat**: A multi-agent chat interface capable of discussing uploaded documents and general queries.

---

## 🏗️ System Architecture

The project is structured as a monorepo containing three core components:

```text
Aigent/
├── backend/       # FastAPI + LangGraph + LangChain RAG pipeline
├── frontend/      # Vite + React + TypeScript (Main Patient/Workspace UI)
└── ambulance/     # Vite + React + TypeScript (Dedicated Staff Portal)
```

### 1. Backend (`/backend`)
The brain of the system, orchestrating agent workflows and serving API requests.
* **FastAPI**: Serves the REST endpoints for document uploads, real-time chat, travel planning, and emergency dispatch workflows.
* **LangGraph**: Orchestrates stateful multi-agent pipelines (routers, medical analysis agents, task planners, travel planning, and RAG pipelines).
* **RAG & Search**: Uses LangChain's built-in `InMemoryVectorStore` combined with `HuggingFaceEmbeddings` for fast, lightweight local semantic matching.
* **LLM Integrations**: Powered by Groq Cloud (`llama-3.1-8b-instant`) to perform high-speed structured data extraction and logical reasoning.

### 2. Main Frontend (`/frontend`)
The primary user-facing interface for workspace management, document uploads, and trip/emergency requests.
* **React & TypeScript**: Features a gorgeous glassmorphism workspace UI, dynamic chat interfaces, real-time location capture (GPS intake), and responsive tables.
* **Zustand**: Powers cross-component and cross-tab state management, paired with broadcast channels for real-time status syncing.
* **Framer Motion**: Smooth interactive transitions and visual feedback during uploads and routing pipelines.

### 3. Ambulance Staff Portal (`/ambulance`)
A specialized interface built exclusively for Emergency Responders and ER Doctors.
* **Acceptance Loop Interface**: Visualizes the `PENDING_ACCEPTANCE` state, allowing staff to review medical briefs and confirm dispatches before the system finalizes ambulance routing.

---

## 🔌 API Reference (Core Endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Uploads a PDF document, extracts text, and runs the classification & analysis LangGraph pipeline. |
| `POST` | `/chat` | Conversational endpoint supporting history and document context via RAG. |
| `POST` | `/plan_trip` | Multi-agent travel planning endpoint. Returns detailed itineraries, budgets, and booking status. |
| `POST` | `/api/v1/emergency`| Dispatches an emergency relay using raw symptoms and GPS coordinates. |
| `GET` | `/agents/status` | Returns the health and status of the various agents. |

---

## 🛠️ Technology Stack

**Backend**
* **Framework**: FastAPI, Uvicorn
* **AI & Orchestration**: LangGraph, LangChain
* **Embeddings & Vector Store**: `sentence-transformers`, `torch`, HuggingFace `TaylorAI/bge-micro-v2`
* **PDF Processing**: PyMuPDF
* **LLM Provider**: Groq

**Frontend (Main & Ambulance)**
* **Core**: React 19, Vite, TypeScript
* **Styling**: Tailwind CSS, Framer Motion
* **Icons**: Lucide React
* **State Management**: Zustand
* **Database (Local)**: SQLite3 (for portal state caching)

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Python 3.10+** (For the backend)
- **Node.js 18+** (For the frontends)
- **Groq API Key** (Get one at [console.groq.com](https://console.groq.com))

---

### Step 1: Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd f:\Aigent\backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install langchain-community langchain-huggingface
   ```
4. Configure Environment Variables:
   Create a `.env` file in the `/backend` folder and add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn api:app --reload
   ```
   *The API will be available at `http://localhost:8000`*

---

### Step 2: Main Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd f:\Aigent\frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:8080` (or `5173` depending on availability)*

---

### Step 3: Ambulance Staff Portal Setup
1. Open a third terminal and navigate to the ambulance directory:
   ```bash
   cd f:\Aigent\ambulance
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The portal will run on a secondary local port (e.g., `http://localhost:8081`)*

---

## 💡 Usage Workflow

1. **Launch all three servers** (Backend, Frontend, Ambulance Portal).
2. **Open the Main Frontend** in your browser to interact with the system as a user. You can upload documents, chat with the AI, plan a trip, or submit an emergency request.
3. **Submit an Emergency**: When an emergency request is submitted, the LangGraph backend processes the triage and halts.
4. **Open the Ambulance Portal**: Log in as a responder to view the pending triage request, read the LLM-generated brief, and accept the dispatch.
5. **Real-Time Sync**: Watch as the status updates seamlessly across the backend and frontends upon acceptance.

---

*Built with ❤️ utilizing Advanced Agentic Workflows.*
